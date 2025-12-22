import { Router, Request, Response } from 'express';
import { getFirebaseAuth, admin } from '../lib/firebase-admin';

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
 * Get all leaderboard entries, sorted by XP (descending), then by lastUpdated (descending)
 * GET /api/leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    // Order by XP only (Firestore composite index not needed)
    // Secondary sort by lastUpdated will be done client-side
    const snapshot = await db.collection(LEADERBOARD_COLLECTION)
      .orderBy('xp', 'desc')
      .limit(100) // Get top 100 for flexibility
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

    // Sort again client-side to ensure proper ordering (XP first, then lastUpdated)
    entries.sort((a, b) => {
      if (b.xp !== a.xp) {
        return b.xp - a.xp;
      }
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

    return res.json({ entries });
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

    const entryRef = db.collection(LEADERBOARD_COLLECTION).doc(userId);
    const existingDoc = await entryRef.get();

    // Only create if doesn't exist
    if (!existingDoc.exists) {
      const entryData: LeaderboardEntry = {
        userId,
        userName,
        userPicture,
        xp: 0,
        level: 1,
        lessonsCompleted: 0,
        lastUpdated: new Date().toISOString(),
      };

      await entryRef.set(entryData);
      console.log(`✅ Leaderboard entry initialized for user: ${userId}`);
      return res.json({ success: true, entry: entryData });
    } else {
      // Update name/picture if provided
      const existingData = existingDoc.data() as LeaderboardEntry;
      const entryData: LeaderboardEntry = {
        ...existingData,
        userName: userName || existingData.userName,
        userPicture: userPicture || existingData.userPicture,
        lastUpdated: new Date().toISOString(),
      };
      await entryRef.set(entryData, { merge: true });
      return res.json({ success: true, entry: entryData });
    }
  } catch (error) {
    console.error('❌ Error initializing leaderboard entry:', error);
    return res.status(500).json({ error: 'Failed to initialize leaderboard entry' });
  }
});

export default router;

