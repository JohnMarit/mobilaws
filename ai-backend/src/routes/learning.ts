import { Router, Request, Response } from 'express';
import { getLearningProgress, saveLearningProgress } from '../lib/learning-storage';
import { calculateAllModulesProgress, getCorrectProgressPercentage } from '../lib/progress-calculator';

const router = Router();

/**
 * Get user's learning progress
 * GET /api/learning/progress/:userId
 */
router.get('/learning/progress/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const progress = await getLearningProgress(userId);

    if (!progress) {
      // Return default progress if not found
      return res.json({
        userId,
        xp: 0,
        streak: 0,
        level: 1,
        dailyGoal: 40,
        modulesProgress: {},
        dailyLimit: {
          date: new Date().toISOString().split('T')[0],
          lessonsCompleted: 0
        },
        streakReactivationsRemaining: 3
      });
    }

    return res.json(progress);
  } catch (error) {
    console.error('❌ Error fetching learning progress:', error);
    return res.status(500).json({ error: 'Failed to fetch learning progress' });
  }
});

/**
 * Save user's learning progress
 * POST /api/learning/progress
 * Body: { userId, xp, level, streak, modulesProgress, dailyGoal, dailyLimit, lastActiveDate?, streakReactivationsRemaining? }
 */
router.post('/learning/progress', async (req: Request, res: Response) => {
  try {
    const { userId, xp, level, streak, modulesProgress, dailyGoal, dailyLimit, lastActiveDate, streakReactivationsRemaining } = req.body;

    if (!userId || typeof xp !== 'number' || typeof level !== 'number') {
      return res.status(400).json({ error: 'Missing required fields: userId, xp, level' });
    }

    const progress = {
      userId,
      xp: xp || 0,
      streak: streak || 0,
      level: level || 1,
      lastActiveDate,
      dailyGoal: dailyGoal || 40,
      modulesProgress: modulesProgress || {},
      dailyLimit: dailyLimit || {
        date: new Date().toISOString().split('T')[0],
        lessonsCompleted: 0
      },
      streakReactivationsRemaining: streakReactivationsRemaining !== undefined ? streakReactivationsRemaining : 3
    };

    const success = await saveLearningProgress(progress);

    if (success) {
      return res.json({ success: true, progress });
    } else {
      return res.status(500).json({ error: 'Failed to save learning progress' });
    }
  } catch (error) {
    console.error('❌ Error saving learning progress:', error);
    return res.status(500).json({ error: 'Failed to save learning progress' });
  }
});

/**
 * Get CORRECT page-based progress for user (enhanced endpoint)
 * GET /api/learning/progress-enhanced/:userId
 * Returns page-based progress for all modules
 */
router.get('/learning/progress-enhanced/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get standard learning progress
    const learningProgress = await getLearningProgress(userId);

    // Get correct page-based progress for all modules
    const moduleProgressList = await calculateAllModulesProgress(userId);

    // Build enhanced response
    const enhancedModulesProgress: Record<string, any> = {};

    if (learningProgress && learningProgress.modulesProgress) {
      // Merge standard progress with page-based progress
      for (const [moduleId, standardProgress] of Object.entries(learningProgress.modulesProgress)) {
        const pageProgress = moduleProgressList.find(p => p.moduleId === moduleId);
        
        enhancedModulesProgress[moduleId] = {
          ...(standardProgress as any),
          // Add page-based progress data
          pageProgress: pageProgress ? {
            currentPage: pageProgress.currentPage,
            totalPages: pageProgress.totalPages,
            percentage: pageProgress.pageProgressPercentage,
            hasPageData: pageProgress.hasPageData
          } : null,
          // Override with correct progress if available
          correctProgress: pageProgress?.pageProgressPercentage || 0
        };
      }
    }

    const response = {
      ...(learningProgress || {
        userId,
        xp: 0,
        streak: 0,
        level: 1,
        dailyGoal: 40,
        dailyLimit: {
          date: new Date().toISOString().split('T')[0],
          lessonsCompleted: 0
        },
        streakReactivationsRemaining: 3
      }),
      modulesProgress: enhancedModulesProgress,
      // Add summary of page-based progress
      pageProgressSummary: {
        totalModules: moduleProgressList.length,
        modulesWithPageData: moduleProgressList.filter(p => p.hasPageData).length,
        averageProgress: moduleProgressList.length > 0
          ? Math.round(moduleProgressList.reduce((sum, p) => sum + p.pageProgressPercentage, 0) / moduleProgressList.length)
          : 0
      }
    };

    return res.json(response);

  } catch (error) {
    console.error('❌ Error fetching enhanced learning progress:', error);
    return res.status(500).json({ error: 'Failed to fetch learning progress' });
  }
});

/**
 * Get correct progress percentage for a single module
 * GET /api/learning/module-progress/:userId/:moduleId
 */
router.get('/learning/module-progress/:userId/:moduleId', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId } = req.params;

    if (!userId || !moduleId) {
      return res.status(400).json({ error: 'Missing userId or moduleId' });
    }

    const progressPercentage = await getCorrectProgressPercentage(userId, moduleId);

    return res.json({
      success: true,
      userId,
      moduleId,
      progress: progressPercentage,
      type: 'page-based'
    });

  } catch (error) {
    console.error('❌ Error fetching module progress:', error);
    return res.status(500).json({ error: 'Failed to fetch module progress' });
  }
});

export default router;

