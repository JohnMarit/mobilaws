import { Router, Request, Response } from 'express';
import {
  migrateModuleDocument,
  migrateAllOldModules,
  inferUserProgressFromLessons,
  initializeUserPageProgress,
  getUserComprehensiveProgress
} from '../lib/document-migration';
import { getDocumentProgressPercentage } from '../lib/document-page-storage';

const router = Router();

/**
 * Migrate a single module - extract and save pages from source document
 * POST /api/migration/module/:moduleId
 */
router.post('/migration/module/:moduleId', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    if (!moduleId) {
      return res.status(400).json({ error: 'Module ID is required' });
    }

    console.log(`🔄 Starting migration for module: ${moduleId}`);

    const result = await migrateModuleDocument(moduleId);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        totalPages: result.totalPages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('❌ Error in module migration:', error);
    return res.status(500).json({
      error: 'Migration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Batch migrate all old modules
 * POST /api/migration/batch
 * Body: { limit?: number }
 */
router.post('/migration/batch', async (req: Request, res: Response) => {
  try {
    const { limit } = req.body;
    const migrationLimit = limit || 50;

    console.log(`🔄 Starting batch migration (limit: ${migrationLimit})`);

    const result = await migrateAllOldModules(migrationLimit);

    return res.json({
      success: true,
      summary: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        skipped: result.skipped
      },
      details: result.results
    });

  } catch (error) {
    console.error('❌ Error in batch migration:', error);
    return res.status(500).json({
      error: 'Batch migration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Infer user progress from completed lessons
 * POST /api/migration/infer-progress
 * Body: { userId: string, moduleId: string }
 */
router.post('/migration/infer-progress', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId } = req.body;

    if (!userId || !moduleId) {
      return res.status(400).json({ error: 'userId and moduleId are required' });
    }

    const result = await inferUserProgressFromLessons(userId, moduleId);

    return res.json({
      success: result.success,
      estimatedPage: result.estimatedPage,
      totalPages: result.totalPages,
      progressPercentage: result.totalPages > 0 
        ? Math.round((result.estimatedPage / result.totalPages) * 100)
        : 0,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Error inferring progress:', error);
    return res.status(500).json({
      error: 'Failed to infer progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Initialize user page progress based on completed lessons
 * POST /api/migration/initialize-progress
 * Body: { userId: string, moduleId: string }
 */
router.post('/migration/initialize-progress', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId } = req.body;

    if (!userId || !moduleId) {
      return res.status(400).json({ error: 'userId and moduleId are required' });
    }

    // First, ensure the module has pages
    const migrationResult = await migrateModuleDocument(moduleId);
    
    if (!migrationResult.success && !migrationResult.message.includes('already exist')) {
      return res.status(500).json({
        success: false,
        error: 'Could not migrate module',
        message: migrationResult.message
      });
    }

    // Then initialize user progress
    const success = await initializeUserPageProgress(userId, moduleId);

    if (success) {
      // Get the progress percentage
      const progressPercentage = await getDocumentProgressPercentage(userId, moduleId);

      return res.json({
        success: true,
        message: 'User progress initialized successfully',
        progressPercentage
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize user progress'
      });
    }

  } catch (error) {
    console.error('❌ Error initializing progress:', error);
    return res.status(500).json({
      error: 'Failed to initialize progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get comprehensive progress for a user across all modules
 * GET /api/migration/user-progress/:userId
 */
router.get('/migration/user-progress/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const progressList = await getUserComprehensiveProgress(userId);

    return res.json({
      success: true,
      userId,
      modules: progressList,
      totalModules: progressList.length
    });

  } catch (error) {
    console.error('❌ Error getting user progress:', error);
    return res.status(500).json({
      error: 'Failed to get user progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Refresh progress for all user's modules
 * POST /api/migration/refresh-user-progress
 * Body: { userId: string }
 */
router.post('/migration/refresh-user-progress', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🔄 Refreshing progress for user: ${userId}`);

    // Get all modules user has interacted with
    const progressList = await getUserComprehensiveProgress(userId);

    const results = [];
    
    for (const moduleProgress of progressList) {
      // Initialize progress for each module
      const success = await initializeUserPageProgress(userId, moduleProgress.moduleId);
      
      results.push({
        moduleId: moduleProgress.moduleId,
        moduleName: moduleProgress.moduleName,
        success,
        progressPercentage: moduleProgress.progressPercentage
      });
    }

    return res.json({
      success: true,
      message: `Refreshed progress for ${results.length} modules`,
      modules: results
    });

  } catch (error) {
    console.error('❌ Error refreshing user progress:', error);
    return res.status(500).json({
      error: 'Failed to refresh user progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
