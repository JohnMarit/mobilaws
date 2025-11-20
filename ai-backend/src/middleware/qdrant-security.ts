/**
 * Qdrant Security Configuration
 * Ensures secure access to vector database
 */

import { env } from '../env';

/**
 * Get secure Qdrant configuration
 */
export function getQdrantConfig() {
  if (env.VECTOR_BACKEND !== 'qdrant') {
    return null;
  }

  if (!env.QDRANT_URL) {
    throw new Error('QDRANT_URL is required when using Qdrant');
  }

  // Ensure HTTPS in production
  if (env.NODE_ENV === 'production' && !env.QDRANT_URL.startsWith('https://')) {
    console.warn('⚠️  WARNING: Using non-HTTPS Qdrant URL in production!');
  }

  return {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    collection: env.QDRANT_COLLECTION || 'mobilaws_legal',
  };
}

/**
 * Validate Qdrant query parameters to prevent injection
 */
export function validateQdrantQuery(query: any): boolean {
  // Ensure query is a string
  if (typeof query !== 'string') {
    return false;
  }

  // Maximum query length
  if (query.length > 5000) {
    return false;
  }

  // Prevent special characters that might cause issues
  const dangerousPatterns = [
    /[\x00-\x1F\x7F]/,  // Control characters
    /<script/i,          // Script tags
    /javascript:/i,      // Javascript protocol
  ];

  return !dangerousPatterns.some(pattern => pattern.test(query));
}

/**
 * Sanitize vector search results
 * Remove any sensitive metadata before returning to client
 */
export function sanitizeVectorResults(results: any[]): any[] {
  return results.map(result => ({
    id: result.id,
    score: result.score,
    payload: sanitizePayload(result.payload),
  }));
}

/**
 * Sanitize payload to remove sensitive fields
 */
function sanitizePayload(payload: any): any {
  if (!payload) return {};

  const { 
    // Remove any internal or sensitive fields
    _internal,
    _metadata,
    _private,
    apiKey,
    token,
    password,
    secret,
    ...safePayload 
  } = payload;

  return safePayload;
}

/**
 * Rate limiting for vector searches
 * Prevent excessive database queries
 */
const vectorSearchLimits = new Map<string, { count: number; resetTime: number }>();

export function checkVectorSearchLimit(clientId: string, maxSearches: number = 30, windowMs: number = 60000): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = vectorSearchLimits.get(clientId);

  // Clean up old entries
  if (vectorSearchLimits.size > 1000) {
    for (const [key, value] of vectorSearchLimits.entries()) {
      if (value.resetTime < now) {
        vectorSearchLimits.delete(key);
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    vectorSearchLimits.set(clientId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxSearches - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= maxSearches) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  vectorSearchLimits.set(clientId, entry);

  return {
    allowed: true,
    remaining: maxSearches - entry.count,
    resetTime: entry.resetTime,
  };
}

export default {
  getQdrantConfig,
  validateQdrantQuery,
  sanitizeVectorResults,
  checkVectorSearchLimit,
};

