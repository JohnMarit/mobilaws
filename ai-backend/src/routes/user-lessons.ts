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

/**
 * Delete user-generated lessons for a module
 * DELETE /api/user-lessons/:userId/:moduleId
 * Query params: 
 *   - deleteAll (optional, default: false) - If true, delete all lessons. If false, delete only recent 5 sets
 *   - resetRequestCount (optional, default: true) - Reset request count after deletion
 */
router.delete('/user-lessons/:userId/:moduleId', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId } = req.params;
    const deleteAll = req.query.deleteAll === 'true';
    const resetRequestCount = req.query.resetRequestCount !== 'false'; // Default to true

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
      return res.json({ 
        success: true, 
        message: 'No user lessons found',
        deletedCount: 0,
        totalSets: 0
      });
    }

    const userData = userLessonsDoc.data();
    const moduleLessons = userData?.modules?.[moduleId]?.lessons || [];

    if (moduleLessons.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No lessons to delete',
        deletedCount: 0,
        totalSets: 0
      });
    }

    let lessonsToDelete: any[] = [];
    let lessonsToKeep: any[] = [];
    let totalSets = 0;

    if (deleteAll) {
      // Delete all lessons
      lessonsToDelete = moduleLessons;
      lessonsToKeep = [];
      
      // Count total sets
      const batchIds = new Set(moduleLessons.map((l: any) => l.generationBatchId || l.createdAt?.toMillis?.() || 0));
      totalSets = batchIds.size;
    } else {
      // Group lessons by generation batch
      const lessonsByBatch = new Map<string, any[]>();
      
      moduleLessons.forEach((lesson: any) => {
        // Use generationBatchId if available, otherwise use createdAt timestamp as fallback
        const batchId = lesson.generationBatchId || 
                       (lesson.createdAt?.toMillis ? lesson.createdAt.toMillis().toString() : 
                        (lesson.createdAt ? new Date(lesson.createdAt).getTime().toString() : 'unknown'));
        
        if (!lessonsByBatch.has(batchId)) {
          lessonsByBatch.set(batchId, []);
        }
        lessonsByBatch.get(batchId)!.push(lesson);
      });

      totalSets = lessonsByBatch.size;

      // Sort batches by creation time (newest first)
      // Get the most recent timestamp from each batch
      const batches = Array.from(lessonsByBatch.entries()).map(([batchId, lessons]) => {
        const timestamps = lessons
          .map((l: any) => l.createdAt?.toMillis ? l.createdAt.toMillis() : 
                          (l.createdAt ? new Date(l.createdAt).getTime() : 0))
          .filter((t: number) => t > 0);
        const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        return { batchId, lessons, maxTimestamp };
      });

      // Sort by maxTimestamp descending (newest first)
      batches.sort((a, b) => b.maxTimestamp - a.maxTimestamp);

      // Delete only the most recent 5 sets
      const setsToDelete = batches.slice(0, 5);
      const setsToKeep = batches.slice(5);

      setsToDelete.forEach(batch => {
        lessonsToDelete.push(...batch.lessons);
      });

      setsToKeep.forEach(batch => {
        lessonsToKeep.push(...batch.lessons);
      });
    }

    const deletedCount = lessonsToDelete.length;
    const keptCount = lessonsToKeep.length;

    // Update user lessons document
    if (lessonsToKeep.length > 0) {
      // Keep remaining lessons
      await userLessonsRef.set({
        ...userData,
        modules: {
          ...userData.modules,
          [moduleId]: {
            lessons: lessonsToKeep,
            lastUpdated: admin.firestore.Timestamp.now()
          }
        },
        updatedAt: admin.firestore.Timestamp.now()
      }, { merge: true });
    } else {
      // Remove module entry if no lessons remain
      const updatedModules = { ...userData.modules };
      delete updatedModules[moduleId];
      await userLessonsRef.set({
        ...userData,
        modules: updatedModules,
        updatedAt: admin.firestore.Timestamp.now()
      }, { merge: true });
    }

    // Optionally reset request count
    if (resetRequestCount && deleteAll) {
      const userRequestsRef = db.collection('lessonRequests').doc(userId);
      const userRequestsDoc = await userRequestsRef.get();
      
      if (userRequestsDoc.exists) {
        const requestsData = userRequestsDoc.data();
        const updatedRequests = { ...requestsData };
        
        // Remove request count for this module
        if (updatedRequests.modules?.[moduleId]) {
          delete updatedRequests.modules[moduleId];
        }
        
        await userRequestsRef.set({
          ...updatedRequests,
          updatedAt: admin.firestore.Timestamp.now()
        }, { merge: true });
      }
    }

    console.log(`✅ Deleted ${deletedCount} user-generated lessons (${deleteAll ? 'all' : 'recent 5 sets'}) for user ${userId}, module ${moduleId}`);

    return res.json({
      success: true,
      message: deleteAll 
        ? `Deleted all ${deletedCount} generated lesson${deletedCount !== 1 ? 's' : ''}`
        : `Deleted ${deletedCount} lesson${deletedCount !== 1 ? 's' : ''} from the most recent 5 sets (${keptCount} lesson${keptCount !== 1 ? 's' : ''} kept)`,
      deletedCount,
      keptCount,
      totalSets,
      deletedSets: deleteAll ? totalSets : Math.min(5, totalSets),
      requestCountReset: resetRequestCount && deleteAll
    });
  } catch (error) {
    console.error('❌ Error deleting user lessons:', error);
    return res.status(500).json({ 
      error: 'Failed to delete user lessons',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

