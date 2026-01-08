/**
 * Counselor Ratings System
 * Handles user ratings for counselors
 */

import { getFirebaseAuth, admin } from './firebase-admin';

const COUNSELOR_RATINGS_COLLECTION = 'counselorRatings';
const COUNSELORS_COLLECTION = 'counselors';

export interface CounselorRating {
  id: string;
  counselorId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  comment?: string;
  chatId?: string; // Link to the chat session
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return admin.firestore();
}

/**
 * Submit a rating for a counselor
 */
export async function submitRating(
  counselorId: string,
  userId: string,
  userName: string,
  rating: number,
  comment?: string,
  chatId?: string
): Promise<{ success: boolean; message: string }> {
  const db = getFirestore();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  if (rating < 1 || rating > 5) {
    return { success: false, message: 'Rating must be between 1 and 5' };
  }

  try {
    // Check if user already rated this counselor
    const existingRating = await db
      .collection(COUNSELOR_RATINGS_COLLECTION)
      .where('counselorId', '==', counselorId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    const now = admin.firestore.Timestamp.now();
    let ratingId: string;

    if (!existingRating.empty) {
      // Update existing rating
      ratingId = existingRating.docs[0].id;
      await db.collection(COUNSELOR_RATINGS_COLLECTION).doc(ratingId).update({
        rating,
        comment: comment || admin.firestore.FieldValue.delete(),
        updatedAt: now,
      });
    } else {
      // Create new rating
      const ratingRef = db.collection(COUNSELOR_RATINGS_COLLECTION).doc();
      ratingId = ratingRef.id;
      await ratingRef.set({
        id: ratingId,
        counselorId,
        userId,
        userName,
        rating,
        comment: comment || '',
        chatId: chatId || '',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update counselor's average rating
    await updateCounselorRating(counselorId);

    console.log(`✅ Rating submitted: ${rating} stars for counselor ${counselorId}`);
    return { success: true, message: 'Rating submitted successfully' };
  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    return { success: false, message: 'Failed to submit rating' };
  }
}

/**
 * Update counselor's average rating
 */
async function updateCounselorRating(counselorId: string): Promise<void> {
  const db = getFirestore();
  if (!db) return;

  try {
    const ratingsSnapshot = await db
      .collection(COUNSELOR_RATINGS_COLLECTION)
      .where('counselorId', '==', counselorId)
      .get();

    if (ratingsSnapshot.empty) {
      // No ratings, set to 0
      await db.collection(COUNSELORS_COLLECTION).doc(counselorId).update({
        rating: 0,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return;
    }

    let totalRating = 0;
    ratingsSnapshot.forEach(doc => {
      const rating = doc.data() as CounselorRating;
      totalRating += rating.rating;
    });

    const averageRating = totalRating / ratingsSnapshot.size;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal

    await db.collection(COUNSELORS_COLLECTION).doc(counselorId).update({
      rating: roundedRating,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Updated counselor ${counselorId} rating to ${roundedRating}`);
  } catch (error) {
    console.error('❌ Error updating counselor rating:', error);
  }
}

/**
 * Get ratings for a counselor
 */
export async function getCounselorRatings(counselorId: string, limit: number = 20): Promise<CounselorRating[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COUNSELOR_RATINGS_COLLECTION)
      .where('counselorId', '==', counselorId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as CounselorRating);
  } catch (error) {
    console.error('❌ Error getting counselor ratings:', error);
    return [];
  }
}

/**
 * Get user's rating for a counselor
 */
export async function getUserRatingForCounselor(
  counselorId: string,
  userId: string
): Promise<CounselorRating | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    const snapshot = await db
      .collection(COUNSELOR_RATINGS_COLLECTION)
      .where('counselorId', '==', counselorId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as CounselorRating;
  } catch (error) {
    console.error('❌ Error getting user rating:', error);
    return null;
  }
}

