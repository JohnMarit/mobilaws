import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './env';
import { ensureStorageDirectories } from './rag';

// Import routes
import healthRouter from './routes/health';
import uploadRouter from './routes/upload';
import searchRouter from './routes/search';
import chatRouter from './routes/chat';
import subscriptionRouter from './routes/subscription';
import paymentRouter from './routes/payment';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';

const app = express();

// CORS configuration
app.use(cors({
  origin: env.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
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
app.use('/api', authRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Mobilaws AI Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      { method: 'GET', path: '/healthz', description: 'Health check' },
      { method: 'POST', path: '/api/upload', description: 'Upload and index documents' },
      { method: 'GET', path: '/api/search', description: 'Search documents' },
      { method: 'POST', path: '/api/chat', description: 'Chat with streaming SSE responses' },
      { method: 'GET', path: '/api/subscription/plans', description: 'Get subscription plans' },
      { method: 'GET', path: '/api/subscription/:userId', description: 'Get user subscription' },
      { method: 'POST', path: '/api/subscription/:userId', description: 'Create/update subscription' },
      { method: 'POST', path: '/api/subscription/:userId/use-token', description: 'Use subscription token' },
      { method: 'POST', path: '/api/payment/create-intent', description: 'Create payment intent' },
      { method: 'POST', path: '/api/payment/verify', description: 'Verify payment and create subscription' },
      { method: 'GET', path: '/api/payment/status/:paymentIntentId', description: 'Get payment status' },
      { method: 'POST', path: '/api/payment/webhook', description: 'Stripe webhook endpoint' },
    ],
    config: {
      vectorBackend: env.VECTOR_BACKEND,
      llmModel: env.LLM_MODEL,
      embedModel: env.EMBED_MODEL,
      topK: env.TOP_K,
      timezone: env.TZ,
    },
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
    message: env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Initialize server
async function startServer() {
  try {
    // Ensure storage directories exist
    ensureStorageDirectories();
    
    // Start listening
    app.listen(env.PORT, () => {
      console.log('\n🚀 Mobilaws AI Backend Server Started');
      console.log('=====================================');
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Server URL: http://localhost:${env.PORT}`);
      console.log(`🌐 Timezone: ${env.TZ}`);
      console.log(`🧠 LLM Model: ${env.LLM_MODEL}`);
      console.log(`📊 Embedding Model: ${env.EMBED_MODEL}`);
      console.log(`🗄️  Vector Backend: ${env.VECTOR_BACKEND}`);
      console.log(`📁 Documents Directory: ${env.docsPath}`);
      console.log(`🔐 API Key Required: ${env.API_KEY_REQUIRED}`);
      console.log('=====================================');
      console.log('\n✅ Server ready to accept requests\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();


