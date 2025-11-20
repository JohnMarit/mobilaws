/**
 * Admin Grant Tokens Route
 * Allows admin to manually grant tokens to users who cannot pay online
 */

import { Router, Request, Response } from 'express';
import { adminStorage } from './admin';
import { env } from '../env';

const router = Router();

// Middleware to verify admin access
const verifyAdmin = (req: Request, res: Response, next: Function): void => {
  const adminEmail = req.headers['x-admin-email'] as string;
  const adminToken = req.headers['x-admin-token'] as string;

  if (!adminEmail || !adminToken) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }

  if (!env.adminEmails.includes(adminEmail.toLowerCase())) {
    console.log(`❌ Unauthorized admin access attempt from: ${adminEmail}`);
    res.status(403).json({ error: 'Admin access denied. Email not authorized.' });
    return;
  }

  console.log(`✅ Admin access granted: ${adminEmail}`);
  next();
};

/**
 * Grant tokens to a user
 * POST /api/admin/grant-tokens
 * Body: { userId: string, tokens: number }
 */
router.post('/admin/grant-tokens', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, tokens } = req.body;

    if (!userId || typeof tokens !== 'number' || tokens <= 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Provide userId and positive number of tokens.' 
      });
    }

    console.log(`💎 Admin granting ${tokens} tokens to user ${userId}`);

    // Get or create subscription for user
    let subscription = adminStorage.subscriptions.get(userId);

    if (!subscription) {
      // Create new subscription with granted tokens
      subscription = {
        planId: 'admin_granted',
        tokensRemaining: tokens,
        tokensUsed: 0,
        totalTokens: tokens,
        purchaseDate: new Date().toISOString(),
        isActive: true,
        price: 0, // Admin granted, no payment
        grantedBy: req.headers['x-admin-email'] as string,
        grantedAt: new Date().toISOString(),
      };
    } else {
      // Add tokens to existing subscription
      subscription.tokensRemaining = (subscription.tokensRemaining || 0) + tokens;
      subscription.totalTokens = (subscription.totalTokens || 0) + tokens;
      subscription.isActive = true;
      subscription.grantedBy = req.headers['x-admin-email'] as string;
      subscription.grantedAt = new Date().toISOString();
    }

    adminStorage.subscriptions.set(userId, subscription);

    console.log(`✅ Granted ${tokens} tokens to user ${userId}. Total: ${subscription.tokensRemaining}`);

    res.json({
      success: true,
      message: `Successfully granted ${tokens} tokens to user`,
      subscription: {
        tokensRemaining: subscription.tokensRemaining,
        totalTokens: subscription.totalTokens,
        isActive: subscription.isActive,
      }
    });
  } catch (error) {
    console.error('❌ Error granting tokens:', error);
    res.status(500).json({ error: 'Failed to grant tokens' });
  }
});

export default router;

