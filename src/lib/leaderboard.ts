/**
 * Leaderboard management for learning system
 * Tracks top learners by XP and provides ranking information
 */

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userPicture?: string;
  xp: number;
  level: number;
  lessonsCompleted: number;
  lastUpdated: string;
}

const LEADERBOARD_STORAGE_KEY = 'mobilaws-leaderboard';

/**
 * Get all leaderboard entries from storage
 */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch (err) {
    console.warn('Failed to load leaderboard', err);
    return [];
  }
}

/**
 * Save leaderboard entries to storage
 */
export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save leaderboard', err);
  }
}

/**
 * Update or add a user's leaderboard entry
 */
export function updateLeaderboardEntry(
  userId: string,
  userName: string,
  xp: number,
  level: number,
  lessonsCompleted: number,
  userPicture?: string
): void {
  const entries = getLeaderboard();
  const existingIndex = entries.findIndex(e => e.userId === userId);
  const existingEntry = existingIndex >= 0 ? entries[existingIndex] : null;
  
  const entry: LeaderboardEntry = {
    userId,
    userName,
    // Preserve existing picture if new one not provided, otherwise use new one
    userPicture: userPicture || existingEntry?.userPicture,
    xp,
    level,
    lessonsCompleted,
    lastUpdated: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  // Sort primarily by XP (descending), then by most recent activity
  entries.sort((a, b) => {
    if (b.xp !== a.xp) {
      return b.xp - a.xp;
    }
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });

  saveLeaderboard(entries);
}

/**
 * Get top N learners
 */
export function getTopLearners(limit: number = 10): LeaderboardEntry[] {
  const entries = getLeaderboard();

  // Sort again defensively in case storage order changed:
  // 1) Highest XP first
  // 2) If same XP, most recently active first
  const sorted = [...entries].sort((a, b) => {
    if (b.xp !== a.xp) {
      return b.xp - a.xp;
    }
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });

  return sorted.slice(0, limit);
}

/**
 * Get user's rank and information about reaching top 10
 */
export function getUserRankInfo(userId: string): {
  rank: number | null;
  isInTop10: boolean;
  xpNeededForTop10: number;
  completionRate: number;
} {
  const entries = getLeaderboard();
  const sorted = [...entries].sort((a, b) => {
    if (b.xp !== a.xp) {
      return b.xp - a.xp;
    }
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
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

