import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../env';
import { adminStorage } from './admin';

const router = Router();

// Initialize Stripe with secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key', {
  apiVersion: '2025-09-30.clover',
});

// Store payment intents temporarily (in production, use a database)
const paymentIntents = new Map<string, any>();

/**
 * Create a payment intent for a subscription plan
 * POST /api/payment/create-intent
 */
router.post('/payment/create-intent', async (req: Request, res: Response) => {
  try {
    const { planId, userId, planName, price, tokens } = req.body;
    
    if (!planId || !userId || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: planId, userId, price' 
      });
    }

    // Convert price to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(price * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        planId,
        userId,
        planName: planName || planId,
        tokens: tokens?.toString() || '0'
      },
      description: `Subscription: ${planName || planId} - ${tokens} tokens`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent for later verification
    paymentIntents.set(paymentIntent.id, {
      planId,
      userId,
      price,
      tokens,
      planName,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ Payment intent created for user ${userId}: ${planName} - $${price}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Verify payment and create subscription
 * POST /api/payment/verify
 */
router.post('/payment/verify', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Get stored payment intent data
    const storedData = paymentIntents.get(paymentIntentId);
    if (!storedData) {
      return res.status(400).json({ error: 'Payment intent not found' });
    }

    const { planId, userId, price, tokens, planName } = storedData;

    // Create subscription record
    const newSubscription = {
      planId,
      tokensRemaining: tokens,
      tokensUsed: 0,
      totalTokens: tokens,
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      isActive: true,
      price,
      paymentId: paymentIntentId,
      paymentStatus: 'completed'
    };

    // Persist subscription into shared admin storage so admin dashboard can see it
    const existing = adminStorage.subscriptions.get(userId);
    const merged = existing ? { ...existing, ...newSubscription } : newSubscription;
    adminStorage.subscriptions.set(userId, merged);
    console.log(`✅ Payment verified for user ${userId}: ${planName} - $${price}`);

    // Clean up stored payment intent
    paymentIntents.delete(paymentIntentId);

    res.json({
      success: true,
      subscription: newSubscription,
      message: 'Payment verified and subscription created successfully'
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get payment status
 * GET /api/payment/status/:paymentIntentId
 */
router.get('/payment/status/:paymentIntentId', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    res.status(500).json({ 
      error: 'Failed to get payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Webhook endpoint for Stripe events
 * POST /api/payment/webhook
 */
router.post('/payment/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      // Here you would typically update your database
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
