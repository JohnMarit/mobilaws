/**
 * Enhanced Authentication Middleware with Firebase Admin SDK
 * Provides secure token verification for user and admin authentication
 */

import { Request, Response, NextFunction } from 'express';
import { getClientIp, logSecurityEvent } from './security';

// Firebase Admin (lazy loaded to avoid startup dependency)
let admin: any = null;

/**
 * Initialize Firebase Admin SDK
 */
async function getFirebaseAdmin() {
  if (admin) return admin;
  
  try {
    // Dynamic import to handle cases where Firebase Admin might not be configured
    const firebaseAdminModule = await import('../lib/firebase-admin');
    admin = firebaseAdminModule.admin;
    
    if (!admin) {
      console.warn('⚠️  Firebase Admin SDK not initialized');
      return null;
    }
    
    return admin;
  } catch (error) {
    console.warn('⚠️  Firebase Admin SDK not available:', error);
    return null;
  }
}

/**
 * Verify Firebase ID Token
 * Use this for user-facing endpoints that require authentication
 */
export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Authorization header must be Bearer token',
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Token is required',
      });
    }

    // Get Firebase Admin
    const firebaseAdmin = await getFirebaseAdmin();
    
    if (!firebaseAdmin) {
      // Fallback: If Firebase Admin is not configured, skip verification in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Firebase Admin not configured - skipping token verification in development');
        (req as any).user = {
          uid: 'dev-user-id',
          email: 'dev@example.com',
        };
        return next();
      }
      
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication service not available',
      });
    }

    // Verify the ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

    // Attach user info to request
    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error: any) {
    // Log security event
    logSecurityEvent('INVALID_TOKEN', {
      error: error.message,
      code: error.code,
    }, req);

    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please sign in again.',
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Token revoked',
        message: 'Your session has been revoked. Please sign in again.',
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid.',
      });
    }

    console.error('❌ Token verification error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to verify authentication token.',
    });
  }
}

/**
 * Optional Firebase authentication
 * Doesn't block request if user is not authenticated, but attaches user if token is valid
 */
export async function optionalFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    const firebaseAdmin = await getFirebaseAdmin();
    
    if (!firebaseAdmin) {
      return next();
    }

    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    // Silent failure - user is simply not authenticated
    next();
  }
}

/**
 * Verify user owns the resource
 * Use this after verifyFirebaseToken to ensure user can only access their own data
 */
export function requireOwnership(userIdParam: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const resourceUserId = req.params[userIdParam];

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
    }

    if (user.uid !== resourceUserId) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        attemptedUserId: resourceUserId,
        actualUserId: user.uid,
      }, req);

      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
}

/**
 * Check if user has verified email
 */
export function requireEmailVerification(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      message: 'Please verify your email address to access this feature',
    });
  }

  next();
}

/**
 * Rate limit per user (requires authentication)
 */
export function userRateLimit(maxRequests: number = 20, windowMs: number = 60000) {
  const userLimits = new Map<string, { count: number; resetTime: number }>();

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of userLimits.entries()) {
      if (value.resetTime < now) {
        userLimits.delete(key);
      }
    }
  }, 60000);

  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const now = Date.now();
    const entry = userLimits.get(user.uid);

    if (!entry || entry.resetTime < now) {
      userLimits.set(user.uid, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `You can make up to ${maxRequests} requests per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    entry.count++;
    userLimits.set(user.uid, entry);

    next();
  };
}

export default {
  verifyFirebaseToken,
  optionalFirebaseAuth,
  requireOwnership,
  requireEmailVerification,
  userRateLimit,
};

