import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ask } from '../rag';
import { initSSE, writeEvent, startHeartbeat, setupSSECleanup } from '../sse';
import { env } from '../env';
import { adminStorage } from './admin';
import { processImage, isImageFile } from '../utils/image-processor';
import { loadFile } from '../rag/loaders';

const router = Router();

// Configure multer for file uploads (temporary storage)
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'tmp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max per file
  },
  fileFilter: (_req, file, cb) => {
    // Allow images and documents
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Allowed types: ${allowedExts.join(', ')}`));
    }
  },
});

/**
 * Middleware to verify API key if required
 */
function verifyApiKey(req: Request, res: Response, next: () => void): void {
  if (!env.API_KEY_REQUIRED) {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey || apiKey !== env.API_KEY_SECRET) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }

  next();
}

/**
 * Chat endpoint with SSE streaming
 * POST /api/chat
 * Body: { message: string, convoId?: string } or multipart/form-data with files
 */
router.post('/chat', verifyApiKey, upload.any(), async (req: Request, res: Response) => {
  try {
    // Handle both JSON and multipart/form-data
    let message: string;
    let convoId: string | undefined;
    let userId: string | undefined;
    let previousResponse: string | undefined;
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> | undefined;

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Multipart form data
      message = req.body.message || '';
      convoId = req.body.convoId;
      userId = req.body.userId;
      previousResponse = req.body.previousResponse;
      // Parse conversationHistory if provided (it's sent as JSON string in form data)
      conversationHistory = req.body.conversationHistory ? JSON.parse(req.body.conversationHistory) : undefined;
    } else {
      // JSON body
      message = req.body.message;
      convoId = req.body.convoId;
      userId = req.body.userId;
      previousResponse = req.body.previousResponse;
      conversationHistory = req.body.conversationHistory;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required and must be a string' });
      return;
    }

    // Process uploaded files
    const files = req.files as Express.Multer.File[] || [];
    let processedContent = message;

    if (files.length > 0) {
      console.log(`📎 Processing ${files.length} file(s) with message`);

      const fileContents: string[] = [];

      for (const file of files) {
        try {
          if (isImageFile(file.originalname)) {
            // Process image with OpenAI Vision
            console.log(`🖼️ Processing image: ${file.originalname}`);
            const imageAnalysis = await processImage(file.path, message);
            fileContents.push(`[Image: ${file.originalname}]\n${imageAnalysis}`);
          } else {
            // Process document (PDF, DOCX, etc.)
            console.log(`📄 Processing document: ${file.originalname}`);
            const documents = await loadFile(file.path);
            const extractedText = documents.map(doc => doc.pageContent).join('\n\n');
            fileContents.push(`[Document: ${file.originalname}]\n${extractedText}`);
          }

          // Clean up temp file
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.warn('Failed to delete temp file:', e);
          }
        } catch (fileError) {
          console.error(`❌ Error processing file ${file.originalname}:`, fileError);
          // Continue with other files
        }
      }

      // Combine message with file contents
      if (fileContents.length > 0) {
        processedContent = `${message}\n\n[Attached Files Analysis]\n${fileContents.join('\n\n---\n\n')}`;
      }
    }

    console.log(`💬 Chat request${convoId ? ` (convo: ${convoId})` : ''}${userId ? ` (user: ${userId})` : ' (anonymous)'}: "${message.substring(0, 50)}..."${files.length > 0 ? ` with ${files.length} file(s)` : ''}`);

    // Track prompt for admin stats - CRITICAL: This counts all prompts continuously
    // Uses Firestore for persistent storage (survives serverless restarts)
    try {
      if (userId) {
        // Signed-up user prompt
        console.log(`📊 Tracking authenticated user prompt for: ${userId}`);
        await adminStorage.trackPrompt(userId, false);
      } else {
        // Anonymous user prompt
        console.log(`📊 Tracking anonymous user prompt`);
        await adminStorage.trackPrompt('anonymous', true);
      }
    } catch (error) {
      console.error('❌ Error tracking prompt:', error);
      // Don't fail the request if tracking fails
    }

    // Initialize SSE
    initSSE(res);

    // Start heartbeat to keep connection alive
    const heartbeatInterval = startHeartbeat(res);

    // Setup cleanup on connection close
    setupSSECleanup(res, heartbeatInterval, () => {
      console.log('🔌 SSE connection closed');
    });

    // Send metadata event
    writeEvent(res, 'metadata', { convoId: convoId || null, timestamp: new Date().toISOString() });

    // Stream the response (use processed content which includes file analysis)
    // Pass previousResponse if available for modification requests
    // Pass conversationHistory for context-aware responses
    const result = await ask(processedContent, (token: string) => {
      writeEvent(res, 'token', { text: token });
    }, previousResponse, conversationHistory);

    // Send citations and done event
    writeEvent(res, 'done', { citations: result.citations });

    // Close the stream
    clearInterval(heartbeatInterval);
    res.end();

    console.log(`✅ Chat response completed with ${result.citations.length} citations`);
  } catch (error) {
    console.error('❌ Chat error:', error);

    // Send error event if stream is still open
    try {
      writeEvent(res, 'error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      res.end();
    } catch (streamError) {
      // Connection already closed
      console.error('❌ Failed to send error event:', streamError);
    }
  }
});

export default router;


