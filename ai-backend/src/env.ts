import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables
config();

// Validate and parse environment variables
const envSchema = z.object({
  // Server
  PORT: z.string().default('8000').transform(Number),
  TZ: z.string().default('Africa/Juba'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  LLM_MODEL: z.string().default('gpt-4o'),
  EMBED_MODEL: z.string().default('text-embedding-3-large'),

  // Vector Store
  VECTOR_BACKEND: z.enum(['chroma', 'pinecone', 'qdrant']).default('chroma'),
  CHROMA_DIR: z.string().default('./storage/chroma'),
  DOCS_DIR: z.string().default('./storage/documents'),

  // Pinecone (optional)
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_ENV: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),

  // Qdrant (optional)
  QDRANT_URL: z.string().optional(),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION: z.string().default('mobilaws_legal'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // API Security
  API_KEY_REQUIRED: z.string().default('false').transform(val => val === 'true'),
  API_KEY_SECRET: z.string().optional(),

  // Stripe Payment Gateway
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email Configuration
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().default('587').transform(Number),
  EMAIL_SECURE: z.string().default('false').transform(val => val === 'true'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@mobilaws.com'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Admin Configuration
  ADMIN_EMAILS: z.string().default('thuchabraham42@gmail.com'),
  GOOGLE_CLIENT_ID: z.string().optional(),

  // LLM Parameters
  TEMPERATURE: z.string().default('0.1').transform(Number),
  MAX_TOKENS: z.string().default('1024').transform(Number),
  TOP_K: z.string().default('5').transform(Number),
  CHUNK_SIZE: z.string().default('1000').transform(Number),
  CHUNK_OVERLAP: z.string().default('150').transform(Number),
});

// Parse and export config
let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Additional validation
if (parsedEnv.API_KEY_REQUIRED && !parsedEnv.API_KEY_SECRET) {
  console.error('❌ API_KEY_SECRET is required when API_KEY_REQUIRED=true');
  process.exit(1);
}

if (parsedEnv.VECTOR_BACKEND === 'pinecone') {
  if (!parsedEnv.PINECONE_API_KEY || !parsedEnv.PINECONE_ENV || !parsedEnv.PINECONE_INDEX) {
    console.error('❌ PINECONE_API_KEY, PINECONE_ENV, and PINECONE_INDEX are required when VECTOR_BACKEND=pinecone');
    process.exit(1);
  }
}

if (parsedEnv.VECTOR_BACKEND === 'qdrant') {
  if (!parsedEnv.QDRANT_URL) {
    console.error('❌ QDRANT_URL is required when VECTOR_BACKEND=qdrant');
    process.exit(1);
  }
}

// Set timezone
process.env.TZ = parsedEnv.TZ;

export const env = {
  ...parsedEnv,
  // Computed values
  corsOrigins: parsedEnv.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  chromaPath: path.resolve(process.cwd(), parsedEnv.CHROMA_DIR),
  docsPath: path.resolve(process.cwd(), parsedEnv.DOCS_DIR),
  adminEmails: parsedEnv.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase()),
};

export type Env = typeof env;


