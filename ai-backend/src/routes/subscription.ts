import { Router, Request, Response } from 'express';
import { adminStorage } from './admin';
import { getSubscription, saveSubscription, updateSubscriptionTokens, Subscription } from '../lib/subscription-storage';

const router = Router();

// Use shared in-memory storage from admin router so admin endpoints see updates
const subscriptions = adminStorage.subscriptions;

/**
 * Initialize free plan for authenticated users
 * This gives users 5 tokens per day with daily reset
 */
const initializeFreePlan = async (userId: string): Promise<Subscription | null> => {
  const today = new Date().toDateString();
  
  // Try to get subscription from Firestore first
  let existingSub = await getSubscription(userId);
  
  // Fallback to in-memory if Firestore is not available
  if (!existingSub) {
    existingSub = subscriptions.get(userId);
  }
  
  // Check if user already has a paid subscription
  if (existingSub && existingSub.planId !== 'free') {
    return existingSub;
  }
  
  // Check if we need to reset daily tokens
  if (existingSub && existingSub.planId === 'free') {
    const lastResetDate = new Date(existingSub.lastResetDate || '').toDateString();
    
    if (lastResetDate !== today) {
      // Reset tokens for new day
      const updatedSub = {
        ...existingSub,
        tokensRemaining: 5,
        tokensUsed: 0,
        lastResetDate: new Date().toISOString(),
      };
      
      // Save to Firestore
      await saveSubscription(updatedSub);
      
      // Get the saved version with timestamps from Firestore
      const refreshedSub = await getSubscription(userId);
      if (refreshedSub) {
        // Also update in-memory with the Firestore version
        subscriptions.set(userId, refreshedSub);
        console.log(`✅ Daily tokens reset for user ${userId}: 5 tokens`);
        return refreshedSub;
      }
    }
    
    return existingSub;
  }
  
  // Create new free plan (without timestamps - saveSubscription will add them)
  const freePlanData = {
    userId,
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
  
  // Save to Firestore (this adds createdAt/updatedAt)
  await saveSubscription(freePlanData);
  console.log(`✅ Free plan initialized for user ${userId}: 5 daily tokens`);
  
  // Get the saved version with timestamps from Firestore
  const savedFreePlan = await getSubscription(userId);
  
  // Also update in-memory with the Firestore version
  if (savedFreePlan) {
    subscriptions.set(userId, savedFreePlan);
  }
  
  return savedFreePlan;
};

/**
 * Get user subscription
 * GET /api/subscription/:userId
 */
router.get('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    console.log(`📊 Fetching subscription for user: ${userId}`);
    
    // ALWAYS try Firestore first (most up-to-date data, especially after payments)
    let subscription = await getSubscription(userId);
    
    if (subscription) {
      console.log(`✅ Found subscription in Firestore for ${userId}: ${subscription.planId} (${subscription.tokensRemaining} tokens)`);
      
      // Sync to in-memory cache
      subscriptions.set(userId, subscription);
    } else {
      console.log(`⚠️  No subscription in Firestore for ${userId}, checking in-memory...`);
      
      // Fallback to in-memory
      subscription = subscriptions.get(userId);
      
      if (subscription) {
        console.log(`✅ Found subscription in memory for ${userId}: ${subscription.planId}`);
      }
    }
    
    // If no subscription exists, initialize free plan
    if (!subscription) {
      console.log(`🆓 No subscription found for ${userId}, initializing free plan...`);
      subscription = await initializeFreePlan(userId);
    } else {
      // Check if paid/granted subscription has expired
      if (subscription && subscription.planId !== 'free' && subscription.expiryDate && new Date(subscription.expiryDate) < new Date()) {
        console.log(`⏰ Subscription expired for user ${userId}, falling back to free plan`);
        // Mark expired subscription as inactive
        const updatedSub = {
          ...subscription,
          isActive: false,
        };
        await saveSubscription(updatedSub);
        
        // Initialize free plan for expired subscription
        subscription = await initializeFreePlan(userId);
      }
      // ONLY reset tokens if user has a true free plan (not admin_granted or paid)
      else if (subscription.planId === 'free' && subscription.isFree === true) {
        subscription = await initializeFreePlan(userId);
      }
    }
    
    console.log(`📤 Returning subscription for ${userId}: ${subscription?.planId} (active: ${subscription?.isActive})`);
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
    
    const newSubscriptionData = {
      userId,
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
    
    // Save to Firestore (this adds createdAt/updatedAt)
    await saveSubscription(newSubscriptionData);
    // Also update in-memory
    subscriptions.set(userId, newSubscriptionData);
    
    console.log(`✅ Subscription created for user ${userId}: ${planId} plan with ${tokens} tokens`);
    
    res.json({ 
      success: true, 
      subscription: newSubscriptionData,
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
    
    // Try to get from Firestore first
    let subscription = await getSubscription(userId);
    
    // Fallback to in-memory
    if (!subscription) {
      subscription = subscriptions.get(userId);
    }
    
    // Initialize free plan if no subscription exists
    if (!subscription) {
      subscription = await initializeFreePlan(userId);
    }
    
    // Check if subscription has expired (for paid/granted plans)
    if (subscription && subscription.planId !== 'free' && subscription.expiryDate && new Date(subscription.expiryDate) < new Date()) {
      console.log(`⏰ Subscription expired for user ${userId}, falling back to free plan`);
      // Mark as inactive and fall back to free plan
      subscription.isActive = false;
      await saveSubscription(subscription);
      subscription = await initializeFreePlan(userId);
    }
    
    // ONLY reset free tokens if this is a TRUE free plan (not admin_granted or paid)
    if (subscription && subscription.planId === 'free' && subscription.isFree === true) {
      subscription = await initializeFreePlan(userId);
    }
    
    if (!subscription || !subscription.isActive) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        canUseToken: false 
      });
    }
    
    if (subscription.tokensRemaining <= 0) {
      // For free plans, show hours until reset; for others, no reset
      const hoursUntilReset = (subscription.planId === 'free' && subscription.isFree === true)
        ? getHoursUntilMidnight() 
        : null;
      
      return res.status(400).json({ 
        error: 'No tokens remaining',
        canUseToken: false,
        hoursUntilReset,
        isFree: subscription.isFree === true,
        planId: subscription.planId
      });
    }
    
    // Deduct one token
    subscription.tokensRemaining -= 1;
    subscription.tokensUsed += 1;
    
    // Save to Firestore
    await updateSubscriptionTokens(userId, subscription.tokensRemaining, subscription.tokensUsed);
    // Also update in-memory
    subscriptions.set(userId, subscription);
    
    console.log(`✅ Token used for user ${userId} (${subscription.planId}). Remaining: ${subscription.tokensRemaining}`);
    
    res.json({ 
      success: true, 
      tokensRemaining: subscription.tokensRemaining,
      tokensUsed: subscription.tokensUsed,
      canUseToken: subscription.tokensRemaining > 0,
      isFree: subscription.isFree === true,
      planId: subscription.planId,
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
        price: 600, // KSh 600
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
        price: 1350, // KSh 1,350
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
        price: 4000, // KSh 4,000
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
