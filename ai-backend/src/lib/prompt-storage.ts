/**
 * Firestore-based prompt tracking storage
 * Stores prompt counts persistently in Firebase Firestore
 */

import { getFirebaseAuth } from './firebase-admin';
import * as admin from 'firebase-admin';

const PROMPT_STATS_DOC_ID = 'prompt_stats_global';
const PROMPT_STATS_COLLECTION = 'admin_stats';

interface PromptStatsData {
  totalAuthenticatedPrompts: number;
  totalAnonymousPrompts: number;
  dailyPrompts: Record<string, { authenticated: number; anonymous: number }>;
  userPrompts: Record<string, number>;
  lastUpdated: admin.firestore.Timestamp;
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
 * Initialize prompt stats document in Firestore
 */
async function initializePromptStats(): Promise<PromptStatsData> {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firebase Admin not initialized');
  }

  const statsRef = db.collection(PROMPT_STATS_COLLECTION).doc(PROMPT_STATS_DOC_ID);
  const statsDoc = await statsRef.get();

  if (statsDoc.exists) {
    const data = statsDoc.data() as PromptStatsData;
    return {
      totalAuthenticatedPrompts: data.totalAuthenticatedPrompts || 0,
      totalAnonymousPrompts: data.totalAnonymousPrompts || 0,
      dailyPrompts: data.dailyPrompts || {},
      userPrompts: data.userPrompts || {},
      lastUpdated: data.lastUpdated || admin.firestore.Timestamp.now(),
    };
  } else {
    // Create new document
    const initialData: PromptStatsData = {
      totalAuthenticatedPrompts: 0,
      totalAnonymousPrompts: 0,
      dailyPrompts: {},
      userPrompts: {},
      lastUpdated: admin.firestore.Timestamp.now(),
    };
    await statsRef.set(initialData);
    return initialData;
  }
}

/**
 * Get current prompt stats from Firestore
 */
export async function getPromptStats(): Promise<PromptStatsData> {
  try {
    return await initializePromptStats();
  } catch (error) {
    console.error('❌ Error getting prompt stats from Firestore:', error);
    // Return default stats if Firestore fails
    return {
      totalAuthenticatedPrompts: 0,
      totalAnonymousPrompts: 0,
      dailyPrompts: {},
      userPrompts: {},
      lastUpdated: admin.firestore.Timestamp.now(),
    };
  }
}

/**
 * Track a prompt and save to Firestore
 */
export async function trackPrompt(userId: string, isAnonymous: boolean): Promise<void> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized, using in-memory fallback');
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection(PROMPT_STATS_COLLECTION).doc(PROMPT_STATS_DOC_ID);
    
    // Use Firestore transaction to ensure atomic updates
    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      let stats: PromptStatsData;
      if (statsDoc.exists) {
        stats = statsDoc.data() as PromptStatsData;
      } else {
        stats = {
          totalAuthenticatedPrompts: 0,
          totalAnonymousPrompts: 0,
          dailyPrompts: {},
          userPrompts: {},
          lastUpdated: admin.firestore.Timestamp.now(),
        };
      }

      // Update stats
      if (isAnonymous) {
        stats.totalAnonymousPrompts = (stats.totalAnonymousPrompts || 0) + 1;
        
        if (!stats.dailyPrompts[today]) {
          stats.dailyPrompts[today] = { authenticated: 0, anonymous: 0 };
        }
        stats.dailyPrompts[today].anonymous = (stats.dailyPrompts[today].anonymous || 0) + 1;
      } else {
        stats.totalAuthenticatedPrompts = (stats.totalAuthenticatedPrompts || 0) + 1;
        
        if (!stats.userPrompts[userId]) {
          stats.userPrompts[userId] = 0;
        }
        stats.userPrompts[userId] = (stats.userPrompts[userId] || 0) + 1;
        
        if (!stats.dailyPrompts[today]) {
          stats.dailyPrompts[today] = { authenticated: 0, anonymous: 0 };
        }
        stats.dailyPrompts[today].authenticated = (stats.dailyPrompts[today].authenticated || 0) + 1;
      }

      stats.lastUpdated = admin.firestore.Timestamp.now();

      // Save to Firestore
      transaction.set(statsRef, stats, { merge: true });

      // Log the update
      if (isAnonymous) {
        console.log(`📊 📊 📊 ANONYMOUS PROMPT TRACKED (Firestore) 📊 📊 📊`);
        console.log(`   Total Anonymous: ${stats.totalAnonymousPrompts}`);
        console.log(`   Today Anonymous: ${stats.dailyPrompts[today]?.anonymous || 0}`);
        console.log(`   Total All Prompts: ${stats.totalAuthenticatedPrompts + stats.totalAnonymousPrompts}`);
      } else {
        console.log(`📊 📊 📊 AUTHENTICATED PROMPT TRACKED (Firestore) 📊 📊 📊`);
        console.log(`   User ID: ${userId}`);
        console.log(`   User's Total Prompts: ${stats.userPrompts[userId] || 0}`);
        console.log(`   Total Authenticated: ${stats.totalAuthenticatedPrompts}`);
        console.log(`   Today Authenticated: ${stats.dailyPrompts[today]?.authenticated || 0}`);
        console.log(`   Total All Prompts: ${stats.totalAuthenticatedPrompts + stats.totalAnonymousPrompts}`);
      }
    });

  } catch (error) {
    console.error('❌ Error tracking prompt in Firestore:', error);
    throw error;
  }
}

/**
 * Get prompt stats for admin dashboard
 */
export async function getPromptStatsForAdmin(): Promise<{
  total: number;
  authenticated: number;
  anonymous: number;
  today: number;
  todayAuthenticated: number;
  todayAnonymous: number;
  totalUsers: number;
  averagePerUser: number;
}> {
  try {
    const stats = await getPromptStats();
    const today = new Date().toISOString().split('T')[0];
    const todayData = stats.dailyPrompts[today] || { authenticated: 0, anonymous: 0 };
    
    const totalUsers = Object.keys(stats.userPrompts || {}).length;
    const averagePerUser = totalUsers > 0 
      ? Math.round((stats.totalAuthenticatedPrompts / totalUsers) * 100) / 100
      : 0;

    return {
      total: (stats.totalAuthenticatedPrompts || 0) + (stats.totalAnonymousPrompts || 0),
      authenticated: stats.totalAuthenticatedPrompts || 0,
      anonymous: stats.totalAnonymousPrompts || 0,
      today: (todayData.authenticated || 0) + (todayData.anonymous || 0),
      todayAuthenticated: todayData.authenticated || 0,
      todayAnonymous: todayData.anonymous || 0,
      totalUsers,
      averagePerUser,
    };
  } catch (error) {
    console.error('❌ Error getting prompt stats for admin:', error);
    return {
      total: 0,
      authenticated: 0,
      anonymous: 0,
      today: 0,
      todayAuthenticated: 0,
      todayAnonymous: 0,
      totalUsers: 0,
      averagePerUser: 0,
    };
  }
}

