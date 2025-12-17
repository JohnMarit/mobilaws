import { Router, Request, Response } from 'express';
import { createHmac } from 'crypto';
import { env } from '../env';
import { adminStorage } from './admin';
import { saveSubscription, logPurchase, updatePurchaseStatus } from '../lib/subscription-storage';

const router = Router();

// Dodo Payments API configuration
// Allow override via env.DODO_PAYMENTS_API_URL (recommended to set this from dashboard docs)
// Defaults:
// - Test mode: https://test.dodopayments.com
// - Live mode: https://live.dodopayments.com
const DODO_PAYMENTS_API_URL = env.DODO_PAYMENTS_API_URL
  || (env.DODO_PAYMENTS_ENVIRONMENT === 'live'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com');

// Type definitions for Dodo Payments API responses
interface DodoPaymentResponse {
  payment_id?: string;
  payment_url?: string;
  checkout_url?: string;
  status?: string;
  amount?: number;
  currency?: string;
  metadata?: {
    planId?: string;
    userId?: string;
    planName?: string;
    tokens?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface DodoErrorResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

// Store payment sessions temporarily (in production, use a database)
const paymentSessions = new Map<string, any>();

/**
 * Create a payment link for a subscription plan
 * POST /api/payment/create-link
 */
router.post('/payment/create-link', async (req: Request, res: Response) => {
  // Map plan IDs to Dodo Payments product IDs (defined outside try for error handling)
  const productIdMap: Record<string, string | undefined> = {
    'basic': env.DODO_PAYMENTS_PRODUCT_BASIC,
    'standard': env.DODO_PAYMENTS_PRODUCT_STANDARD,
    'premium': env.DODO_PAYMENTS_PRODUCT_PREMIUM,
  };

  try {
    const { planId, userId, planName, price, tokens, userEmail, userName } = req.body;
    
    console.log('📥 Payment link request received:', {
      planId,
      userId,
      price,
      hasEmail: !!userEmail,
      hasName: !!userName
    });
    
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

    const productId = productIdMap[planId];
    
    if (!productId) {
      return res.status(400).json({ 
        error: `Product ID not configured for plan: ${planId}. Please configure DODO_PAYMENTS_PRODUCT_${planId.toUpperCase()} in environment variables.` 
      });
    }

    // Prepare request body
    const requestBody = {
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
    };

    console.log(`🔗 Creating payment link for plan ${planId} with product ${productId}`);
    console.log(`📡 API URL: ${DODO_PAYMENTS_API_URL}/v1/payments`);
    console.log(`🔑 API Key present: ${!!env.DODO_PAYMENTS_API_KEY}`);
    console.log(`🔑 API Key prefix: ${env.DODO_PAYMENTS_API_KEY?.substring(0, 10)}...`);

    // Create payment link via Dodo Payments API using product
    const response = await fetch(`${DODO_PAYMENTS_API_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: DodoErrorResponse;
      
      try {
        errorData = JSON.parse(errorText) as DodoErrorResponse;
      } catch {
        errorData = { message: errorText || 'Unknown error' };
      }

      console.error('❌ Dodo Payments API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        requestBody: {
          ...requestBody,
          customer: { ...requestBody.customer, email: '***' } // Don't log full email
        }
      });

      throw new Error(
        errorData.message || 
        errorData.error || 
        `Dodo Payments API error: ${response.status} ${response.statusText}`
      );
    }

    const paymentData = await response.json() as DodoPaymentResponse;

    // Validate that payment_id exists
    if (!paymentData.payment_id) {
      throw new Error('Payment ID not returned from Dodo Payments API');
    }

    const paymentId = paymentData.payment_id;

    // Store payment session for later verification
    paymentSessions.set(paymentId, {
      planId,
      userId,
      price,
      tokens,
      planName,
      createdAt: new Date().toISOString(),
      paymentId: paymentId,
    });

    // Log purchase as pending in Firestore
    await logPurchase({
      userId,
      planId,
      planName: planName || planId,
      tokens: tokens || 0,
      price,
      paymentId: paymentId,
      paymentStatus: 'pending',
      paymentMethod: 'dodo_payments',
    });

    console.log(`✅ Payment link created for user ${userId}: ${planName} - $${price}`);

    res.json({
      paymentLink: paymentData.payment_url || paymentData.checkout_url,
      paymentId: paymentId,
    });

  } catch (error) {
    console.error('❌ Error creating payment link:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails: any = {
      error: 'Failed to create payment link',
      message: errorMessage
    };

    // In development, include more details
    if (env.NODE_ENV === 'development') {
      errorDetails.stack = error instanceof Error ? error.stack : undefined;
      errorDetails.details = {
        planId: req.body?.planId,
        hasApiKey: !!env.DODO_PAYMENTS_API_KEY,
        hasProductId: !!productIdMap[req.body?.planId],
        apiUrl: DODO_PAYMENTS_API_URL,
        frontendUrl: env.FRONTEND_URL
      };
    }

    res.status(500).json(errorDetails);
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
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' })) as DodoErrorResponse;
      throw new Error(errorData.message || errorData.error || `Failed to retrieve payment: ${response.status}`);
    }

    const payment = await response.json() as DodoPaymentResponse;
    
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
      
      // Calculate price from payment amount
      const price = payment.amount ? payment.amount / 100 : 0;
      
      // Use metadata if stored data not found
      const planId = metadata.planId as string;
      const userId = metadata.userId as string;
      const planName = (metadata.planName || metadata.planId) as string;
      const tokens = parseInt(metadata.tokens || '0');

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
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' })) as DodoErrorResponse;
      throw new Error(errorData.message || errorData.error || `Failed to retrieve payment: ${response.status}`);
    }

    const payment = await response.json() as DodoPaymentResponse;
    
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

    const event = req.body as { type?: string; event_type?: string; data?: DodoPaymentResponse; [key: string]: any };

    // Handle the event
    switch (event.type || event.event_type) {
      case 'payment.succeeded':
      case 'payment.completed':
        const payment = (event.data || event) as DodoPaymentResponse;
        const paymentId = payment.payment_id || (payment as any).id;
        console.log('✅ Payment succeeded:', paymentId);
        
        // Verify and create subscription
        try {
          const storedData = paymentSessions.get(paymentId);
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
              paymentId: paymentId,
              paymentStatus: 'completed'
            };

            await saveSubscription(newSubscriptionData);
            
            const existing = adminStorage.subscriptions.get(userId);
            const merged = existing ? { ...existing, ...newSubscriptionData } : newSubscriptionData;
            adminStorage.subscriptions.set(userId, merged);
            
            await updatePurchaseStatus(paymentId, 'completed');
            
            console.log(`✅ Subscription created via webhook for user ${userId}`);
          }
        } catch (error) {
          console.error('❌ Error processing webhook subscription:', error);
        }
        break;
        
      case 'payment.failed':
        const failedPayment = (event.data || event) as DodoPaymentResponse;
        const failedPaymentId = failedPayment.payment_id || (failedPayment as any).id;
        console.log('❌ Payment failed:', failedPaymentId);
        // Handle failed payment
        if (failedPaymentId) {
          await updatePurchaseStatus(failedPaymentId, 'failed');
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
