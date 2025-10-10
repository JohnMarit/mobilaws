import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendMagicLink } from '../services/emailService';

const router = Router();

// In-memory storage for magic link tokens
// In production, use Redis or database with TTL
interface MagicLinkToken {
  email: string;
  type: 'admin' | 'user';
  createdAt: number;
  used: boolean;
}

const magicLinkTokens = new Map<string, MagicLinkToken>();

// Clean up expired tokens (older than 15 minutes)
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  for (const [token, data] of magicLinkTokens.entries()) {
    if (now - data.createdAt > fifteenMinutes) {
      magicLinkTokens.delete(token);
    }
  }
}, 60 * 1000); // Run every minute

/**
 * Request a magic link
 * POST /api/auth/magic-link
 */
router.post('/auth/magic-link', async (req: Request, res: Response) => {
  try {
    const { email, type = 'user' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // For admin emails, verify it's a valid admin email
    if (type === 'admin') {
      // In production, check against database of admin emails
      const validAdminEmails = ['admin@mobilaws.com', 'thuchabraham42@gmail.com'];
      if (!validAdminEmails.includes(email.toLowerCase())) {
        return res.status(403).json({ error: 'Not authorized for admin access' });
      }
    }
    
    // Generate unique token
    const token = uuidv4();
    
    // Store token
    magicLinkTokens.set(token, {
      email: email.toLowerCase(),
      type,
      createdAt: Date.now(),
      used: false
    });
    
    // Send magic link email
    const emailSent = await sendMagicLink({ email, token, type });
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send magic link email' });
    }
    
    console.log(`✅ Magic link generated for ${email} (${type})`);
    
    res.json({
      success: true,
      message: 'Magic link sent! Check your email.',
      // In development, include token for testing
      ...(process.env.NODE_ENV === 'development' && { token })
    });
    
  } catch (error) {
    console.error('❌ Error generating magic link:', error);
    res.status(500).json({ error: 'Failed to generate magic link' });
  }
});

/**
 * Verify magic link token
 * POST /api/auth/verify-magic-link
 */
router.post('/auth/verify-magic-link', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Check if token exists
    const tokenData = magicLinkTokens.get(token);
    
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Check if token has been used
    if (tokenData.used) {
      return res.status(401).json({ error: 'Token has already been used' });
    }
    
    // Check if token is expired (15 minutes)
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (now - tokenData.createdAt > fifteenMinutes) {
      magicLinkTokens.delete(token);
      return res.status(401).json({ error: 'Token has expired' });
    }
    
    // Mark token as used
    tokenData.used = true;
    magicLinkTokens.set(token, tokenData);
    
    // Generate session token (in production, use JWT)
    const sessionToken = uuidv4();
    
    // Create user/admin object
    const userData = {
      id: `user_${Date.now()}`,
      email: tokenData.email,
      type: tokenData.type,
      authenticatedAt: new Date().toISOString()
    };
    
    // For admin type, add admin-specific data
    if (tokenData.type === 'admin') {
      const adminData = {
        id: `admin_${Date.now()}`,
        email: tokenData.email,
        name: 'Admin User',
        role: 'admin',
        permissions: ['users', 'subscriptions', 'support', 'settings'],
        authenticatedAt: new Date().toISOString()
      };
      
      console.log(`✅ Admin authenticated: ${tokenData.email}`);
      
      return res.json({
        success: true,
        type: 'admin',
        admin: adminData,
        token: sessionToken,
        message: 'Admin authentication successful'
      });
    }
    
    console.log(`✅ User authenticated: ${tokenData.email}`);
    
    res.json({
      success: true,
      type: 'user',
      user: userData,
      token: sessionToken,
      message: 'Authentication successful'
    });
    
    // Clean up token after successful verification
    setTimeout(() => {
      magicLinkTokens.delete(token);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error verifying magic link:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

/**
 * Check magic link token status
 * GET /api/auth/magic-link-status/:token
 */
router.get('/auth/magic-link-status/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const tokenData = magicLinkTokens.get(token);
    
    if (!tokenData) {
      return res.json({
        valid: false,
        reason: 'invalid'
      });
    }
    
    if (tokenData.used) {
      return res.json({
        valid: false,
        reason: 'used'
      });
    }
    
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    const expiresAt = tokenData.createdAt + fifteenMinutes;
    
    if (now > expiresAt) {
      return res.json({
        valid: false,
        reason: 'expired'
      });
    }
    
    res.json({
      valid: true,
      email: tokenData.email,
      type: tokenData.type,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking token status:', error);
    res.status(500).json({ error: 'Failed to check token status' });
  }
});

/**
 * Get magic link statistics (admin only)
 * GET /api/auth/magic-link-stats
 */
router.get('/auth/magic-link-stats', async (_req: Request, res: Response) => {
  try {
    const stats = {
      totalTokens: magicLinkTokens.size,
      activeTokens: Array.from(magicLinkTokens.values()).filter(t => !t.used).length,
      usedTokens: Array.from(magicLinkTokens.values()).filter(t => t.used).length,
      adminTokens: Array.from(magicLinkTokens.values()).filter(t => t.type === 'admin').length,
      userTokens: Array.from(magicLinkTokens.values()).filter(t => t.type === 'user').length
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('❌ Error getting magic link stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
