/**
 * Firestore-based subscription storage
 * Stores user subscriptions, purchases, and admin grants persistently
 */

import { getFirebaseAuth } from './firebase-admin';
import * as admin from 'firebase-admin';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PURCHASES_COLLECTION = 'purchases';
const ADMIN_OPERATIONS_COLLECTION = 'admin_operations';
const PAYMENT_SESSIONS_COLLECTION = 'payment_sessions';

export interface Subscription {
  userId: string;
  planId: string;
  tokensRemaining: number;
  tokensUsed: number;
  totalTokens: number;
  purchaseDate: string;
  expiryDate?: string;
  lastResetDate?: string;
  isActive: boolean;
  price: number;
  isFree?: boolean;
  paymentId?: string;
  paymentStatus?: string;
  grantedBy?: string;
  grantedAt?: string;
  grantedByAdmin?: boolean;
  grantDetails?: {
    grantedAt: string;
    durationDays: number;
    grantedBy: string;
  };
  // Subscription-specific fields for Dodo Payments recurring billing
  subscriptionId?: string; // Dodo subscription ID
  customerId?: string; // Dodo customer ID
  subscriptionStatus?: 'active' | 'on_hold' | 'cancelled' | 'expired'; // Subscription lifecycle status
  monthlyTokens?: number; // Monthly token allocation for renewal
  nextRenewalDate?: string; // When the subscription will renew next
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface Purchase {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  tokens: number;
  price: number;
  paymentId: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  createdAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
}

export interface AdminOperation {
  id: string;
  adminEmail: string;
  operationType: 'grant_tokens' | 'update_subscription' | 'update_user' | 'delete_user' | 'resolve_ticket';
  targetUserId?: string;
  targetResourceId?: string;
  details: Record<string, any>;
  timestamp: admin.firestore.Timestamp;
  ipAddress?: string;
}

export interface PaymentSession {
  paymentId: string;
  userId: string;
  planId?: string; // Optional for booking payments
  planName?: string; // Optional for booking payments
  price: number;
  tokens?: number; // Optional for booking payments
  type?: 'subscription' | 'booking'; // Payment type
  counselorId?: string; // For booking payments
  amount?: number; // For booking payments (same as price)
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  metadata?: Record<string, any>;
}

/**
 * Get Firestore database instance
 */
function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  
  return admin.firestore();
}

/**
 * Get user subscription from Firestore
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return null;
  }

  try {
    const subRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(userId);
    const subDoc = await subRef.get();

    if (subDoc.exists) {
      return subDoc.data() as Subscription;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching subscription from Firestore:', error);
    return null;
  }
}

/**
 * Get all subscriptions (for admin dashboard)
 */
export async function getAllSubscriptions(limit: number = 100): Promise<Subscription[]> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return [];
  }

  try {
    const snapshot = await db.collection(SUBSCRIPTIONS_COLLECTION)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Subscription);
  } catch (error) {
    console.error('❌ Error fetching subscriptions from Firestore:', error);
    return [];
  }
}

/**
 * Save or update subscription in Firestore
 */
export async function saveSubscription(subscription: Omit<Subscription, 'createdAt' | 'updatedAt'>): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return false;
  }

  try {
    const subRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscription.userId);
    const existingDoc = await subRef.get();

    const now = admin.firestore.Timestamp.now();
    const subscriptionData: Subscription = {
      ...subscription,
      createdAt: existingDoc.exists ? (existingDoc.data() as Subscription).createdAt : now,
      updatedAt: now,
    };

    await subRef.set(subscriptionData, { merge: true });
    console.log(`✅ Subscription saved to Firestore for user: ${subscription.userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving subscription to Firestore:', error);
    return false;
  }
}

/**
 * Update subscription tokens (used when consuming tokens)
 */
export async function updateSubscriptionTokens(
  userId: string, 
  tokensRemaining: number, 
  tokensUsed: number
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return false;
  }

  try {
    const subRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(userId);
    await subRef.update({
      tokensRemaining,
      tokensUsed,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    
    console.log(`✅ Tokens updated for user ${userId}: ${tokensRemaining} remaining`);
    return true;
  } catch (error) {
    console.error('❌ Error updating tokens in Firestore:', error);
    return false;
  }
}

/**
 * Log a purchase transaction
 */
export async function logPurchase(purchase: Omit<Purchase, 'id' | 'createdAt'>): Promise<string | null> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return null;
  }

  try {
    const purchaseRef = db.collection(PURCHASES_COLLECTION).doc();
    const purchaseData: Purchase = {
      ...purchase,
      id: purchaseRef.id,
      createdAt: admin.firestore.Timestamp.now(),
    };

    await purchaseRef.set(purchaseData);
    console.log(`✅ Purchase logged to Firestore: ${purchaseRef.id}`);
    return purchaseRef.id;
  } catch (error) {
    console.error('❌ Error logging purchase to Firestore:', error);
    return null;
  }
}

/**
 * Update purchase status (e.g., from pending to completed)
 */
export async function updatePurchaseStatus(
  purchaseId: string, 
  status: 'pending' | 'completed' | 'failed'
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return false;
  }

  try {
    const purchaseRef = db.collection(PURCHASES_COLLECTION).doc(purchaseId);
    const updateData: any = {
      paymentStatus: status,
    };

    if (status === 'completed') {
      updateData.completedAt = admin.firestore.Timestamp.now();
    }

    await purchaseRef.update(updateData);
    console.log(`✅ Purchase status updated: ${purchaseId} -> ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating purchase status in Firestore:', error);
    return false;
  }
}

/**
 * Get purchase history for a user
 */
export async function getUserPurchases(userId: string, limit: number = 50): Promise<Purchase[]> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return [];
  }

  try {
    const snapshot = await db.collection(PURCHASES_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as Purchase);
  } catch (error) {
    console.error('❌ Error fetching user purchases from Firestore:', error);
    return [];
  }
}

/**
 * Log an admin operation (audit trail)
 */
export async function logAdminOperation(
  operation: Omit<AdminOperation, 'id' | 'timestamp'>
): Promise<string | null> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return null;
  }

  try {
    const opRef = db.collection(ADMIN_OPERATIONS_COLLECTION).doc();
    const operationData: AdminOperation = {
      ...operation,
      id: opRef.id,
      timestamp: admin.firestore.Timestamp.now(),
    };

    await opRef.set(operationData);
    console.log(`✅ Admin operation logged: ${operation.operationType} by ${operation.adminEmail}`);
    return opRef.id;
  } catch (error) {
    console.error('❌ Error logging admin operation to Firestore:', error);
    return null;
  }
}

/**
 * Get admin operations (for audit log)
 */
export async function getAdminOperations(limit: number = 100): Promise<AdminOperation[]> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return [];
  }

  try {
    const snapshot = await db.collection(ADMIN_OPERATIONS_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as AdminOperation);
  } catch (error) {
    console.error('❌ Error fetching admin operations from Firestore:', error);
    return [];
  }
}

/**
 * Get admin operations for a specific user
 */
export async function getUserAdminOperations(userId: string, limit: number = 50): Promise<AdminOperation[]> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return [];
  }

  try {
    const snapshot = await db.collection(ADMIN_OPERATIONS_COLLECTION)
      .where('targetUserId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as AdminOperation);
  } catch (error) {
    console.error('❌ Error fetching user admin operations from Firestore:', error);
    return [];
  }
}

export interface PaymentSession {
  paymentId: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  tokens: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  metadata?: Record<string, any>;
}

/**
 * Save payment session to Firestore (replaces in-memory storage)
 */
export async function savePaymentSession(
  session: Omit<PaymentSession, 'createdAt' | 'updatedAt' | 'expiresAt'>
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return false;
  }

  try {
    const sessionRef = db.collection(PAYMENT_SESSIONS_COLLECTION).doc(session.paymentId);
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      Date.now() + 24 * 60 * 60 * 1000 // 24 hours expiry
    );

    const sessionData: PaymentSession = {
      ...session,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    await sessionRef.set(sessionData);
    console.log(`✅ Payment session saved: ${session.paymentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving payment session to Firestore:', error);
    return false;
  }
}

/**
 * Get payment session from Firestore
 */
export async function getPaymentSession(paymentId: string): Promise<PaymentSession | null> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return null;
  }

  try {
    const sessionRef = db.collection(PAYMENT_SESSIONS_COLLECTION).doc(paymentId);
    const sessionDoc = await sessionRef.get();

    if (sessionDoc.exists) {
      return sessionDoc.data() as PaymentSession;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching payment session from Firestore:', error);
    return null;
  }
}

/**
 * Update payment session status
 */
export async function updatePaymentSessionStatus(
  paymentId: string,
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return false;
  }

  try {
    const sessionRef = db.collection(PAYMENT_SESSIONS_COLLECTION).doc(paymentId);
    await sessionRef.update({
      status,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    
    console.log(`✅ Payment session status updated: ${paymentId} -> ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating payment session status:', error);
    return false;
  }
}

/**
 * Check if payment has already been processed (idempotency check)
 */
export async function isPaymentProcessed(paymentId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    // Check if there's a completed purchase with this payment ID
    const purchaseSnapshot = await db.collection(PURCHASES_COLLECTION)
      .where('paymentId', '==', paymentId)
      .where('paymentStatus', '==', 'completed')
      .limit(1)
      .get();

    if (!purchaseSnapshot.empty) {
      return true;
    }

    // Check if there's a completed payment session
    const session = await getPaymentSession(paymentId);
    if (session && session.status === 'completed') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking if payment is processed:', error);
    return false;
  }
}

