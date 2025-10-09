import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../env';
import { ingest } from '../rag';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Ensure docs directory exists
    if (!fs.existsSync(env.docsPath)) {
      fs.mkdirSync(env.docsPath, { recursive: true });
    }
    cb(null, env.docsPath);
  },
  filename: (_req, file, cb) => {
    // Keep original filename with timestamp to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

/**
 * Upload and index documents
 * POST /api/upload
 */
router.post('/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }
    
    console.log(`📤 Received ${files.length} files for upload`);
    
    // Get file paths
    const filePaths = files.map(file => file.path);
    
    // Ingest files into vector store
    const indexedChunks = await ingest(filePaths);
    
    // Return response
    res.json({
      success: true,
      files: files.map(file => ({
        originalName: file.originalname,
        savedName: file.filename,
        size: file.size,
        path: file.path,
      })),
      indexed_chunks: indexedChunks,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


