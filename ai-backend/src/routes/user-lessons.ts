import { Router, Request, Response } from 'express';
import { admin } from '../lib/firebase-admin';

const router = Router();

/**
 * Get user-specific lessons for a module
 * GET /api/user-lessons/:userId/:moduleId
 */
router.get('/user-lessons/:userId/:moduleId', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId } = req.params;

    if (!userId || !moduleId) {
      return res.status(400).json({ error: 'Missing userId or moduleId' });
    }

    const db = admin.firestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const userLessonsRef = db.collection('userLessons').doc(userId);
    const userLessonsDoc = await userLessonsRef.get();

    if (!userLessonsDoc.exists) {
      return res.json({ lessons: [] });
    }

    const userData = userLessonsDoc.data();
    const moduleLessons = userData?.modules?.[moduleId]?.lessons || [];

    // Convert Firestore Timestamps to ISO strings for JSON response
    const convertedLessons = moduleLessons.map((lesson: any) => {
      if (lesson.createdAt && lesson.createdAt.toDate) {
        return {
          ...lesson,
          createdAt: lesson.createdAt.toDate().toISOString()
        };
      }
      return lesson;
    });

    return res.json({ lessons: convertedLessons });
  } catch (error) {
    console.error('❌ Error fetching user lessons:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user lessons',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all user-specific lessons
 * GET /api/user-lessons/:userId
 */
router.get('/user-lessons/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = admin.firestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const userLessonsRef = db.collection('userLessons').doc(userId);
    const userLessonsDoc = await userLessonsRef.get();

    if (!userLessonsDoc.exists) {
      return res.json({ modules: {} });
    }

    const userData = userLessonsDoc.data();
    const modules = userData?.modules || {};
    
    // Convert Firestore Timestamps to ISO strings for JSON response
    const convertedModules: Record<string, any> = {};
    for (const [moduleId, moduleData] of Object.entries(modules)) {
      const module = moduleData as any;
      convertedModules[moduleId] = {
        ...module,
        lessons: (module.lessons || []).map((lesson: any) => {
          if (lesson.createdAt && lesson.createdAt.toDate) {
            return {
              ...lesson,
              createdAt: lesson.createdAt.toDate().toISOString()
            };
          }
          return lesson;
        })
      };
    }

    return res.json({ modules: convertedModules });
  } catch (error) {
    console.error('❌ Error fetching user lessons:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user lessons',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

