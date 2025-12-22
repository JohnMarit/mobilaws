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
 */
async function autoPopulateLeaderboard(db: admin.firestore.Firestore): Promise<void> {
  try {
    console.log('🔄 Auto-populating leaderboard with Firebase Auth users...');
    
    // Get ALL Firebase Auth users (up to 1000)
    const authUsers = await getAllFirebaseAuthUsers(1000);
    
    console.log(`📊 Found ${authUsers.length} users in Firebase Auth`);
    
    if (authUsers.length === 0) return;

    // Use batched writes for efficiency (max 500 per batch)
    let batch = db.batch();
    let batchCount = 0;
    let addedCount = 0;
    let updatedCount = 0;

    for (const authUser of authUsers) {
      const entryRef = db.collection(LEADERBOARD_COLLECTION).doc(authUser.uid);
      const existingDoc = await entryRef.get();

      const entryData: LeaderboardEntry = {
        userId: authUser.uid,
        userName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
        userPicture: authUser.photoURL || undefined,
        xp: existingDoc.exists ? (existingDoc.data() as LeaderboardEntry).xp : 0,
        level: existingDoc.exists ? (existingDoc.data() as LeaderboardEntry).level : 1,
        lessonsCompleted: existingDoc.exists ? (existingDoc.data() as LeaderboardEntry).lessonsCompleted : 0,
        lastUpdated: authUser.metadata.lastSignInTime || new Date().toISOString(),
      };

      if (!existingDoc.exists) {
        batch.set(entryRef, entryData);
        addedCount++;
      } else {
        // Update name/picture if changed
        batch.set(entryRef, entryData, { merge: true });
        updatedCount++;
      }

      batchCount++;

      // Commit batch every 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Leaderboard populated: ${addedCount} added, ${updatedCount} updated`);
  } catch (error) {
    console.error('❌ Failed to auto-populate leaderboard:', error);
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
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    // Auto-populate leaderboard with ALL users (blocking to ensure users are visible)
    await autoPopulateLeaderboard(db);

    // Get ALL leaderboard entries (no limit initially)
    const snapshot = await db.collection(LEADERBOARD_COLLECTION)
      .get();

    const entries: LeaderboardEntry[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        userName: data.userName || 'Unknown',
        userPicture: data.userPicture,
        xp: data.xp || 0,
        level: data.level || 1,
        lessonsCompleted: data.lessonsCompleted || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      };
    });

    console.log(`📊 Retrieved ${entries.length} entries from leaderboard`);

    // Group by XP level
    const groupedByXp = new Map<number, LeaderboardEntry[]>();
    entries.forEach(entry => {
      const xpGroup = groupedByXp.get(entry.xp) || [];
      xpGroup.push(entry);
      groupedByXp.set(entry.xp, xpGroup);
    });

    // Sort XP levels descending
    const sortedXpLevels = Array.from(groupedByXp.keys()).sort((a, b) => b - a);

    // Flatten: for each XP level, shuffle users randomly
    const sortedEntries: LeaderboardEntry[] = [];
    sortedXpLevels.forEach(xpLevel => {
      const usersAtThisLevel = groupedByXp.get(xpLevel)!;
      // Shuffle users at the same XP level randomly
      const shuffled = usersAtThisLevel.sort(() => Math.random() - 0.5);
      sortedEntries.push(...shuffled);
    });

    console.log(`✅ Returning ${sortedEntries.length} sorted entries`);

    return res.json({ entries: sortedEntries });
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
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

    const { userId, userName, xp, level, lessonsCompleted, userPicture } = req.body;

    if (!userId || !userName || typeof xp !== 'number' || typeof level !== 'number') {
      return res.status(400).json({ error: 'Missing required fields: userId, userName, xp, level' });
    }

    const entryRef = db.collection(LEADERBOARD_COLLECTION).doc(userId);
    const existingDoc = await entryRef.get();

    const entryData: LeaderboardEntry = {
      userId,
      userName,
      userPicture: userPicture || existingDoc.data()?.userPicture,
      xp: xp || 0,
      level: level || 1,
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

