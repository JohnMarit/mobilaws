/**
 * Learning progress storage in Firestore
 * Stores user learning data (XP, level, streak, module progress)
 */

import { getFirebaseAuth, admin } from './firebase-admin';

const LEARNING_PROGRESS_COLLECTION = 'learningProgress';

export interface LessonProgress {
  completed: boolean;
  score: number;
  completedAt?: string;
}

export interface DailyLimitTracking {
  date: string;
  lessonsCompleted: number;
}

export interface ModuleProgress {
  lessonsCompleted: Record<string, LessonProgress>;
  xpEarned: number;
  lastCompletedAt?: string;
}

export interface LearningState {
  userId: string;
  xp: number;
  streak: number;
  level: number;
  lastActiveDate?: string;
  dailyGoal: number;
  modulesProgress: Record<string, ModuleProgress>;
  dailyLimit: DailyLimitTracking;
  streakReactivationsRemaining?: number; // Number of reactivations left (0-3)
  updatedAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
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
 * Get user's learning progress from Firestore
 */
export async function getLearningProgress(userId: string): Promise<Omit<LearningState, 'createdAt' | 'updatedAt'> | null> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return null;
  }

  try {
    const docRef = db.collection(LEARNING_PROGRESS_COLLECTION).doc(userId);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data() as LearningState;
      // Return without timestamps for frontend use
      const { createdAt, updatedAt, ...progressData } = data;
      return progressData;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching learning progress:', error);
    return null;
  }
}

/**
 * Save or update user's learning progress in Firestore
 */
export async function saveLearningProgress(
  progress: Omit<LearningState, 'createdAt' | 'updatedAt'>
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return false;
  }

  try {
    const docRef = db.collection(LEARNING_PROGRESS_COLLECTION).doc(progress.userId);
    const existingDoc = await docRef.get();

    const now = admin.firestore.Timestamp.now();
    const progressData: LearningState = {
      ...progress,
      createdAt: existingDoc.exists ? (existingDoc.data() as LearningState).createdAt : now,
      updatedAt: now,
    };

    await docRef.set(progressData, { merge: true });
    console.log(`✅ Learning progress saved for user: ${progress.userId} (${progress.xp} XP)`);
    return true;
  } catch (error) {
    console.error('❌ Error saving learning progress:', error);
    return false;
  }
}

