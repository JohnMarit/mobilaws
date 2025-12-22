import { Router, Request, Response } from 'express';
import { getLearningProgress, saveLearningProgress } from '../lib/learning-storage';

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
        }
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
 * Body: { userId, xp, level, streak, modulesProgress, dailyGoal, dailyLimit, lastActiveDate? }
 */
router.post('/learning/progress', async (req: Request, res: Response) => {
  try {
    const { userId, xp, level, streak, modulesProgress, dailyGoal, dailyLimit, lastActiveDate } = req.body;

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
      }
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

export default router;

