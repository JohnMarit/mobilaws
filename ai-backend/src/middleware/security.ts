/**
 * Security Middleware for Backend API
 * Implements rate limiting, input validation, authentication, and other security measures
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../env';

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Rate limiting middleware
 * Default: 100 requests per 15 minutes per IP
 */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
} = { windowMs: 15 * 60 * 1000, max: 100 }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const entry = rateLimitStore.get(clientIp);

    // Check if IP is blocked
    if (entry?.blocked && entry.resetTime > now) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'You have been temporarily blocked due to excessive requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    if (!entry || entry.resetTime < now) {
      rateLimitStore.set(clientIp, {
        count: 1,
        resetTime: now + options.windowMs,
        blocked: false,
      });
      return next();
    }

    if (entry.count >= options.max) {
      // Block for 1 hour if exceeded
      entry.blocked = true;
      entry.resetTime = now + 3600000; // 1 hour
      rateLimitStore.set(clientIp, entry);

      console.warn(`⚠️  Rate limit exceeded for IP: ${clientIp}`);

      return res.status(429).json({
        error: 'Too many requests',
        message: options.message || 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    entry.count++;
    rateLimitStore.set(clientIp, entry);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', options.max - entry.count);
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    next();
  };
}

/**
 * Strict rate limiter for sensitive endpoints (e.g., login, payment)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts. Please wait before trying again.',
});

/**
 * Moderate rate limiter for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded.',
});

/**
 * Loose rate limiter for public endpoints
 */
export const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests.',
});

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .slice(0, 10000); // Max length
}

/**
 * Validate and sanitize request body
 */
export function validateRequestBody(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      // Check content type
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(415).json({ error: 'Content-Type must be application/json' });
      }

      // Check body size (already limited by express.json, but double-check)
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > 20 * 1024 * 1024) { // 20MB
        return res.status(413).json({ error: 'Request body too large' });
      }

      // Sanitize string fields recursively
      req.body = sanitizeObject(req.body);

      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
  } else {
    next();
  }
}

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Detect SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|TRUNCATE)\b)/i,
    /(\bOR\b|\bAND\b)\s+['"]\s*=\s*['"]/i,
    /[';]--/,
    /xp_\w+/i,
    /sp_\w+/i,
    /\bOR\b\s+\d+\s*=\s*\d+/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Middleware to detect SQL injection in request
 */
export function preventSQLInjection(req: Request, res: Response, next: NextFunction) {
  const checkForInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      if (detectSQLInjection(obj)) {
        console.warn(`⚠️  SQL Injection attempt detected from IP: ${getClientIp(req)}`);
        console.warn(`   Suspicious input: ${obj.slice(0, 100)}`);
        return true;
      }
    } else if (Array.isArray(obj)) {
      return obj.some(item => checkForInjection(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.values(obj).some(value => checkForInjection(value));
    }
    return false;
  };

  if (checkForInjection(req.body) || checkForInjection(req.query) || checkForInjection(req.params)) {
    return res.status(400).json({ 
      error: 'Invalid input detected',
      message: 'Your request contains potentially malicious content.'
    });
  }

  next();
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Add comprehensive security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HTTPS only)
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none';");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove powered-by header
  res.removeHeader('X-Powered-By');

  next();
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Verify admin authentication
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminEmail = req.headers['x-admin-email'] as string;
  const adminToken = req.headers['x-admin-token'] as string;

  if (!adminEmail || !adminToken) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Admin credentials not provided'
    });
  }

  // Verify email is in whitelist
  if (!env.adminEmails.includes(adminEmail.toLowerCase())) {
    console.warn(`⚠️  Unauthorized admin access attempt from: ${adminEmail} (IP: ${getClientIp(req)})`);
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You are not authorized to access this resource'
    });
  }

  // In production, verify JWT token here
  // For now, we'll trust the email whitelist + token presence
  
  // Attach admin info to request
  (req as any).admin = {
    email: adminEmail,
    role: 'admin'
  };

  next();
}

/**
 * Verify user authentication (for user endpoints)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Authorization header missing or invalid'
    });
  }

  // In production, verify Firebase ID token here
  const token = authHeader.substring(7);
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Token is required'
    });
  }

  // TODO: Verify Firebase token
  // For now, accept any valid-looking token
  (req as any).user = {
    uid: 'user-id-from-token',
    email: 'user@example.com'
  };

  next();
}

/**
 * Optional authentication (doesn't block if not authenticated)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    if (token) {
      // TODO: Verify Firebase token
      (req as any).user = {
        uid: 'user-id-from-token',
        email: 'user@example.com'
      };
    }
  }

  next();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get client IP address (considering proxies)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }
  
  return req.headers['x-real-ip'] as string || 
         req.socket.remoteAddress || 
         'unknown';
}

/**
 * Log security events
 */
export function logSecurityEvent(event: string, details: any, req: Request) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
    details
  };
  
  console.warn('🔒 SECURITY EVENT:', JSON.stringify(logEntry));
  
  // In production, send to security monitoring service
  // e.g., Sentry, DataDog, CloudWatch, etc.
}

// ============================================================================
// REQUEST LOGGING (Security Audit Trail)
// ============================================================================

export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Log request
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
  };
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('🔒 UNAUTHORIZED ACCESS ATTEMPT:', {
        ...logData,
        statusCode: res.statusCode,
        duration
      });
    } else if (res.statusCode === 429) {
      console.warn('🔒 RATE LIMIT EXCEEDED:', {
        ...logData,
        statusCode: res.statusCode,
        duration
      });
    } else if (res.statusCode >= 500) {
      console.error('🔒 SERVER ERROR:', {
        ...logData,
        statusCode: res.statusCode,
        duration
      });
    }
  });
  
  next();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  rateLimit,
  strictRateLimit,
  apiRateLimit,
  publicRateLimit,
  validateRequestBody,
  preventSQLInjection,
  securityHeaders,
  requireAdmin,
  requireAuth,
  optionalAuth,
  securityLogger,
  sanitizeString,
  detectSQLInjection,
  getClientIp,
  logSecurityEvent,
};

