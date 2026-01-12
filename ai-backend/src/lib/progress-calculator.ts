/**
 * Progress Calculator
 * Ensures ALL progress calculations are page-based, not lesson-based
 */

import { admin, getFirebaseAuth } from './firebase-admin';
import { getUserPageProgress, getDocumentPagesByModuleId } from './document-page-storage';

function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return admin.firestore();
}

export interface ModuleProgressData {
  moduleId: string;
  moduleName: string;
  
  // Page-based progress (PRIMARY)
  totalPages: number;
  currentPage: number;
  pageProgressPercentage: number;
  
  // Lesson-based data (SECONDARY - for info only)
  totalLessons: number;
  completedLessons: number;
  
  // Metadata
  hasPageData: boolean;
  lastUpdated: Date;
}

/**
 * Calculate CORRECT page-based progress for a module
 * This is the ONLY function that should calculate progress
 */
export async function calculateModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressData | null> {
  try {
    const db = getFirestore();
    if (!db) return null;

    // Get module details
    const moduleDoc = await db.collection('generatedModules').doc(moduleId).get();
    if (!moduleDoc.exists) return null;
    
    const moduleData = moduleDoc.data();
    const moduleName = moduleData?.title || 'Unknown Module';

    // Get page progress (PRIMARY SOURCE OF TRUTH)
    const pageProgress = await getUserPageProgress(userId, moduleId);
    const documentPages = await getDocumentPagesByModuleId(moduleId);

    let totalPages = 0;
    let currentPage = 0;
    let pageProgressPercentage = 0;
    let hasPageData = false;

    if (documentPages && pageProgress) {
      // We have page data - USE THIS
      totalPages = documentPages.totalPages;
      currentPage = pageProgress.lastPageCovered;
      pageProgressPercentage = totalPages > 0 
        ? Math.round((currentPage / totalPages) * 100)
        : 0;
      hasPageData = true;
      
      console.log(`✓ Page-based progress for ${moduleName}: ${currentPage}/${totalPages} (${pageProgressPercentage}%)`);
    } else {
      // No page data yet - need to infer or migrate
      console.log(`⚠️ No page data for ${moduleName} - will trigger migration`);
    }

    // Get lesson data (for display only, NOT for progress calculation)
    const moduleLessons = moduleData?.lessons || [];
    const userLessonsDoc = await db.collection('userLessons').doc(userId).get();
    const userGeneratedLessons = userLessonsDoc.exists
      ? (userLessonsDoc.data()?.modules?.[moduleId]?.lessons || [])
      : [];
    
    const totalLessons = moduleLessons.length + userGeneratedLessons.length;

    // Get completed lessons count
    const learningProgressDoc = await db.collection('learningProgress').doc(userId).get();
    const moduleProgress = learningProgressDoc.exists
      ? learningProgressDoc.data()?.modulesProgress?.[moduleId]
      : null;
    
    const completedLessons = moduleProgress?.completedLessons?.length || 0;

    return {
      moduleId,
      moduleName,
      totalPages,
      currentPage,
      pageProgressPercentage,
      totalLessons,
      completedLessons,
      hasPageData,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('❌ Error calculating module progress:', error);
    return null;
  }
}

/**
 * Calculate progress for all user's modules
 */
export async function calculateAllModulesProgress(
  userId: string
): Promise<ModuleProgressData[]> {
  try {
    const db = getFirestore();
    if (!db) return [];

    // Get all modules user has interacted with
    const learningProgressDoc = await db.collection('learningProgress').doc(userId).get();
    
    if (!learningProgressDoc.exists) {
      return [];
    }

    const learningData = learningProgressDoc.data();
    const modulesProgress = learningData?.modulesProgress || {};
    
    const progressList: ModuleProgressData[] = [];

    for (const moduleId of Object.keys(modulesProgress)) {
      const progress = await calculateModuleProgress(userId, moduleId);
      if (progress) {
        progressList.push(progress);
      }
    }

    return progressList;

  } catch (error) {
    console.error('❌ Error calculating all modules progress:', error);
    return [];
  }
}

/**
 * Detect and fix incorrect lesson-based progress
 * Migrates to page-based progress if needed
 */
export async function detectAndFixProgress(
  userId: string,
  moduleId: string
): Promise<{
  needsFix: boolean;
  fixed: boolean;
  oldProgress: number;
  newProgress: number;
  message: string;
}> {
  try {
    const db = getFirestore();
    if (!db) {
      return {
        needsFix: false,
        fixed: false,
        oldProgress: 0,
        newProgress: 0,
        message: 'Database not available'
      };
    }

    // Get current progress calculation
    const progress = await calculateModuleProgress(userId, moduleId);
    
    if (!progress) {
      return {
        needsFix: false,
        fixed: false,
        oldProgress: 0,
        newProgress: 0,
        message: 'Module not found'
      };
    }

    // Check if we have page data
    if (!progress.hasPageData) {
      // Need to migrate this module
      const { migrateModuleDocument, initializeUserPageProgress } = await import('./document-migration');
      
      console.log(`🔧 Fixing progress for module ${moduleId} - migrating to page-based`);
      
      // Migrate the module
      const migrationResult = await migrateModuleDocument(moduleId);
      
      if (migrationResult.success || migrationResult.message.includes('already exist')) {
        // Initialize user progress
        await initializeUserPageProgress(userId, moduleId);
        
        // Recalculate with page data
        const newProgress = await calculateModuleProgress(userId, moduleId);
        
        return {
          needsFix: true,
          fixed: true,
          oldProgress: progress.completedLessons > 0 && progress.totalLessons > 0
            ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
            : 0,
          newProgress: newProgress?.pageProgressPercentage || 0,
          message: `Migrated to page-based progress: ${newProgress?.pageProgressPercentage}%`
        };
      } else {
        return {
          needsFix: true,
          fixed: false,
          oldProgress: 0,
          newProgress: 0,
          message: `Migration failed: ${migrationResult.message}`
        };
      }
    }

    // Already using page-based progress
    return {
      needsFix: false,
      fixed: false,
      oldProgress: progress.pageProgressPercentage,
      newProgress: progress.pageProgressPercentage,
      message: `Already using page-based progress: ${progress.pageProgressPercentage}%`
    };

  } catch (error) {
    console.error('❌ Error detecting/fixing progress:', error);
    return {
      needsFix: false,
      fixed: false,
      oldProgress: 0,
      newProgress: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get the CORRECT progress percentage for display
 * Always returns page-based progress if available
 */
export async function getCorrectProgressPercentage(
  userId: string,
  moduleId: string
): Promise<number> {
  try {
    const progress = await calculateModuleProgress(userId, moduleId);
    
    if (!progress) return 0;
    
    // If we have page data, use it
    if (progress.hasPageData && progress.totalPages > 0) {
      return progress.pageProgressPercentage;
    }
    
    // Fallback to lesson-based (will trigger migration on next lesson request)
    if (progress.totalLessons > 0) {
      return Math.round((progress.completedLessons / progress.totalLessons) * 100);
    }
    
    return 0;

  } catch (error) {
    console.error('❌ Error getting correct progress:', error);
    return 0;
  }
}

/**
 * Batch fix progress for all user's modules
 */
export async function fixAllModulesProgress(
  userId: string
): Promise<{
  total: number;
  fixed: number;
  alreadyCorrect: number;
  failed: number;
  details: Array<{
    moduleId: string;
    moduleName: string;
    status: 'fixed' | 'already_correct' | 'failed';
    oldProgress: number;
    newProgress: number;
  }>;
}> {
  try {
    const progressList = await calculateAllModulesProgress(userId);
    
    const results = {
      total: progressList.length,
      fixed: 0,
      alreadyCorrect: 0,
      failed: 0,
      details: [] as Array<{
        moduleId: string;
        moduleName: string;
        status: 'fixed' | 'already_correct' | 'failed';
        oldProgress: number;
        newProgress: number;
      }>
    };

    for (const progress of progressList) {
      const fixResult = await detectAndFixProgress(userId, progress.moduleId);
      
      if (fixResult.fixed) {
        results.fixed++;
        results.details.push({
          moduleId: progress.moduleId,
          moduleName: progress.moduleName,
          status: 'fixed',
          oldProgress: fixResult.oldProgress,
          newProgress: fixResult.newProgress
        });
      } else if (!fixResult.needsFix) {
        results.alreadyCorrect++;
        results.details.push({
          moduleId: progress.moduleId,
          moduleName: progress.moduleName,
          status: 'already_correct',
          oldProgress: fixResult.oldProgress,
          newProgress: fixResult.newProgress
        });
      } else {
        results.failed++;
        results.details.push({
          moduleId: progress.moduleId,
          moduleName: progress.moduleName,
          status: 'failed',
          oldProgress: fixResult.oldProgress,
          newProgress: fixResult.newProgress
        });
      }
    }

    return results;

  } catch (error) {
    console.error('❌ Error fixing all modules progress:', error);
    return {
      total: 0,
      fixed: 0,
      alreadyCorrect: 0,
      failed: 0,
      details: []
    };
  }
}
