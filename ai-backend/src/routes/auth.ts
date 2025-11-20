/**
 * Authentication Routes
 * Handles admin and user authentication via Google OAuth
 */

import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../env';
import { strictRateLimit } from '../middleware/security';

const router = Router();

// Initialize Google OAuth client
let googleClient: OAuth2Client | null = null;

if (env.GOOGLE_CLIENT_ID) {
  googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  console.log('✅ Google OAuth client initialized');
} else {
  console.warn('⚠️  GOOGLE_CLIENT_ID not set. Google OAuth will not work.');
}

/**
 * Verify Google OAuth token
 * POST /api/auth/verify-token
 */
router.post('/auth/verify-token', strictRateLimit, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!googleClient) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Google OAuth is not configured'
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is an admin
    const isAdmin = env.adminEmails.includes(payload.email?.toLowerCase() || '');

    res.json({
      success: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
        isAdmin,
      }
    });
  } catch (error: any) {
    console.error('❌ Token verification error:', error);
    
    if (error.message?.includes('Token used too late')) {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your authentication token has expired. Please sign in again.'
      });
    }

    res.status(401).json({ 
      error: 'Invalid token',
      message: 'Unable to verify your authentication token.'
    });
  }
});

/**
 * Admin Google OAuth login
 * POST /api/auth/admin/google
 */
router.post('/auth/admin/google', strictRateLimit, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!googleClient) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Google OAuth is not configured'
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is in admin whitelist
    if (!env.adminEmails.includes(payload.email.toLowerCase())) {
      console.warn(`⚠️  Unauthorized admin access attempt: ${payload.email}`);
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You are not authorized to access the admin panel.'
      });
    }

    // Generate admin session token (in production, use JWT)
    const sessionToken = generateSessionToken();

    console.log(`✅ Admin login successful: ${payload.email}`);

    res.json({
      success: true,
      admin: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage_users', 'manage_subscriptions'],
      },
      token: sessionToken,
    });
  } catch (error: any) {
    console.error('❌ Admin login error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Unable to verify your credentials.'
    });
  }
});

/**
 * Generate a session token
 * In production, this should be a proper JWT with expiration
 */
function generateSessionToken(): string {
  // Generate a random token
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify admin session
 * POST /api/auth/admin/verify
 */
router.post('/auth/admin/verify', async (req: Request, res: Response) => {
  try {
    const adminEmail = req.headers['x-admin-email'] as string;
    const adminToken = req.headers['x-admin-token'] as string;

    if (!adminEmail || !adminToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify admin email is in whitelist
    if (!env.adminEmails.includes(adminEmail.toLowerCase())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // In production, verify JWT token here
    // For now, we trust the email whitelist

    res.json({
      success: true,
      admin: {
        email: adminEmail,
        role: 'admin',
      }
    });
  } catch (error) {
    console.error('❌ Session verification error:', error);
    res.status(401).json({ error: 'Invalid session' });
  }
});

/**
 * Logout (invalidate session)
 * POST /api/auth/logout
 */
router.post('/auth/logout', (req: Request, res: Response) => {
  // In production, invalidate JWT token here
  // For now, just acknowledge the logout
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
