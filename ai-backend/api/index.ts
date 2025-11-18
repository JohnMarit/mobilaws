import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

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

const app = express();

// Parse CORS origins from environment
const corsOriginsString = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173';
const corsOrigins = corsOriginsString.split(',').map(origin => origin.trim());

console.log('🌐 CORS Origins:', corsOrigins);

// CORS configuration
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Email', 'X-Admin-Token'],
}));

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
    ],
  });
});

// Environment check endpoint
app.get('/api/env-check', (_req: Request, res: Response) => {
  const openaiKeyExists = !!process.env.OPENAI_API_KEY;
  const openaiKeyLength = process.env.OPENAI_API_KEY?.length || 0;
  const openaiKeyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || 'NOT_SET';
  
  res.json({
    status: 'Environment Check',
    openai: {
      keyExists: openaiKeyExists,
      keyLength: openaiKeyLength,
      keyPrefix: openaiKeyPrefix,
      isValid: openaiKeyExists && openaiKeyLength > 20 && openaiKeyPrefix.startsWith('sk-'),
    },
    llmModel: process.env.LLM_MODEL || 'NOT_SET',
    embedModel: process.env.EMBED_MODEL || 'NOT_SET',
    vectorBackend: process.env.VECTOR_BACKEND || 'NOT_SET',
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

