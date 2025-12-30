/**
 * Leaderboard management for learning system
 * Tracks top learners by XP and provides ranking information
 * Uses Firestore backend for shared leaderboard across all users
 */

import { getApiUrl } from './api';

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userPicture?: string;
  xp: number;
  level: number;
  streak: number;
  lessonsCompleted: number;
  lastUpdated: string;
}

/**
 * Initialize a user in the leaderboard (called when they first log in)
 */
export async function initLeaderboardEntry(
  userId: string,
  userName: string,
  userPicture?: string
): Promise<void> {
  try {
    const apiUrl = getApiUrl('leaderboard/init');
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, userPicture }),
    });
  } catch (err) {
    console.warn('Failed to initialize leaderboard entry', err);
  }
}

/**
 * Update or add a user's leaderboard entry
 */
export async function updateLeaderboardEntry(
  userId: string,
  userName: string,
  xp: number,
  level: number,
  streak: number,
  lessonsCompleted: number,
  userPicture?: string
): Promise<void> {
  try {
    const apiUrl = getApiUrl('leaderboard/update');
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userName,
        xp,
        level,
        streak,
        lessonsCompleted,
        userPicture,
      }),
    });
  } catch (err) {
    console.warn('Failed to update leaderboard entry', err);
  }
}

/**
 * Get all leaderboard entries from the API
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const apiUrl = getApiUrl('leaderboard');
    console.log('📡 Fetching leaderboard from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📨 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch leaderboard:', response.status, errorText);
      // Return empty array instead of throwing
      return [];
    }

    const data = await response.json();
    console.log('✅ Leaderboard data received:', {
      entryCount: data.entries?.length || 0,
      entries: data.entries?.slice(0, 3) // Log first 3 for debugging
    });

    // Ensure we always return an array
    const entries = Array.isArray(data.entries) ? data.entries : [];
    console.log(`📊 Returning ${entries.length} entries`);

    return entries;
  } catch (err) {
    console.error('❌ Failed to load leaderboard:', err);
    // Always return empty array, never throw
    return [];
  }
}

/**
 * Get top N learners
 */
export async function getTopLearners(limit: number = 10): Promise<LeaderboardEntry[]> {
  const entries = await getLeaderboard();

  // Sort: 1) Highest XP first, 2) If same XP, alphabetically by userName
  const sorted = [...entries].sort((a, b) => {
    if (b.xp !== a.xp) {
      return b.xp - a.xp;
    }
    return a.userName.localeCompare(b.userName);
  });

  return sorted.slice(0, limit);
}

/**
 * Get user's rank and information about reaching top 10
 */
export async function getUserRankInfo(userId: string): Promise<{
  rank: number | null;
  isInTop10: boolean;
  xpNeededForTop10: number;
  completionRate: number;
}> {
  const entries = await getLeaderboard();
  const sorted = [...entries].sort((a, b) => {
    if (b.xp !== a.xp) {
      return b.xp - a.xp;
    }
    return a.userName.localeCompare(b.userName);
  });

  const userIndex = sorted.findIndex(e => e.userId === userId);
  const userEntry = userIndex >= 0 ? sorted[userIndex] : null;

  if (!userEntry) {
    // User not in leaderboard yet
    if (sorted.length < 10) {
      return {
        rank: null,
        isInTop10: false,
        xpNeededForTop10: 0,
        completionRate: 0
      };
    }
    // Calculate what's needed to reach top 10
    const top10Threshold = sorted[9].xp;
    return {
      rank: null,
      isInTop10: false,
      xpNeededForTop10: top10Threshold + 1,
      completionRate: 0
    };
  }

  const rank = userIndex + 1;
  const isInTop10 = rank <= 10;

  if (isInTop10) {
    return {
      rank,
      isInTop10: true,
      xpNeededForTop10: 0,
      completionRate: 100
    };
  }

  // User is not in top 10 - calculate what they need
  const top10Threshold = sorted[9].xp;
  const xpNeeded = top10Threshold - userEntry.xp + 1;
  const completionRate = Math.min(100, Math.round((userEntry.xp / top10Threshold) * 100));

  return {
    rank,
    isInTop10: false,
    xpNeededForTop10: xpNeeded,
    completionRate
  };
}

/**
 * Calculate total lessons completed from learning state
 */
export function calculateLessonsCompleted(modulesProgress: Record<string, { lessonsCompleted: Record<string, any> }>): number {
  let total = 0;
  for (const moduleId in modulesProgress) {
    const module = modulesProgress[moduleId];
    if (module.lessonsCompleted) {
      total += Object.keys(module.lessonsCompleted).length;
    }
  }
  return total;
}

