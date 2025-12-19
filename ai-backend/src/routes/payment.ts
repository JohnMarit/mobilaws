import { Router, Request, Response } from 'express';
import { createHmac } from 'crypto';
import DodoPayments from 'dodopayments';
import { env } from '../env';
import { adminStorage } from './admin';
import {
  saveSubscription,
  logPurchase,
  updatePurchaseStatus,
  savePaymentSession,
  getPaymentSession,
  updatePaymentSessionStatus,
  isPaymentProcessed,
  getSubscription,
} from '../lib/subscription-storage';

const router = Router();

// Initialize Dodo Payments client with SDK
const dodoClient = env.DODO_PAYMENTS_API_KEY ? new DodoPayments({
  bearerToken: env.DODO_PAYMENTS_API_KEY,
}) : null;

/**
 * Diagnostic endpoint to check Dodo Payments configuration
 * GET /api/payment/config-check
 */
router.get('/payment/config-check', (req: Request, res: Response) => {
  const config = {
    apiKeyPresent: !!env.DODO_PAYMENTS_API_KEY,
    apiKeyLength: env.DODO_PAYMENTS_API_KEY?.length || 0,
    apiKeyPrefix: env.DODO_PAYMENTS_API_KEY?.substring(0, 15) || 'NOT SET',
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
    frontendUrl: env.FRONTEND_URL,
    productIds: {
      basic: env.DODO_PAYMENTS_PRODUCT_BASIC || 'NOT SET',
      standard: env.DODO_PAYMENTS_PRODUCT_STANDARD || 'NOT SET',
      premium: env.DODO_PAYMENTS_PRODUCT_PREMIUM || 'NOT SET',
    },
    webhookSecretPresent: !!env.DODO_PAYMENTS_WEBHOOK_SECRET,
    sdkClientInitialized: !!dodoClient,
  };
  
  console.log('🔍 Dodo Payments Configuration Check:', config);
  
  res.json(config);
});

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

/**
 * Helper function to create/update subscription from subscription event data
 */
async function createSubscriptionFromPayment(
  paymentId: string,
  planId: string,
  userId: string,
  planName: string,
  tokens: number,
  price: number,
  subscriptionId?: string,
  customerId?: string
): Promise<boolean> {
  const now = new Date();
  const nextRenewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  const newSubscriptionData = {
    userId,
    planId,
    tokensRemaining: tokens,
    tokensUsed: 0,
    totalTokens: tokens,
    purchaseDate: now.toISOString(),
    expiryDate: nextRenewalDate.toISOString(), // When current period ends
    isActive: true,
    price,
    paymentId: paymentId,
    paymentStatus: 'completed',
    // Subscription-specific fields
    subscriptionId: subscriptionId || undefined,
    customerId: customerId || undefined,
    subscriptionStatus: 'active' as const,
    monthlyTokens: tokens, // Store monthly allocation for renewals
    nextRenewalDate: nextRenewalDate.toISOString(),
  };

  // Save to Firestore
  const saved = await saveSubscription(newSubscriptionData);
  if (!saved) {
    console.error(`❌ Failed to save subscription for user ${userId}`);
    return false;
  }
  
  // Persist subscription into shared admin storage
  const existing = adminStorage.subscriptions.get(userId);
  const merged = existing ? { ...existing, ...newSubscriptionData } : newSubscriptionData;
  adminStorage.subscriptions.set(userId, merged);
  
  // Update purchase status to completed
  await updatePurchaseStatus(paymentId, 'completed');
  
  // Update payment session status
  await updatePaymentSessionStatus(paymentId, 'completed');
  
  console.log(`✅ Subscription created for user ${userId}: ${planName} - $${price}/month - ${tokens} tokens/month`);
  if (subscriptionId) {
    console.log(`📋 Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);
  }
  return true;
}

/**
 * Helper function to handle subscription renewals (monthly token grants)
 */
async function handleSubscriptionRenewal(
  subscriptionId: string,
  userId: string,
  monthlyTokens: number
): Promise<boolean> {
  try {
    // Get existing subscription
    const subscription = await getSubscription(userId);
    if (!subscription) {
      console.error(`❌ No subscription found for user ${userId} to renew`);
      return false;
    }

    const now = new Date();
    const nextRenewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Grant new monthly tokens
    const updatedSubscription = {
      ...subscription,
      tokensRemaining: monthlyTokens, // Reset to monthly allocation
      totalTokens: monthlyTokens,
      tokensUsed: 0, // Reset usage counter
      lastResetDate: now.toISOString(),
      nextRenewalDate: nextRenewalDate.toISOString(),
      isActive: true,
      subscriptionStatus: 'active' as const,
    };

    // Save updated subscription
    const saved = await saveSubscription(updatedSubscription);
    if (!saved) {
      console.error(`❌ Failed to save renewed subscription for user ${userId}`);
      return false;
    }

    // Update admin storage
    adminStorage.subscriptions.set(userId, updatedSubscription);

    console.log(`🔄 Subscription renewed for user ${userId}: ${monthlyTokens} tokens granted`);
    return true;
  } catch (error) {
    console.error(`❌ Error renewing subscription for user ${userId}:`, error);
    return false;
  }
}

/**
 * Create a checkout session for a subscription plan (monthly recurring)
 * POST /api/payment/create-link
 */
router.post('/payment/create-link', async (req: Request, res: Response) => {
  // Map plan IDs to Dodo Payments product IDs (these should be recurring subscription products)
  const productIdMap: Record<string, string | undefined> = {
    'basic': env.DODO_PAYMENTS_PRODUCT_BASIC,
    'standard': env.DODO_PAYMENTS_PRODUCT_STANDARD,
    'premium': env.DODO_PAYMENTS_PRODUCT_PREMIUM,
  };

  try {
    const { planId, userId, planName, price, tokens, userEmail, userName } = req.body;
    
    // Input validation
    if (!planId || !userId || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: planId, userId, price' 
      });
    }

    if (!dodoClient) {
      console.error('❌ Dodo Payments client not initialized');
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

    console.log(`🔗 Creating subscription checkout session for plan ${planId} (product: ${productId}) for user ${userId}`);
    console.log(`💰 Monthly: $${price}, Monthly Tokens: ${tokens}`);

    // Create payment link using Dodo Payments SDK with retry logic.
    // We use payments.create with a recurring product; Dodo will treat it as a subscription.
    let payment: DodoPaymentResponse | null = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
      // Create a subscription payment link (recurring product)
      payment = await dodoClient.payments.create({
        payment_link: true,
        billing: {
          country: 'US' as any, // Required field
        },
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
          monthlyTokens: tokens?.toString() || '0' // Monthly token allocation
        },
        return_url: `${env.FRONTEND_URL}/payment/success?payment_id={PAYMENT_ID}`,
        }) as DodoPaymentResponse;
        
        console.log(`✅ Payment link created successfully on attempt ${retries + 1}`);
        break;
    } catch (sdkError: any) {
        retries++;
        console.error(`❌ SDK Error (attempt ${retries}/${maxRetries}):`, {
        name: sdkError?.name,
        message: sdkError?.message,
        status: sdkError?.status,
        statusCode: sdkError?.statusCode,
        });
        
        if (retries >= maxRetries) {
      throw sdkError;
    }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Validate that payment_id exists
    if (!payment?.payment_id) {
      throw new Error('Payment ID not returned from Dodo Payments API');
    }

    const sessionId = payment.payment_id;

    // Save payment session to Firestore (replaces in-memory storage)
    await savePaymentSession({
      paymentId: sessionId,
      userId,
      planId,
      planName: planName || planId,
      price,
      tokens: tokens || 0,
      status: 'pending',
      metadata: {
        userEmail,
        userName,
        monthlyTokens: tokens || 0,
        isSubscription: true,
      }
    });

    // Log purchase as pending in Firestore
    await logPurchase({
      userId,
      planId,
      planName: planName || planId,
      tokens: tokens || 0,
      price,
      paymentId: sessionId,
      paymentStatus: 'pending',
      paymentMethod: 'dodo_payments',
    });

    console.log(`✅ Subscription payment link created: ${sessionId} for user ${userId}`);

    res.json({
      paymentLink: payment!.payment_url || payment!.checkout_url,
      paymentId: sessionId,
      sessionId: sessionId,
    });

  } catch (error: any) {
    console.error('❌ Error creating payment link:', error);
    
    // Handle Dodo Payments SDK errors
    let errorMessage = 'Unknown error';
    let errorDetails: any = {};

    if (error && typeof error === 'object') {
      if ('status' in error || 'statusCode' in error) {
        const status = error.status || error.statusCode;
        errorMessage = `Dodo Payments API Error (${status}): ${error.message || error.name || 'Unknown'}`;
        errorDetails = {
          status,
          name: error.name,
          message: error.message,
        };
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          message: error.message,
          stack: env.NODE_ENV === 'development' ? error.stack : undefined
        };
      }
    }

    res.status(500).json({
      error: 'Failed to create payment link',
      message: errorMessage,
      details: env.NODE_ENV === 'development' ? errorDetails : undefined
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

    if (!dodoClient) {
      return res.status(500).json({ 
        error: 'Dodo Payments API key not configured' 
      });
    }

    // Idempotency check: prevent duplicate subscription creation
    const alreadyProcessed = await isPaymentProcessed(paymentId);
    if (alreadyProcessed) {
      console.log(`⚠️ Payment ${paymentId} already processed, returning existing subscription`);
      
      // Get existing subscription from payment session
      const session = await getPaymentSession(paymentId);
      if (session) {
        const existingSub = await getSubscription(session.userId);
        if (existingSub) {
          return res.json({
            success: true,
            subscription: existingSub,
            message: 'Payment already verified',
            alreadyProcessed: true
          });
        }
      }
      
      return res.status(409).json({
        error: 'Payment already processed',
        message: 'This payment has already been verified and subscription created'
      });
    }

    // Retrieve payment from Dodo Payments using SDK
    let payment: DodoPaymentResponse;
    try {
      payment = await dodoClient.payments.retrieve(paymentId) as DodoPaymentResponse;
    } catch (error: any) {
      console.error('❌ Error retrieving payment from Dodo Payments:', error);
      return res.status(500).json({
        error: 'Failed to retrieve payment',
        details: error.message || 'Unknown error'
      });
    }
    
    // Check payment status
    if (payment.status !== 'succeeded' && payment.status !== 'completed') {
      await updatePaymentSessionStatus(paymentId, 'failed');
      return res.status(400).json({ 
        error: 'Payment not completed',
        status: payment.status
      });
    }

    // Get payment session data from Firestore
    let session = await getPaymentSession(paymentId);
    
    // If session not found, try to extract from payment metadata
    if (!session) {
      const metadata = payment.metadata || {};
      if (!metadata.userId || !metadata.planId) {
        console.error(`❌ Payment session not found and metadata incomplete for ${paymentId}`);
        return res.status(400).json({ 
          error: 'Payment session not found and cannot be reconstructed from metadata' 
        });
      }
      
      // Reconstruct session from metadata
      const price = payment.amount ? payment.amount / 100 : 0;
      const planId = metadata.planId as string;
      const userId = metadata.userId as string;
      const planName = (metadata.planName || metadata.planId) as string;
      const tokens = parseInt(metadata.tokens || '0');

      // Create subscription
      const success = await createSubscriptionFromPayment(
        paymentId,
        planId,
        userId,
        planName,
        tokens,
        price
      );

      if (!success) {
        return res.status(500).json({
          error: 'Failed to create subscription',
          message: 'Payment verified but subscription creation failed'
        });
      }

      // Get the created subscription
      const subscription = await getSubscription(userId);

      return res.json({
        success: true,
        subscription: subscription,
        message: 'Payment verified and subscription created successfully'
      });
    }

    // Use session data to create subscription
    const { planId, userId, price, tokens, planName } = session;

    // Double-check idempotency
    const processed = await isPaymentProcessed(paymentId);
    if (processed) {
      const existingSub = await getSubscription(userId);
      return res.json({
        success: true,
        subscription: existingSub,
        message: 'Payment already processed',
        alreadyProcessed: true
      });
    }

    // Create subscription
    const success = await createSubscriptionFromPayment(
      paymentId,
      planId,
      userId,
      planName,
      tokens,
      price
    );

    if (!success) {
      return res.status(500).json({
        error: 'Failed to create subscription',
        message: 'Payment verified but subscription creation failed'
      });
    }

    // Get the created subscription
    const subscription = await require('../lib/subscription-storage').getSubscription(userId);
    
    console.log(`✅ Payment verified for user ${userId}: ${planName} - $${price}`);

    res.json({
      success: true,
      subscription: subscription,
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
    
    if (!dodoClient) {
      return res.status(500).json({ 
        error: 'Dodo Payments API key not configured' 
      });
    }

    // Retrieve payment from Dodo Payments using SDK
    const payment = await dodoClient.payments.retrieve(paymentId) as DodoPaymentResponse;
    
    // Also get session status from Firestore
    const session = await getPaymentSession(paymentId);
    
    res.json({
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency || 'USD',
      metadata: payment.metadata || {},
      sessionStatus: session?.status,
      isProcessed: await isPaymentProcessed(paymentId)
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
 * Verify webhook signature
 * Dodo Payments typically uses HMAC SHA256 with the webhook secret
 */
function verifyWebhookSignature(
  payload: string | object,
  signature: string,
  secret: string
): boolean {
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
    
    // Some providers use a prefix like "sha256="
    const cleanSignature = signature.replace(/^sha256=/, '');
    const cleanExpected = expectedSignature.replace(/^sha256=/, '');
    
    // Use timing-safe comparison to prevent timing attacks
    if (cleanSignature.length !== cleanExpected.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < cleanSignature.length; i++) {
      result |= cleanSignature.charCodeAt(i) ^ cleanExpected.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Webhook endpoint for Dodo Payments events
 * POST /api/payment/webhook
 */
router.post('/payment/webhook', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const signature = req.headers['dodo-signature'] || 
                     req.headers['x-dodo-signature'] || 
                     req.headers['x-signature'];
    const webhookSecret = env.DODO_PAYMENTS_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        console.error('❌ Webhook signature missing');
        return res.status(401).json({ error: 'Missing signature' });
      }

      // Get raw body for signature verification
      // Note: You may need to configure Express to capture raw body
      const rawBody = JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, signature as string, webhookSecret);
      
      if (!isValid) {
        console.error('❌ Webhook signature verification failed');
        console.error('Received signature:', signature);
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Webhook secret not configured, skipping signature verification');
    }

    const event = req.body as { 
      type?: string; 
      event_type?: string; 
      event?: string;
      data?: DodoPaymentResponse; 
      payment?: DodoPaymentResponse;
      [key: string]: any;
    };

    const eventType = event.type || event.event_type || event.event;
    console.log(`📨 Webhook received: ${eventType}`);

    // Handle the event
    switch (eventType) {
      case 'payment.succeeded':
      case 'payment.completed':
      case 'payment.success':
        const payment = (event.data || event.payment || event) as DodoPaymentResponse;
        const paymentId = payment.payment_id || (payment as any).id || (event as any).payment_id;
        
        if (!paymentId) {
          console.error('❌ Payment ID not found in webhook event');
          return res.status(400).json({ error: 'Payment ID not found' });
        }
        
        console.log(`✅ Payment succeeded webhook: ${paymentId}`);
        
        // Idempotency check
        const alreadyProcessed = await isPaymentProcessed(paymentId);
        if (alreadyProcessed) {
          console.log(`⚠️ Payment ${paymentId} already processed, skipping`);
          return res.json({ received: true, message: 'Already processed' });
        }
        
        // Get payment session
        let session = await getPaymentSession(paymentId);
        
        // If no session, try to extract from metadata
        if (!session) {
          const metadata = payment.metadata || {};
          if (!metadata.userId || !metadata.planId) {
            console.error(`❌ Cannot process webhook: session and metadata incomplete for ${paymentId}`);
            return res.status(400).json({ error: 'Insufficient data to process payment' });
          }
          
          // Reconstruct from metadata
          const price = payment.amount ? payment.amount / 100 : 0;
          const planId = metadata.planId as string;
          const userId = metadata.userId as string;
          const planName = (metadata.planName || metadata.planId) as string;
          const tokens = parseInt(metadata.tokens || '0');

          const success = await createSubscriptionFromPayment(
            paymentId,
            planId,
            userId,
            planName,
            tokens,
            price
          );

          if (success) {
            console.log(`✅ Subscription created via webhook (from metadata) for user ${userId}`);
          } else {
            console.error(`❌ Failed to create subscription via webhook for ${paymentId}`);
          }
          
          return res.json({ received: true, processed: success });
        }

        // Process with session data
        const { planId, userId, price, tokens, planName } = session;
        
        const success = await createSubscriptionFromPayment(
          paymentId,
          planId,
          userId,
          planName,
          tokens,
          price
        );

        if (success) {
          console.log(`✅ Subscription created via webhook for user ${userId}`);
        } else {
          console.error(`❌ Failed to create subscription via webhook for ${paymentId}`);
        }
        
        break;
        
      case 'payment.failed':
      case 'payment.failure':
        const failedPayment = (event.data || event.payment || event) as DodoPaymentResponse;
        const failedPaymentId = failedPayment.payment_id || (failedPayment as any).id || (event as any).payment_id;
        console.log(`❌ Payment failed webhook: ${failedPaymentId}`);
        
        if (failedPaymentId) {
          await updatePurchaseStatus(failedPaymentId, 'failed');
          await updatePaymentSessionStatus(failedPaymentId, 'failed');
        }
        break;
        
      case 'payment.cancelled':
      case 'payment.canceled':
        const cancelledPayment = (event.data || event.payment || event) as DodoPaymentResponse;
        const cancelledPaymentId = cancelledPayment.payment_id || (cancelledPayment as any).id || (event as any).payment_id;
        console.log(`⚠️ Payment cancelled webhook: ${cancelledPaymentId}`);
        
        if (cancelledPaymentId) {
          await updatePaymentSessionStatus(cancelledPaymentId, 'cancelled');
        }
        break;
        
      // ========== SUBSCRIPTION LIFECYCLE EVENTS ==========
      
      case 'subscription.active':
      case 'subscription.activated':
        // New subscription activated - grant initial tokens
        const activatedSub = event.data || event.subscription || event;
        const activatedSubId = activatedSub.subscription_id || activatedSub.id;
        const activatedCustomerId = activatedSub.customer_id;
        const activatedUserId = activatedSub.metadata?.userId;
        
        console.log(`✅ Subscription activated: ${activatedSubId} for user ${activatedUserId}`);
        
        if (activatedUserId && activatedSubId) {
          const metadata = activatedSub.metadata || {};
          const monthlyTokens = parseInt(metadata.monthlyTokens || metadata.tokens || '0');
          const planId = metadata.planId;
          const planName = metadata.planName || planId;
          const price = activatedSub.amount ? activatedSub.amount / 100 : 0;
          
          await createSubscriptionFromPayment(
            activatedSubId,
            planId,
            activatedUserId,
            planName,
            monthlyTokens,
            price,
            activatedSubId,
            activatedCustomerId
          );
        }
        break;
        
      case 'subscription.renewed':
      case 'subscription.renewal':
        // Monthly subscription renewed - grant new tokens
        const renewedSub = event.data || event.subscription || event;
        const renewedSubId = renewedSub.subscription_id || renewedSub.id;
        const renewedUserId = renewedSub.metadata?.userId;
        
        console.log(`🔄 Subscription renewed: ${renewedSubId} for user ${renewedUserId}`);
        
        if (renewedUserId && renewedSubId) {
          const metadata = renewedSub.metadata || {};
          const monthlyTokens = parseInt(metadata.monthlyTokens || metadata.tokens || '0');
          
          const renewed = await handleSubscriptionRenewal(
            renewedSubId,
            renewedUserId,
            monthlyTokens
          );
          
          if (renewed) {
            console.log(`✅ Monthly tokens granted for user ${renewedUserId}: ${monthlyTokens} tokens`);
          } else {
            console.error(`❌ Failed to grant renewal tokens for user ${renewedUserId}`);
          }
        }
        break;
        
      case 'subscription.on_hold':
      case 'subscription.paused':
        // Subscription payment failed, put on hold
        const onHoldSub = event.data || event.subscription || event;
        const onHoldUserId = onHoldSub.metadata?.userId;
        
        console.log(`⚠️ Subscription on hold for user ${onHoldUserId}`);
        
        if (onHoldUserId) {
          const subscription = await getSubscription(onHoldUserId);
          if (subscription) {
            const updatedSub = {
              ...subscription,
              subscriptionStatus: 'on_hold' as const,
              isActive: false, // Pause token usage
            };
            await saveSubscription(updatedSub);
            adminStorage.subscriptions.set(onHoldUserId, updatedSub);
            console.log(`⏸️ Subscription paused for user ${onHoldUserId} due to payment failure`);
          }
        }
        break;
        
      case 'subscription.cancelled':
      case 'subscription.canceled':
        // User or system cancelled subscription
        const cancelledSub = event.data || event.subscription || event;
        const cancelledUserId = cancelledSub.metadata?.userId;
        
        console.log(`🚫 Subscription cancelled for user ${cancelledUserId}`);
        
        if (cancelledUserId) {
          const subscription = await getSubscription(cancelledUserId);
          if (subscription) {
            const updatedSub = {
              ...subscription,
              subscriptionStatus: 'cancelled' as const,
              isActive: false, // Stop token usage
            };
            await saveSubscription(updatedSub);
            adminStorage.subscriptions.set(cancelledUserId, updatedSub);
            console.log(`❌ Subscription cancelled for user ${cancelledUserId}`);
          }
        }
        break;
        
      case 'subscription.expired':
        // Subscription expired (not renewed)
        const expiredSub = event.data || event.subscription || event;
        const expiredUserId = expiredSub.metadata?.userId;
        
        console.log(`⏰ Subscription expired for user ${expiredUserId}`);
        
        if (expiredUserId) {
          const subscription = await getSubscription(expiredUserId);
          if (subscription) {
            const updatedSub = {
              ...subscription,
              subscriptionStatus: 'expired' as const,
              isActive: false, // Stop token usage
            };
            await saveSubscription(updatedSub);
            adminStorage.subscriptions.set(expiredUserId, updatedSub);
            console.log(`⌛ Subscription expired for user ${expiredUserId}`);
          }
        }
        break;
        
      default:
        console.log(`⚠️ Unhandled webhook event type: ${eventType}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed in ${processingTime}ms`);

    res.json({ received: true, processed: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    const processingTime = Date.now() - startTime;
    console.error(`❌ Webhook failed after ${processingTime}ms`);
    
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
