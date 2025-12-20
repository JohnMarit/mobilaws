import { Router, Request, Response } from 'express';
import { createHmac } from 'crypto';
import Paystack from 'paystack';
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

// Initialize Paystack client
const paystackClient = env.PAYSTACK_SECRET_KEY ? new Paystack(env.PAYSTACK_SECRET_KEY) : null;

/**
 * Diagnostic endpoint to check Paystack configuration
 * GET /api/payment/config-check
 */
router.get('/payment/config-check', (req: Request, res: Response) => {
  const config = {
    apiKeyPresent: !!env.PAYSTACK_SECRET_KEY,
    apiKeyLength: env.PAYSTACK_SECRET_KEY?.length || 0,
    apiKeyPrefix: env.PAYSTACK_SECRET_KEY?.substring(0, 10) || 'NOT SET',
    publicKeyPresent: !!env.PAYSTACK_PUBLIC_KEY,
    environment: env.PAYSTACK_ENVIRONMENT,
    currency: env.PAYSTACK_CURRENCY,
    frontendUrl: env.FRONTEND_URL,
    planCodes: {
      basic: env.PAYSTACK_PLAN_BASIC || 'NOT SET',
      standard: env.PAYSTACK_PLAN_STANDARD || 'NOT SET',
      premium: env.PAYSTACK_PLAN_PREMIUM || 'NOT SET',
    },
    sdkClientInitialized: !!paystackClient,
  };
  
  console.log('🔍 Paystack Configuration Check:', config);
  
  res.json(config);
});

// Type definitions for Paystack API responses
interface PaystackTransaction {
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  customer?: {
    email?: string;
    customer_code?: string;
  };
  metadata?: {
    planId?: string;
    userId?: string;
    planName?: string;
    tokens?: string | number;
    custom_fields?: any[];
    [key: string]: any;
  };
  authorization_url?: string;
  access_code?: string;
  [key: string]: any;
}

interface PaystackSubscription {
  subscription_code?: string;
  email_token?: string;
  amount?: number;
  cron_expression?: string;
  next_payment_date?: string;
  status?: string;
  customer?: {
    email?: string;
    customer_code?: string;
  };
  plan?: {
    plan_code?: string;
    name?: string;
  };
  [key: string]: any;
}

/**
 * Helper function to create/update subscription from payment data
 */
async function createSubscriptionFromPayment(
  reference: string,
  planId: string,
  userId: string,
  planName: string,
  tokens: number,
  price: number,
  subscriptionCode?: string,
  customerCode?: string
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
    expiryDate: nextRenewalDate.toISOString(),
    isActive: true,
    price,
    paymentId: reference,
    paymentStatus: 'completed',
    // Subscription-specific fields
    subscriptionCode: subscriptionCode || undefined,
    customerCode: customerCode || undefined,
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
  
  console.log(`✅ Subscription saved to Firestore for user ${userId}`);
  
  // Persist subscription into shared admin storage
  const existing = adminStorage.subscriptions.get(userId);
  const merged = existing ? { ...existing, ...newSubscriptionData } : newSubscriptionData;
  adminStorage.subscriptions.set(userId, merged);
  
  console.log(`✅ Subscription added to admin storage for user ${userId}`);
  
  // Update purchase status to completed
  await updatePurchaseStatus(reference, 'completed');
  
  // Update payment session status
  await updatePaymentSessionStatus(reference, 'completed');
  
  console.log(`✅ Subscription created for user ${userId}: ${planName} - $${price}/month - ${tokens} tokens/month`);
  if (subscriptionCode) {
    console.log(`📋 Subscription Code: ${subscriptionCode}, Customer Code: ${customerCode}`);
  }
  
  // Verify the subscription was actually saved
  const verification = await getSubscription(userId);
  if (verification) {
    console.log(`✅✅ Subscription verified in Firestore for ${userId}: ${verification.planId}`);
  } else {
    console.error(`❌❌ CRITICAL: Subscription not found in Firestore immediately after save for ${userId}`);
  }
  
  return true;
}

/**
 * Helper function to handle subscription renewals (monthly token grants)
 */
async function handleSubscriptionRenewal(
  subscriptionCode: string,
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
 * Create a payment transaction for a subscription plan
 * POST /api/payment/create-link
 */
router.post('/payment/create-link', async (req: Request, res: Response) => {
  // Map plan IDs to Paystack plan codes
  const planCodeMap: Record<string, string | undefined> = {
    'basic': env.PAYSTACK_PLAN_BASIC,
    'standard': env.PAYSTACK_PLAN_STANDARD,
    'premium': env.PAYSTACK_PLAN_PREMIUM,
  };

  try {
    const { planId, userId, planName, price, tokens, userEmail, userName } = req.body;
    
    // Input validation
    if (!planId || !userId || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: planId, userId, price' 
      });
    }

    if (!userEmail) {
      return res.status(400).json({ 
        error: 'Email is required for Paystack payments' 
      });
    }

    if (!paystackClient) {
      console.error('❌ Paystack client not initialized');
      return res.status(500).json({ 
        error: 'Paystack API key not configured' 
      });
    }

    const planCode = planCodeMap[planId];
    
    if (!planCode) {
      return res.status(400).json({ 
        error: `Plan code not configured for plan: ${planId}. Please configure PAYSTACK_PLAN_${planId.toUpperCase()} in environment variables.` 
      });
    }

    console.log(`🔗 Creating Paystack transaction for plan ${planId} (plan code: ${planCode}) for user ${userId}`);
    console.log(`💰 Amount: $${price}, Monthly Tokens: ${tokens}`);

    // Generate a unique reference with random component to avoid duplicates
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const reference = `mobilaws_${userId}_${Date.now()}_${randomSuffix}`;

    // Create transaction with Paystack
    let transaction: any;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        // Initialize transaction with Paystack
        // Convert price to smallest currency unit (cents)
        // For KES: multiply by 100 (e.g., KSh 500 = 50000 cents)
        // For NGN: multiply by 100 (e.g., ₦5 = 500 kobo)
        // For USD: multiply by 100 (e.g., $5 = 500 cents)
        const currency = env.PAYSTACK_CURRENCY || 'KES';
        const amountInSubunits = Math.round(price * 100);
        
        const response = await paystackClient.transaction.initialize({
          email: userEmail,
          amount: amountInSubunits,
          currency: currency,
          reference: reference,
          callback_url: `${env.FRONTEND_URL}/payment/success?reference=${reference}`,
          plan: planCode, // This makes it a subscription
          metadata: {
            planId,
            userId,
            planName: planName || planId,
            monthlyTokens: tokens?.toString() || '0',
            userName: userName || '',
            custom_fields: [
              {
                display_name: 'Plan',
                variable_name: 'plan',
                value: planName || planId
              },
              {
                display_name: 'Tokens',
                variable_name: 'tokens',
                value: tokens?.toString() || '0'
              }
            ]
          }
        });
        
        if (response.status && response.data) {
          transaction = response.data;
          console.log(`✅ Paystack transaction created successfully on attempt ${retries + 1}`);
          break;
        } else {
          throw new Error(response.message || 'Failed to create transaction');
        }
      } catch (sdkError: any) {
        retries++;
        console.error(`❌ Paystack SDK Error (attempt ${retries}/${maxRetries}):`, {
          message: sdkError?.message,
          status: sdkError?.status,
        });
        
        if (retries >= maxRetries) {
          throw sdkError;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Validate that authorization_url exists
    if (!transaction?.authorization_url || !transaction?.reference) {
      throw new Error('Authorization URL not returned from Paystack API');
    }

    const sessionReference = transaction.reference;

    // Save payment session to Firestore
    await savePaymentSession({
      paymentId: sessionReference,
      userId,
      planId,
      planName: planName || planId,
      price,
      tokens: tokens || 0,
      status: 'pending',
      metadata: {
        userEmail: userEmail || '',
        userName: userName || '',
        monthlyTokens: tokens || 0,
        isSubscription: true,
        accessCode: transaction.access_code || '',
      }
    });

    // Log purchase as pending in Firestore
    await logPurchase({
      userId,
      planId,
      planName: planName || planId,
      tokens: tokens || 0,
      price,
      paymentId: sessionReference,
      paymentStatus: 'pending',
      paymentMethod: 'paystack',
    });

    console.log(`✅ Paystack transaction created: ${sessionReference} for user ${userId}`);

    res.json({
      paymentLink: transaction.authorization_url,
      paymentId: sessionReference,
      sessionId: sessionReference,
      reference: sessionReference,
      accessCode: transaction.access_code,
    });

  } catch (error: any) {
    console.error('❌ Error creating payment link:', error);
    
    // Handle Paystack SDK errors
    let errorMessage = 'Unknown error';
    let errorDetails: any = {};

    if (error && typeof error === 'object') {
      errorMessage = error.message || 'Failed to create payment link';
      errorDetails = {
        message: error.message,
        stack: env.NODE_ENV === 'development' ? error.stack : undefined
      };
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
    const { paymentId, reference } = req.body;
    const ref = reference || paymentId;
    
    if (!ref) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    if (!paystackClient) {
      return res.status(500).json({ 
        error: 'Paystack API key not configured' 
      });
    }

    // Idempotency check: prevent duplicate subscription creation
    const alreadyProcessed = await isPaymentProcessed(ref);
    if (alreadyProcessed) {
      console.log(`⚠️ Payment ${ref} already processed, returning existing subscription`);
      
      // Get existing subscription from payment session
      const session = await getPaymentSession(ref);
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

    // Verify transaction with Paystack
    let transaction: any;
    try {
      const response = await paystackClient.transaction.verify(ref);
      if (!response.status || !response.data) {
        throw new Error(response.message || 'Failed to verify transaction');
      }
      transaction = response.data;
    } catch (error: any) {
      console.error('❌ Error verifying payment with Paystack:', error);
      return res.status(500).json({
        error: 'Failed to verify payment',
        details: error.message || 'Unknown error'
      });
    }
    
    // Check payment status
    if (transaction.status !== 'success') {
      await updatePaymentSessionStatus(ref, 'failed');
      return res.status(400).json({ 
        error: 'Payment not completed',
        status: transaction.status
      });
    }

    // Get payment session data from Firestore
    let session = await getPaymentSession(ref);
    
    // If session not found, try to extract from transaction metadata
    if (!session) {
      const metadata = transaction.metadata || {};
      if (!metadata.userId || !metadata.planId) {
        console.error(`❌ Payment session not found and metadata incomplete for ${ref}`);
        return res.status(400).json({ 
          error: 'Payment session not found and cannot be reconstructed from metadata' 
        });
      }
      
      // Reconstruct session from metadata
      const price = transaction.amount ? transaction.amount / 100 : 0;
      const planId = metadata.planId as string;
      const userId = metadata.userId as string;
      const planName = (metadata.planName || metadata.planId) as string;
      const tokens = parseInt(metadata.monthlyTokens || metadata.tokens || '0');

      // Create subscription
      const success = await createSubscriptionFromPayment(
        ref,
        planId,
        userId,
        planName,
        tokens,
        price,
        transaction.plan_object?.subscription_code,
        transaction.customer?.customer_code
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
    const processed = await isPaymentProcessed(ref);
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
      ref,
      planId,
      userId,
      planName,
      tokens,
      price,
      transaction.plan_object?.subscription_code,
      transaction.customer?.customer_code
    );

    if (!success) {
      return res.status(500).json({
        error: 'Failed to create subscription',
        message: 'Payment verified but subscription creation failed'
      });
    }

    // Get the created subscription
    const subscription = await getSubscription(userId);
    
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
 * GET /api/payment/status/:reference
 */
router.get('/payment/status/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    
    if (!paystackClient) {
      return res.status(500).json({ 
        error: 'Paystack API key not configured' 
      });
    }

    // Verify transaction with Paystack
    const response = await paystackClient.transaction.verify(reference);
    
    if (!response.status || !response.data) {
      throw new Error(response.message || 'Failed to get transaction status');
    }

    const transaction = response.data;
    
    // Also get session status from Firestore
    const session = await getPaymentSession(reference);
    
    res.json({
      status: transaction.status,
      amount: transaction.amount / 100, // Convert from subunits to main currency
      currency: transaction.currency || env.PAYSTACK_CURRENCY || 'KES',
      metadata: transaction.metadata || {},
      sessionStatus: session?.status,
      isProcessed: await isPaymentProcessed(reference),
      reference: transaction.reference,
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
 * Paystack uses HMAC SHA512 with the secret key
 */
function verifyPaystackSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hash = createHmac('sha512', secret)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Webhook endpoint for Paystack events
 * POST /api/payment/webhook
 */
router.post('/payment/webhook', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const secret = env.PAYSTACK_SECRET_KEY;

    // Verify webhook signature
    if (secret) {
      if (!signature) {
        console.error('❌ Webhook signature missing');
        return res.status(401).json({ error: 'Missing signature' });
      }

      // Get raw body for signature verification
      const rawBody = JSON.stringify(req.body);
      const isValid = verifyPaystackSignature(rawBody, signature, secret);
      
      if (!isValid) {
        console.error('❌ Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Paystack secret not configured, skipping signature verification');
    }

    const event = req.body;
    const eventType = event.event;
    
    console.log(`📨 Webhook received: ${eventType}`);

    // Handle the event
    switch (eventType) {
      case 'charge.success':
        // Payment successful
        const chargeData = event.data;
        const reference = chargeData.reference;
        
        if (!reference) {
          console.error('❌ Reference not found in webhook event');
          return res.status(400).json({ error: 'Reference not found' });
        }
        
        console.log(`✅ Charge succeeded webhook: ${reference}`);
        
        // Idempotency check
        const alreadyProcessed = await isPaymentProcessed(reference);
        if (alreadyProcessed) {
          console.log(`⚠️ Payment ${reference} already processed, skipping`);
          return res.json({ received: true, message: 'Already processed' });
        }
        
        // Get payment session
        let session = await getPaymentSession(reference);
        
        // If no session, try to extract from metadata
        if (!session) {
          const metadata = chargeData.metadata || {};
          if (!metadata.userId || !metadata.planId) {
            console.error(`❌ Cannot process webhook: session and metadata incomplete for ${reference}`);
            return res.status(400).json({ error: 'Insufficient data to process payment' });
          }
          
          // Reconstruct from metadata
          const price = chargeData.amount ? chargeData.amount / 100 : 0;
          const planId = metadata.planId as string;
          const userId = metadata.userId as string;
          const planName = (metadata.planName || metadata.planId) as string;
          const tokens = parseInt(metadata.monthlyTokens || metadata.tokens || '0');

          const success = await createSubscriptionFromPayment(
            reference,
            planId,
            userId,
            planName,
            tokens,
            price,
            chargeData.plan_object?.subscription_code,
            chargeData.customer?.customer_code
          );

          if (success) {
            console.log(`✅ Subscription created via webhook (from metadata) for user ${userId}`);
          } else {
            console.error(`❌ Failed to create subscription via webhook for ${reference}`);
          }
          
          return res.json({ received: true, processed: success });
        }

        // Process with session data
        const { planId, userId, price, tokens, planName } = session;
        
        const success = await createSubscriptionFromPayment(
          reference,
          planId,
          userId,
          planName,
          tokens,
          price,
          chargeData.plan_object?.subscription_code,
          chargeData.customer?.customer_code
        );

        if (success) {
          console.log(`✅ Subscription created via webhook for user ${userId}`);
        } else {
          console.error(`❌ Failed to create subscription via webhook for ${reference}`);
        }
        
        break;
        
      case 'charge.failed':
        // Payment failed
        const failedCharge = event.data;
        const failedRef = failedCharge.reference;
        console.log(`❌ Charge failed webhook: ${failedRef}`);
        
        if (failedRef) {
          await updatePurchaseStatus(failedRef, 'failed');
          await updatePaymentSessionStatus(failedRef, 'failed');
        }
        break;
        
      // ========== SUBSCRIPTION LIFECYCLE EVENTS ==========
      
      case 'subscription.create':
        // New subscription created
        const newSub = event.data;
        const newSubCode = newSub.subscription_code;
        const newSubEmail = newSub.customer?.email;
        
        console.log(`✅ Subscription created: ${newSubCode} for ${newSubEmail}`);
        break;
        
      case 'subscription.not_renew':
        // Subscription will not renew (cancelled by user)
        const cancelledSub = event.data;
        const cancelledSubCode = cancelledSub.subscription_code;
        
        console.log(`🚫 Subscription cancelled: ${cancelledSubCode}`);
        
        // Find user by subscription code and deactivate
        for (const [userId, sub] of adminStorage.subscriptions.entries()) {
          if (sub.subscriptionCode === cancelledSubCode) {
            const updatedSub = {
              ...sub,
              subscriptionStatus: 'cancelled' as const,
              isActive: false,
            };
            await saveSubscription(updatedSub);
            adminStorage.subscriptions.set(userId, updatedSub);
            console.log(`❌ Subscription cancelled for user ${userId}`);
            break;
          }
        }
        break;
        
      case 'subscription.disable':
        // Subscription disabled (payment failed repeatedly)
        const disabledSub = event.data;
        const disabledSubCode = disabledSub.subscription_code;
        
        console.log(`⚠️ Subscription disabled: ${disabledSubCode}`);
        
        // Find user by subscription code and deactivate
        for (const [userId, sub] of adminStorage.subscriptions.entries()) {
          if (sub.subscriptionCode === disabledSubCode) {
            const updatedSub = {
              ...sub,
              subscriptionStatus: 'disabled' as const,
              isActive: false,
            };
            await saveSubscription(updatedSub);
            adminStorage.subscriptions.set(userId, updatedSub);
            console.log(`⏸️ Subscription disabled for user ${userId}`);
            break;
          }
        }
        break;
        
      case 'subscription.enable':
        // Subscription re-enabled
        const enabledSub = event.data;
        const enabledSubCode = enabledSub.subscription_code;
        
        console.log(`✅ Subscription enabled: ${enabledSubCode}`);
        
        // Find user by subscription code and reactivate
        for (const [userId, sub] of adminStorage.subscriptions.entries()) {
          if (sub.subscriptionCode === enabledSubCode) {
            const updatedSub = {
              ...sub,
              subscriptionStatus: 'active' as const,
              isActive: true,
            };
            await saveSubscription(updatedSub);
            adminStorage.subscriptions.set(userId, updatedSub);
            console.log(`✅ Subscription re-enabled for user ${userId}`);
            break;
          }
        }
        break;
        
      case 'invoice.create':
      case 'invoice.update':
        // Subscription invoice created/updated (for recurring charges)
        const invoice = event.data;
        console.log(`📄 Invoice ${eventType}: ${invoice.invoice_code}`);
        break;
        
      case 'invoice.payment_failed':
        // Subscription payment failed
        const failedInvoice = event.data;
        console.log(`❌ Invoice payment failed: ${failedInvoice.invoice_code}`);
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
