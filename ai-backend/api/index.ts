import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Initialize Firebase Admin early
import { initializeFirebaseAdmin } from '../src/lib/firebase-admin';
initializeFirebaseAdmin();

// Import routes
import healthRouter from '../src/routes/health';
import uploadRouter from '../src/routes/upload';
import searchRouter from '../src/routes/search';
import chatRouter from '../src/routes/chat';
import subscriptionRouter from '../src/routes/subscription';
import paymentRouter from '../src/routes/payment';
import adminRouter from '../src/routes/admin';
import usersRouter from '../src/routes/users';
import authRouter from '../src/routes/auth';
import firebaseSyncRouter from '../src/routes/firebase-sync';
import adminGrantRouter from '../src/routes/admin-grant';
import leaderboardRouter from '../src/routes/leaderboard';
import learningRouter from '../src/routes/learning';
import tutorAdminRouter from '../src/routes/tutor-admin';
import aiLessonsRouter from '../src/routes/ai-lessons';
import userLessonsRouter from '../src/routes/user-lessons';
import pushRouter from '../src/routes/push';
import counselRouter from '../src/routes/counsel';
import counselChatRouter from '../src/routes/counsel-chat';
import documentMigrationRouter from '../src/routes/document-migration';

const app = express();

// Parse CORS origins from environment
const corsOriginsString = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://www.mobilaws.com,https://mobilaws.com,https://mobilaws-ympe.vercel.app';
const corsOrigins = corsOriginsString.split(',').map(origin => origin.trim());

console.log('🌐 CORS Origins:', corsOrigins);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Always allow - this is a public API
    // Log origin for debugging
    if (origin) {
      console.log(`📨 Request from origin: ${origin}`);
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Email', 'X-Admin-Token', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Apply CORS to all routes
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/', healthRouter);
app.use('/api', uploadRouter);
app.use('/api', searchRouter);
app.use('/api', chatRouter);
app.use('/api', subscriptionRouter);
app.use('/api', paymentRouter);
app.use('/api', adminRouter);
app.use('/api', usersRouter);
app.use('/api', authRouter);
app.use('/api', firebaseSyncRouter);
app.use('/api', adminGrantRouter);
app.use('/api', leaderboardRouter);
app.use('/api', learningRouter);
app.use('/api', tutorAdminRouter);
app.use('/api', aiLessonsRouter);
app.use('/api', userLessonsRouter);
app.use('/api', pushRouter);
app.use('/api/counsel', counselRouter);
app.use('/api/counsel', counselChatRouter);
app.use('/api', documentMigrationRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Mobilaws AI Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      { method: 'GET', path: '/healthz', description: 'Health check' },
      { method: 'GET', path: '/api/env-check', description: 'Check environment configuration' },
      { method: 'POST', path: '/api/upload', description: 'Upload and index documents' },
      { method: 'GET', path: '/api/search', description: 'Search documents' },
      { method: 'POST', path: '/api/chat', description: 'Chat with streaming SSE responses' },
      { method: 'GET', path: '/api/subscription/plans', description: 'Get subscription plans' },
      { method: 'GET', path: '/api/subscription/:userId', description: 'Get user subscription' },
      { method: 'POST', path: '/api/subscription/:userId', description: 'Create/update subscription' },
      { method: 'POST', path: '/api/users/sync', description: 'Sync user to backend' },
      { method: 'GET', path: '/api/admin/users', description: 'Get all users (admin)' },
      { method: 'GET', path: '/api/admin/stats', description: 'Get admin statistics' },
      { method: 'POST', path: '/api/auth/admin/google', description: 'Admin Google OAuth' },
      { method: 'GET', path: '/api/firebase-sync/users', description: 'Sync all Firebase Auth users to backend' },
      { method: 'POST', path: '/api/admin/grant-tokens', description: 'Admin grant tokens to users' },
      { method: 'GET', path: '/api/leaderboard', description: 'Get leaderboard entries' },
      { method: 'POST', path: '/api/leaderboard/update', description: 'Update leaderboard entry' },
      { method: 'POST', path: '/api/leaderboard/init', description: 'Initialize leaderboard entry' },
      { method: 'POST', path: '/api/leaderboard/populate', description: 'Populate leaderboard' },
      { method: 'GET', path: '/api/learning/progress/:userId', description: 'Get learning progress' },
      { method: 'POST', path: '/api/learning/progress', description: 'Save learning progress' },
      { method: 'POST', path: '/api/ai-lessons/generate', description: 'Generate additional lessons using AI' },
      { method: 'POST', path: '/api/ai-lessons/request-more', description: 'Request more lessons for a module' },
      { method: 'GET', path: '/api/user-lessons/:userId', description: 'Get all user-specific lessons' },
      { method: 'GET', path: '/api/user-lessons/:userId/:moduleId', description: 'Get user-specific lessons for a module' },
      { method: 'GET', path: '/api/counsel/config', description: 'Get counsel booking config (states, categories)' },
      { method: 'POST', path: '/api/counsel/request', description: 'Create a counsel request' },
      { method: 'POST', path: '/api/counsel/counselor/apply', description: 'Apply to become a counselor' },
      { method: 'GET', path: '/api/counsel/counselor/status/:userId', description: 'Get counselor application status' },
      { method: 'GET', path: '/api/counsel/admin/applications/pending', description: 'Admin: Get pending applications' },
      { method: 'POST', path: '/api/counsel/admin/approve/:counselorId', description: 'Admin: Approve a counselor' },
      { method: 'POST', path: '/api/counsel/admin/reject/:counselorId', description: 'Admin: Reject a counselor' },
    ],
  });
});

// Environment check endpoint
app.get('/api/env-check', (_req: Request, res: Response) => {
  const openaiKeyExists = !!process.env.OPENAI_API_KEY;
  const openaiKeyLength = process.env.OPENAI_API_KEY?.length || 0;
  const openaiKeyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || 'NOT_SET';

  // Check vector backend configuration
  const vectorBackend = process.env.VECTOR_BACKEND || 'chroma';
  const vectorConfig: any = {
    backend: vectorBackend,
    configured: false,
    issue: '',
  };

  if (vectorBackend === 'chroma') {
    vectorConfig.issue = 'Chroma requires external server - not compatible with Vercel serverless';
    vectorConfig.recommendation = 'Switch to Qdrant Cloud (free tier available) or host Chroma separately';
  } else if (vectorBackend === 'qdrant') {
    vectorConfig.configured = !!process.env.QDRANT_URL;
    vectorConfig.url = process.env.QDRANT_URL ? '***configured***' : 'NOT_SET';
  } else if (vectorBackend === 'pinecone') {
    vectorConfig.configured = !!process.env.PINECONE_API_KEY;
    vectorConfig.status = 'Temporarily disabled in code';
  }

  res.json({
    status: 'Environment Check',
    openai: {
      keyExists: openaiKeyExists,
      keyLength: openaiKeyLength,
      keyPrefix: openaiKeyPrefix,
      isValid: openaiKeyExists && openaiKeyLength > 20 && openaiKeyPrefix.startsWith('sk-'),
    },
    vectorStore: vectorConfig,
    llmModel: process.env.LLM_MODEL || 'NOT_SET',
    embedModel: process.env.EMBED_MODEL || 'NOT_SET',
    corsOrigins: process.env.CORS_ORIGINS || 'NOT_SET',
    frontendUrl: process.env.FRONTEND_URL || 'NOT_SET',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Server error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Export the Express app for Vercel
export default app;

