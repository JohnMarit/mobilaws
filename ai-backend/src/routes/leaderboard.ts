import { Router, Request, Response } from 'express';
import { getFirebaseAuth, admin, getAllFirebaseAuthUsers } from '../lib/firebase-admin';

const router = Router();

const LEADERBOARD_COLLECTION = 'leaderboard';

interface LeaderboardEntry {
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
 * Get Firestore database instance
 */
function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  return admin.firestore();
}

/**
 * Auto-populate leaderboard with ALL users from Firebase Auth
 * This ensures all users appear in the leaderboard, even with 0 XP
 * Also ensures all existing entries with XP > 0 are preserved
 */
async function autoPopulateLeaderboard(db: admin.firestore.Firestore): Promise<number> {
  try {
    console.log('🔄 Auto-populating leaderboard with Firebase Auth users...');

    // Get all existing leaderboard entries to preserve XP values
    const existingSnapshot = await db.collection(LEADERBOARD_COLLECTION).get();
    const existingEntries = new Map<string, LeaderboardEntry>();
    
    existingSnapshot.docs.forEach(doc => {
      const data = doc.data() as LeaderboardEntry;
      existingEntries.set(doc.id, data);
    });

    const usersWithXp = Array.from(existingEntries.values()).filter(e => e.xp > 0);
    console.log(`📊 Found ${existingEntries.size} existing leaderboard entries (${usersWithXp.length} with XP > 0)`);

    // Get Firebase Auth users (up to 1000 to ensure we get all users)
    const authUsers = await getAllFirebaseAuthUsers(1000);
    const authUserIds = new Set(authUsers.map(u => u.uid));

    console.log(`📊 Found ${authUsers.length} users in Firebase Auth`);

    // Use batched writes for efficiency (max 500 per batch)
    let batch = db.batch();
    let batchCount = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let preservedCount = 0;
    let skippedCount = 0; // Entries with XP > 0 not in Auth (preserve as-is)

    // Process Firebase Auth users
    for (const authUser of authUsers) {
      const entryRef = db.collection(LEADERBOARD_COLLECTION).doc(authUser.uid);
      const existingEntry = existingEntries.get(authUser.uid);

      // If entry exists with XP > 0, preserve ALL data including XP
      if (existingEntry && existingEntry.xp > 0) {
        // CRITICAL: Use merge: false to ensure we don't accidentally lose fields
        // Only update userName and userPicture, preserve everything else
        const entryData: LeaderboardEntry = {
          userId: authUser.uid,
          userName: authUser.displayName || authUser.email?.split('@')[0] || existingEntry.userName || 'User',
          userPicture: authUser.photoURL || existingEntry.userPicture,
          xp: existingEntry.xp, // CRITICAL: Preserve existing XP
          level: existingEntry.level || 1,
          streak: existingEntry.streak || 0,
          lessonsCompleted: existingEntry.lessonsCompleted || 0,
          lastUpdated: existingEntry.lastUpdated || new Date().toISOString(), // Preserve original lastUpdated
        };
        batch.set(entryRef, entryData); // Use set (not merge) to ensure complete data
        preservedCount++;
        console.log(`💾 Preserving user ${authUser.uid} with ${existingEntry.xp} XP`);
      } else if (existingEntry) {
        // Entry exists but with 0 XP, update user info but keep XP at 0
        const entryData: LeaderboardEntry = {
          userId: authUser.uid,
          userName: authUser.displayName || authUser.email?.split('@')[0] || existingEntry.userName || 'User',
          userPicture: authUser.photoURL || existingEntry.userPicture,
          xp: 0,
          level: existingEntry.level || 1,
          streak: existingEntry.streak || 0,
          lessonsCompleted: existingEntry.lessonsCompleted || 0,
          lastUpdated: existingEntry.lastUpdated || new Date().toISOString(),
        };
        batch.set(entryRef, entryData);
        updatedCount++;
      } else {
        // New user, create entry with 0 XP
        const entryData: LeaderboardEntry = {
          userId: authUser.uid,
          userName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
          userPicture: authUser.photoURL || undefined,
          xp: 0,
          level: 1,
          streak: 0,
          lessonsCompleted: 0,
          lastUpdated: authUser.metadata.lastSignInTime || new Date().toISOString(),
        };
        batch.set(entryRef, entryData);
        addedCount++;
      }

      batchCount++;

      // Commit batch every 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    // CRITICAL: Preserve entries with XP > 0 that are NOT in Firebase Auth
    // These might be users who were deleted from Auth but should still appear in leaderboard
    for (const [userId, entry] of existingEntries.entries()) {
      if (entry.xp > 0 && !authUserIds.has(userId)) {
        // User has XP > 0 but not in Auth - preserve their entry as-is
        const entryRef = db.collection(LEADERBOARD_COLLECTION).doc(userId);
        batch.set(entryRef, entry); // Preserve exactly as-is
        skippedCount++;
        console.log(`🔒 Preserving orphaned entry for ${userId} with ${entry.xp} XP (not in Auth)`);
        
        batchCount++;
        if (batchCount >= 500) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Leaderboard synced: ${addedCount} added, ${updatedCount} updated, ${preservedCount} preserved (with XP > 0), ${skippedCount} orphaned entries preserved`);
    return existingEntries.size + addedCount;
  } catch (error) {
    console.error('❌ Failed to auto-populate leaderboard:', error);
    throw error;
  }
}

/**
 * Get all leaderboard entries, sorted by XP (descending), then randomly for same XP
 * GET /api/leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    if (!db) {
      console.error('❌ Firebase Admin not initialized - cannot fetch leaderboard');
      return res.status(500).json({ error: 'Firebase Admin not initialized', entries: [] });
    }

    console.log('🔄 Starting leaderboard fetch...');

    // Always sync leaderboard with Firebase Auth to ensure all users with XP are included
    // This ensures offline users with points remain visible
    try {
      const populatedCount = await autoPopulateLeaderboard(db);
      console.log(`✅ Leaderboard synced: ${populatedCount} total entries`);
    } catch (populateError) {
      console.error('⚠️ Auto-population failed, continuing with existing entries:', populateError);
    }

    // Get ALL leaderboard entries
    let snapshot;
    try {
      snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
    } catch (fetchError) {
      console.error('❌ Failed to fetch leaderboard from Firestore:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch leaderboard', entries: [] });
    }

    const entries: LeaderboardEntry[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const entry: LeaderboardEntry = {
        userId: doc.id,
        userName: data.userName || 'Unknown',
        userPicture: data.userPicture,
        xp: typeof data.xp === 'number' ? data.xp : 0, // Ensure XP is a number
        level: data.level || 1,
        streak: data.streak || 0,
        lessonsCompleted: data.lessonsCompleted || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      };
      return entry;
    });

    // Log entries with XP > 0 for debugging
    const entriesWithXp = entries.filter(e => e.xp > 0);
    console.log(`📊 Retrieved ${entries.length} total entries from leaderboard (${entriesWithXp.length} with XP > 0)`);
    
    if (entriesWithXp.length > 0) {
      const top5 = entriesWithXp
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 5)
        .map(e => `${e.userName}: ${e.xp} XP`);
      console.log(`🏆 Top 5 by XP: ${top5.join(', ')}`);
    }

    // If no entries, try to get users from Firebase Auth directly as fallback
    if (entries.length === 0) {
      console.log('⚠️ No entries in leaderboard, attempting direct Firebase Auth fetch...');
      try {
        const authUsers = await getAllFirebaseAuthUsers(10);
        if (authUsers.length > 0) {
          console.log(`📊 Found ${authUsers.length} users in Firebase Auth, adding to response...`);
          const fallbackEntries: LeaderboardEntry[] = authUsers.map(authUser => ({
            userId: authUser.uid,
            userName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
            userPicture: authUser.photoURL || undefined,
            xp: 0,
            level: 1,
            streak: 0,
            lessonsCompleted: 0,
            lastUpdated: authUser.metadata.lastSignInTime || new Date().toISOString(),
          }));
          entries.push(...fallbackEntries);
          console.log(`✅ Added ${fallbackEntries.length} fallback entries`);
        }
      } catch (authError) {
        console.error('❌ Failed to fetch users from Firebase Auth:', authError);
      }
    }

    // Group by XP level
    const groupedByXp = new Map<number, LeaderboardEntry[]>();
    entries.forEach(entry => {
      const xpGroup = groupedByXp.get(entry.xp) || [];
      xpGroup.push(entry);
      groupedByXp.set(entry.xp, xpGroup);
    });

    // Sort XP levels descending
    const sortedXpLevels = Array.from(groupedByXp.keys()).sort((a, b) => b - a);

    // Flatten: for each XP level, sort users alphabetically
    // Filter to only include users with XP > 0
    // IMPORTANT: This preserves all users with XP regardless of online/offline status
    const sortedEntries: LeaderboardEntry[] = [];
    sortedXpLevels.forEach(xpLevel => {
      // Only include users with XP > 0 (but include ALL of them, online or offline)
      if (xpLevel > 0) {
        const usersAtThisLevel = groupedByXp.get(xpLevel)!;
        // Sort users at the same XP level alphabetically by userName
        const sorted = usersAtThisLevel.sort((a, b) => a.userName.localeCompare(b.userName));
        sortedEntries.push(...sorted);
      }
    });

    console.log(`✅ Returning ${sortedEntries.length} sorted entries (all users with XP > 0, regardless of online status)`);

    // Always return at least an empty array, never null/undefined
    return res.json({ entries: sortedEntries || [] });
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard', entries: [] });
  }
});

/**
 * Update or create a leaderboard entry
 * POST /api/leaderboard/update
 * Body: { userId, userName, xp, level, lessonsCompleted, userPicture? }
 */
router.post('/leaderboard/update', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const { userId, userName, xp, level, streak, lessonsCompleted, userPicture } = req.body;

    if (!userId || !userName || typeof xp !== 'number' || typeof level !== 'number') {
      return res.status(400).json({ error: 'Missing required fields: userId, userName, xp, level' });
    }

    const entryRef = db.collection(LEADERBOARD_COLLECTION).doc(userId);
    const existingDoc = await entryRef.get();
    const existingData = existingDoc.exists ? (existingDoc.data() as LeaderboardEntry) : null;
    
    // CRITICAL: If update tries to set XP to 0 but user has XP > 0, preserve the existing XP
    // This prevents accidental loss of points during syncs or errors
    const existingXp = existingData?.xp || 0;
    let finalXp = xp || 0;
    
    // Only preserve if update would reset XP to 0 and user had XP > 0
    if (finalXp === 0 && existingXp > 0) {
      finalXp = existingXp;
      console.log(`⚠️ XP preservation: User ${userId} had ${existingXp} XP, update tried to set 0, preserved ${finalXp}`);
    }

    const entryData: LeaderboardEntry = {
      userId,
      userName,
      userPicture: userPicture || existingData?.userPicture,
      xp: finalXp,
      level: level || 1,
      streak: streak !== undefined ? streak : (existingData?.streak || 0),
      lessonsCompleted: lessonsCompleted || 0,
      lastUpdated: new Date().toISOString(),
    };

    await entryRef.set(entryData, { merge: true });
    console.log(`✅ Leaderboard entry updated for user: ${userId} (${xp} XP)`);

    return res.json({ success: true, entry: entryData });
  } catch (error) {
    console.error('❌ Error updating leaderboard:', error);
    return res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

/**
 * Initialize a user in the leaderboard (when they first log in)
 * POST /api/leaderboard/init
 * Body: { userId, userName, userPicture? }
 */
router.post('/leaderboard/init', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const { userId, userName, userPicture } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({ error: 'Missing required fields: userId, userName' });
    }

    console.log(`🆕 Initializing leaderboard entry for user: ${userId} (${userName})`);

    const entryRef = db.collection(LEADERBOARD_COLLECTION).doc(userId);
    const existingDoc = await entryRef.get();

    const entryData: LeaderboardEntry = {
      userId,
      userName,
      userPicture: userPicture || existingDoc.data()?.userPicture,
      xp: existingDoc.exists ? (existingDoc.data() as LeaderboardEntry).xp : 0,
      level: existingDoc.exists ? (existingDoc.data() as LeaderboardEntry).level : 1,
      streak: existingDoc.exists ? (existingDoc.data() as LeaderboardEntry).streak || 0 : 0,
      lessonsCompleted: existingDoc.exists ? (existingDoc.data() as LeaderboardEntry).lessonsCompleted : 0,
      lastUpdated: new Date().toISOString(),
    };

    await entryRef.set(entryData, { merge: true });
    console.log(`✅ Leaderboard entry ${existingDoc.exists ? 'updated' : 'created'} for: ${userId}`);

    return res.json({ success: true, entry: entryData });
  } catch (error) {
    console.error('❌ Error initializing leaderboard entry:', error);
    return res.status(500).json({ error: 'Failed to initialize leaderboard entry' });
  }
});

/**
 * Manually trigger leaderboard population with all Firebase Auth users
 * POST /api/leaderboard/populate
 */
router.post('/leaderboard/populate', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    console.log('🔧 Manual leaderboard population triggered');
    await autoPopulateLeaderboard(db);

    // Get count of entries
    const snapshot = await db.collection(LEADERBOARD_COLLECTION).get();
    const count = snapshot.size;

    console.log(`✅ Leaderboard now has ${count} entries`);

    return res.json({
      success: true,
      message: `Leaderboard populated with ${count} users`,
      totalEntries: count
    });
  } catch (error) {
    console.error('❌ Error populating leaderboard:', error);
    return res.status(500).json({ error: 'Failed to populate leaderboard' });
  }
});

export default router;

