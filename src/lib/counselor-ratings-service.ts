/**
 * Counselor Ratings Service
 * Frontend service for rating counselors
 */

import { getApiUrl } from './api';

export interface CounselorRating {
  id: string;
  counselorId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  comment?: string;
  chatId?: string;
  createdAt: any;
  updatedAt: any;
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
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const apiUrl = getApiUrl('counsel/rating');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        counselorId,
        userId,
        userName,
        rating,
        comment,
        chatId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('❌ Error submitting rating:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get ratings for a counselor
 */
export async function getCounselorRatings(counselorId: string, limit: number = 20): Promise<CounselorRating[]> {
  try {
    const apiUrl = getApiUrl(`counsel/rating/${counselorId}?limit=${limit}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.ratings || [];
  } catch (error) {
    console.error('❌ Error getting ratings:', error);
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
  try {
    const apiUrl = getApiUrl(`counsel/rating/${counselorId}/user/${userId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.rating || null;
  } catch (error) {
    console.error('❌ Error getting user rating:', error);
    return null;
  }
}

