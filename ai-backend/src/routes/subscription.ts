import { Router, Request, Response } from 'express';
import { env } from '../env';

const router = Router();

// In-memory storage for demo purposes
// In production, this would be stored in a database
const subscriptions = new Map<string, any>();

/**
 * Initialize free plan for authenticated users
 * This gives users 5 tokens per day with daily reset
 */
const initializeFreePlan = (userId: string) => {
  const today = new Date().toDateString();
  const existingSub = subscriptions.get(userId);
  
  // Check if user already has a paid subscription
  if (existingSub && existingSub.planId !== 'free') {
    return existingSub;
  }
  
  // Check if we need to reset daily tokens
  if (existingSub && existingSub.planId === 'free') {
    const lastResetDate = new Date(existingSub.lastResetDate).toDateString();
    
    if (lastResetDate !== today) {
      // Reset tokens for new day
      existingSub.tokensRemaining = 5;
      existingSub.tokensUsed = 0;
      existingSub.lastResetDate = new Date().toISOString();
      subscriptions.set(userId, existingSub);
      console.log(`✅ Daily tokens reset for user ${userId}: 5 tokens`);
    }
    
    return existingSub;
  }
  
  // Create new free plan
  const freePlan = {
    planId: 'free',
    tokensRemaining: 5,
    tokensUsed: 0,
    totalTokens: 5,
    purchaseDate: new Date().toISOString(),
    lastResetDate: new Date().toISOString(),
    isActive: true,
    price: 0,
    isFree: true
  };
  
  subscriptions.set(userId, freePlan);
  console.log(`✅ Free plan initialized for user ${userId}: 5 daily tokens`);
  
  return freePlan;
};

/**
 * Get user subscription
 * GET /api/subscription/:userId
 */
router.get('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    let subscription = subscriptions.get(userId);
    
    // If no subscription exists, initialize free plan
    if (!subscription) {
      subscription = initializeFreePlan(userId);
    } else {
      // Check if free plan needs daily reset
      if (subscription.planId === 'free') {
        subscription = initializeFreePlan(userId);
      }
      
      // Check if paid subscription is still valid
      if (subscription.planId !== 'free' && subscription.expiryDate && new Date(subscription.expiryDate) < new Date()) {
        subscription.isActive = false;
        subscriptions.set(userId, subscription);
      }
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
    
    let subscription = subscriptions.get(userId);
    
    // Initialize free plan if no subscription exists
    if (!subscription) {
      subscription = initializeFreePlan(userId);
    }
    
    // Check for daily reset on free plan
    if (subscription.planId === 'free') {
      subscription = initializeFreePlan(userId);
    }
    
    if (!subscription || !subscription.isActive) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        canUseToken: false 
      });
    }
    
    if (subscription.tokensRemaining <= 0) {
      const hoursUntilReset = subscription.planId === 'free' 
        ? getHoursUntilMidnight() 
        : null;
      
      return res.status(400).json({ 
        error: 'No tokens remaining',
        canUseToken: false,
        hoursUntilReset,
        isFree: subscription.planId === 'free'
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
      canUseToken: subscription.tokensRemaining > 0,
      isFree: subscription.planId === 'free',
      lastResetDate: subscription.lastResetDate
    });
  } catch (error) {
    console.error('❌ Error using token:', error);
    res.status(500).json({ error: 'Failed to use token' });
  }
});

/**
 * Helper function to calculate hours until midnight
 */
const getHoursUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
};

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
