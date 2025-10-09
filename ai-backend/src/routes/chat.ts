import { Router, Request, Response } from 'express';
import { ask } from '../rag';
import { initSSE, writeEvent, startHeartbeat, setupSSECleanup } from '../sse';
import { env } from '../env';

const router = Router();

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
 * Body: { message: string, convoId?: string }
 */
router.post('/chat', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { message, convoId } = req.body;
    
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required and must be a string' });
      return;
    }
    
    console.log(`💬 Chat request${convoId ? ` (convo: ${convoId})` : ''}: "${message.substring(0, 50)}..."`);
    
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
    
    // Stream the response
    const result = await ask(message, (token: string) => {
      writeEvent(res, 'token', { text: token });
    });
    
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


