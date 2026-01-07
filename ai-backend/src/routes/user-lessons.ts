import { Router, Request, Response } from 'express';
import { admin, getFirestore } from '../lib/firebase-admin';

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

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available', message: 'Firebase Admin not initialized' });
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

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available', message: 'Firebase Admin not initialized' });
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

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available', message: 'Firebase Admin not initialized' });
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
    
    if (!userData) {
      return res.json({ 
        success: true, 
        message: 'No user lessons found',
        deletedCount: 0,
        totalSets: 0
      });
    }
    
    const moduleLessons = userData.modules?.[moduleId]?.lessons || [];

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
      // Delete the last 5 lessons (most recently generated)
      // Sort all lessons by creation time (newest first)
      const sortedLessons = [...moduleLessons].sort((a: any, b: any) => {
        let timestampA = 0;
        let timestampB = 0;
        
        // Extract timestamp from lesson A
        if (a.createdAt?.toMillis) {
          timestampA = a.createdAt.toMillis();
        } else if (a.createdAt?.seconds) {
          timestampA = a.createdAt.seconds * 1000 + (a.createdAt.nanoseconds || 0) / 1000000;
        } else if (a.createdAt) {
          const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
          timestampA = dateA instanceof Date ? dateA.getTime() : 0;
        } else if (a.generationBatchId && a.generationBatchId.startsWith('batch-')) {
          const timestampStr = a.generationBatchId.replace('batch-', '');
          timestampA = parseInt(timestampStr, 10) || 0;
        }
        
        // Extract timestamp from lesson B
        if (b.createdAt?.toMillis) {
          timestampB = b.createdAt.toMillis();
        } else if (b.createdAt?.seconds) {
          timestampB = b.createdAt.seconds * 1000 + (b.createdAt.nanoseconds || 0) / 1000000;
        } else if (b.createdAt) {
          const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
          timestampB = dateB instanceof Date ? dateB.getTime() : 0;
        } else if (b.generationBatchId && b.generationBatchId.startsWith('batch-')) {
          const timestampStr = b.generationBatchId.replace('batch-', '');
          timestampB = parseInt(timestampStr, 10) || 0;
        }
        
        // Sort descending (newest first)
        return timestampB - timestampA;
      });
      
      // Count total sets for response
      const batchIds = new Set(sortedLessons.map((l: any) => l.generationBatchId || 'unknown'));
      totalSets = batchIds.size;
      
      // Delete the last 5 lessons (most recent)
      lessonsToDelete = sortedLessons.slice(0, 5);
      lessonsToKeep = sortedLessons.slice(5);
      
      console.log(`🗑️ Will delete ${lessonsToDelete.length} most recent lesson(s), keep ${lessonsToKeep.length} lesson(s)`);
      console.log(`📊 Total sets: ${totalSets}`);
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
        : `Deleted ${deletedCount} most recent lesson${deletedCount !== 1 ? 's' : ''} (${keptCount} lesson${keptCount !== 1 ? 's' : ''} kept)`,
      deletedCount,
      keptCount,
      totalSets,
      deletedSets: deleteAll ? totalSets : (deletedCount > 0 ? 1 : 0),
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

