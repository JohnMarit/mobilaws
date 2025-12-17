import { Router, Request, Response } from 'express';
import { createHmac } from 'crypto';
import { env } from '../env';
import { adminStorage } from './admin';
import { saveSubscription, logPurchase, updatePurchaseStatus } from '../lib/subscription-storage';

const router = Router();

// Dodo Payments API configuration
const DODO_PAYMENTS_API_URL = env.DODO_PAYMENTS_ENVIRONMENT === 'live' 
  ? 'https://api.dodopayments.com' 
  : 'https://api-sandbox.dodopayments.com';

// Store payment sessions temporarily (in production, use a database)
const paymentSessions = new Map<string, any>();

/**
 * Create a payment link for a subscription plan
 * POST /api/payment/create-link
 */
router.post('/payment/create-link', async (req: Request, res: Response) => {
  try {
    const { planId, userId, planName, price, tokens, userEmail, userName } = req.body;
    
    if (!planId || !userId || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: planId, userId, price' 
      });
    }

    if (!env.DODO_PAYMENTS_API_KEY) {
      return res.status(500).json({ 
        error: 'Dodo Payments API key not configured' 
      });
    }

    // Map plan IDs to Dodo Payments product IDs
    const productIdMap: Record<string, string | undefined> = {
      'basic': env.DODO_PAYMENTS_PRODUCT_BASIC,
      'standard': env.DODO_PAYMENTS_PRODUCT_STANDARD,
      'premium': env.DODO_PAYMENTS_PRODUCT_PREMIUM,
    };

    const productId = productIdMap[planId];
    
    if (!productId) {
      return res.status(400).json({ 
        error: `Product ID not configured for plan: ${planId}. Please configure DODO_PAYMENTS_PRODUCT_${planId.toUpperCase()} in environment variables.` 
      });
    }

    // Create payment link via Dodo Payments API using product
    const response = await fetch(`${DODO_PAYMENTS_API_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_link: true,
        customer: {
          email: userEmail || 'customer@example.com',
          name: userName || 'Customer',
        },
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        metadata: {
          planId,
          userId,
          planName: planName || planId,
          tokens: tokens?.toString() || '0'
        },
        success_url: `${env.FRONTEND_URL}/payment/success?payment_id={payment_id}`,
        cancel_url: `${env.FRONTEND_URL}/payment/cancel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Dodo Payments API error: ${response.status}`);
    }

    const paymentData = await response.json();

    // Store payment session for later verification
    paymentSessions.set(paymentData.payment_id, {
      planId,
      userId,
      price,
      tokens,
      planName,
      createdAt: new Date().toISOString(),
      paymentId: paymentData.payment_id,
    });

    // Log purchase as pending in Firestore
    await logPurchase({
      userId,
      planId,
      planName: planName || planId,
      tokens: tokens || 0,
      price,
      paymentId: paymentData.payment_id,
      paymentStatus: 'pending',
      paymentMethod: 'dodo_payments',
    });

    console.log(`✅ Payment link created for user ${userId}: ${planName} - $${price}`);

    res.json({
      paymentLink: paymentData.payment_url || paymentData.checkout_url,
      paymentId: paymentData.payment_id,
    });

  } catch (error) {
    console.error('❌ Error creating payment link:', error);
    res.status(500).json({ 
      error: 'Failed to create payment link',
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
    const { paymentId } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    if (!env.DODO_PAYMENTS_API_KEY) {
      return res.status(500).json({ 
        error: 'Dodo Payments API key not configured' 
      });
    }

    // Retrieve payment from Dodo Payments API
    const response = await fetch(`${DODO_PAYMENTS_API_URL}/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Failed to retrieve payment: ${response.status}`);
    }

    const payment = await response.json();
    
    if (payment.status !== 'succeeded' && payment.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        status: payment.status
      });
    }

    // Get stored payment session data
    const storedData = paymentSessions.get(paymentId);
    if (!storedData) {
      // Try to extract from payment metadata
      const metadata = payment.metadata || {};
      if (!metadata.userId || !metadata.planId) {
        return res.status(400).json({ error: 'Payment session not found' });
      }
      
      // Use metadata if stored data not found
      const { planId, userId, planName, tokens } = {
        planId: metadata.planId,
        userId: metadata.userId,
        planName: metadata.planName || metadata.planId,
        tokens: parseInt(metadata.tokens || '0'),
        price: payment.amount ? payment.amount / 100 : 0,
      };

      // Create subscription record
      const newSubscriptionData = {
        userId,
        planId,
        tokensRemaining: tokens,
        tokensUsed: 0,
        totalTokens: tokens,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        isActive: true,
        price: payment.amount ? payment.amount / 100 : 0,
        paymentId: paymentId,
        paymentStatus: 'completed'
      };

      // Save to Firestore
      await saveSubscription(newSubscriptionData);
      
      // Persist subscription into shared admin storage
      const existing = adminStorage.subscriptions.get(userId);
      const merged = existing ? { ...existing, ...newSubscriptionData } : newSubscriptionData;
      adminStorage.subscriptions.set(userId, merged);
      
      // Update purchase status to completed
      await updatePurchaseStatus(paymentId, 'completed');
      
      console.log(`✅ Payment verified for user ${userId}: ${planName} - $${newSubscriptionData.price}`);

      return res.json({
        success: true,
        subscription: newSubscriptionData,
        message: 'Payment verified and subscription created successfully'
      });
    }

    const { planId, userId, price, tokens, planName } = storedData;

    // Create subscription record
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
      paymentId: paymentId,
      paymentStatus: 'completed'
    };

    // Save to Firestore (this adds createdAt/updatedAt)
    await saveSubscription(newSubscriptionData);
    
    // Persist subscription into shared admin storage so admin dashboard can see it
    const existing = adminStorage.subscriptions.get(userId);
    const merged = existing ? { ...existing, ...newSubscriptionData } : newSubscriptionData;
    adminStorage.subscriptions.set(userId, merged);
    
    // Update purchase status to completed
    await updatePurchaseStatus(paymentId, 'completed');
    
    console.log(`✅ Payment verified for user ${userId}: ${planName} - $${price}`);

    // Clean up stored payment session
    paymentSessions.delete(paymentId);

    res.json({
      success: true,
      subscription: newSubscriptionData,
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
 * GET /api/payment/status/:paymentId
 */
router.get('/payment/status/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    
    if (!env.DODO_PAYMENTS_API_KEY) {
      return res.status(500).json({ 
        error: 'Dodo Payments API key not configured' 
      });
    }

    const response = await fetch(`${DODO_PAYMENTS_API_URL}/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Failed to retrieve payment: ${response.status}`);
    }

    const payment = await response.json();
    
    res.json({
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency || 'USD',
      metadata: payment.metadata || {}
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
 * Webhook endpoint for Dodo Payments events
 * POST /api/payment/webhook
 */
router.post('/payment/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['dodo-signature'] || req.headers['x-dodo-signature'];
    const webhookSecret = env.DODO_PAYMENTS_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      // Note: Implement signature verification based on Dodo Payments documentation
      // This is a placeholder - adjust based on actual Dodo Payments webhook verification method
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('❌ Webhook signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;

    // Handle the event
    switch (event.type || event.event_type) {
      case 'payment.succeeded':
      case 'payment.completed':
        const payment = event.data || event;
        console.log('✅ Payment succeeded:', payment.payment_id || payment.id);
        
        // Verify and create subscription
        try {
          const storedData = paymentSessions.get(payment.payment_id || payment.id);
          if (storedData) {
            const { planId, userId, price, tokens, planName } = storedData;
            
            const newSubscriptionData = {
              userId,
              planId,
              tokensRemaining: tokens,
              tokensUsed: 0,
              totalTokens: tokens,
              purchaseDate: new Date().toISOString(),
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              isActive: true,
              price,
              paymentId: payment.payment_id || payment.id,
              paymentStatus: 'completed'
            };

            await saveSubscription(newSubscriptionData);
            
            const existing = adminStorage.subscriptions.get(userId);
            const merged = existing ? { ...existing, ...newSubscriptionData } : newSubscriptionData;
            adminStorage.subscriptions.set(userId, merged);
            
            await updatePurchaseStatus(payment.payment_id || payment.id, 'completed');
            
            console.log(`✅ Subscription created via webhook for user ${userId}`);
          }
        } catch (error) {
          console.error('❌ Error processing webhook subscription:', error);
        }
        break;
        
      case 'payment.failed':
        const failedPayment = event.data || event;
        console.log('❌ Payment failed:', failedPayment.payment_id || failedPayment.id);
        // Handle failed payment
        if (failedPayment.payment_id || failedPayment.id) {
          await updatePurchaseStatus(failedPayment.payment_id || failedPayment.id, 'failed');
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type || event.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
