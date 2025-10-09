import { Router, Request, Response } from 'express';
import { env } from '../env';

const router = Router();

// In-memory storage for demo purposes
// In production, this would be stored in a database
const subscriptions = new Map<string, any>();

/**
 * Get user subscription
 * GET /api/subscription/:userId
 */
router.get('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const subscription = subscriptions.get(userId);
    
    if (!subscription) {
      return res.json({ subscription: null });
    }
    
    // Check if subscription is still valid
    if (subscription.expiryDate && new Date(subscription.expiryDate) < new Date()) {
      subscription.isActive = false;
      subscriptions.set(userId, subscription);
    }
    
    res.json({ subscription });
  } catch (error) {
    console.error('❌ Error getting subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

/**
 * Create or update user subscription
 * POST /api/subscription/:userId
 */
router.post('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { planId, tokens, price } = req.body;
    
    if (!planId || !tokens || !price) {
      return res.status(400).json({ error: 'Missing required fields: planId, tokens, price' });
    }
    
    // In a real application, this would integrate with a payment processor
    // For demo purposes, we'll simulate a successful purchase
    
    const newSubscription = {
      planId,
      tokensRemaining: tokens,
      tokensUsed: 0,
      totalTokens: tokens,
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      isActive: true,
      price,
      paymentId: `demo_${Date.now()}` // Demo payment ID
    };
    
    subscriptions.set(userId, newSubscription);
    
    console.log(`✅ Subscription created for user ${userId}: ${planId} plan with ${tokens} tokens`);
    
    res.json({ 
      success: true, 
      subscription: newSubscription,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * Use a token from user's subscription
 * POST /api/subscription/:userId/use-token
 */
router.post('/subscription/:userId/use-token', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const subscription = subscriptions.get(userId);
    
    if (!subscription || !subscription.isActive) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        canUseToken: false 
      });
    }
    
    if (subscription.tokensRemaining <= 0) {
      return res.status(400).json({ 
        error: 'No tokens remaining',
        canUseToken: false 
      });
    }
    
    // Deduct one token
    subscription.tokensRemaining -= 1;
    subscription.tokensUsed += 1;
    
    subscriptions.set(userId, subscription);
    
    console.log(`✅ Token used for user ${userId}. Remaining: ${subscription.tokensRemaining}`);
    
    res.json({ 
      success: true, 
      tokensRemaining: subscription.tokensRemaining,
      tokensUsed: subscription.tokensUsed,
      canUseToken: subscription.tokensRemaining > 0
    });
  } catch (error) {
    console.error('❌ Error using token:', error);
    res.status(500).json({ error: 'Failed to use token' });
  }
});

/**
 * Get subscription plans
 * GET /api/subscription/plans
 */
router.get('/subscription/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 5,
        tokens: 50,
        description: 'Perfect for occasional legal queries',
        features: [
          '50 AI tokens',
          'Basic legal document search',
          'Email support',
          'Valid for 30 days'
        ]
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 10,
        tokens: 120,
        description: 'Great for regular legal assistance',
        features: [
          '120 AI tokens',
          'Advanced legal document search',
          'Priority support',
          'Valid for 30 days',
          '20% more tokens than Basic'
        ],
        popular: true
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 30,
        tokens: 500,
        description: 'Best value for heavy legal research',
        features: [
          '500 AI tokens',
          'Full legal document access',
          'Priority support',
          'Valid for 30 days',
          'Best value per token'
        ]
      }
    ];
    
    res.json({ plans });
  } catch (error) {
    console.error('❌ Error getting plans:', error);
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
});

export default router;
