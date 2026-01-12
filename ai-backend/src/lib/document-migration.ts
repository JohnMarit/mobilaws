/**
 * Document Migration & Progress Inference
 * Handles retroactive processing of old documents and progress calculation
 */

import { admin, getFirebaseAuth } from './firebase-admin';
import { saveDocumentPages, getUserPageProgress, updateUserPageProgress, DocumentPage } from './document-page-storage';
import fs from 'fs';
import path from 'path';

function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return admin.firestore();
}

/**
 * Extract pages from a document file (same logic as ai-content-generator.ts)
 */
async function extractDocumentPages(filePath: string): Promise<DocumentPage[]> {
  const ext = path.extname(filePath).toLowerCase();
  const pages: DocumentPage[] = [];
  
  if (ext === '.txt') {
    const content = fs.readFileSync(filePath, 'utf-8');
    let splits = content.split('\f');
    
    if (splits.length === 1) {
      const CHARS_PER_PAGE = 2000;
      splits = [];
      for (let i = 0; i < content.length; i += CHARS_PER_PAGE) {
        splits.push(content.slice(i, i + CHARS_PER_PAGE));
      }
    }
    
    splits.forEach((pageContent, index) => {
      if (pageContent.trim()) {
        pages.push({
          pageNumber: index + 1,
          content: pageContent.trim(),
          totalPages: splits.length
        });
      }
    });
    
    return pages;
  }
  
  if (ext === '.pdf') {
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse.default(dataBuffer);
    
    if (data.numpages && data.numpages > 1) {
      const avgCharsPerPage = Math.ceil(data.text.length / data.numpages);
      
      for (let i = 0; i < data.numpages; i++) {
        const start = i * avgCharsPerPage;
        const end = (i + 1) * avgCharsPerPage;
        const pageContent = data.text.slice(start, end).trim();
        
        if (pageContent) {
          pages.push({
            pageNumber: i + 1,
            content: pageContent,
            totalPages: data.numpages
          });
        }
      }
    } else {
      pages.push({
        pageNumber: 1,
        content: data.text.trim(),
        totalPages: 1
      });
    }
    
    return pages;
  }
  
  if (ext === '.docx' || ext === '.doc') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    const content = result.value;
    
    let splits = content.split(/\f|\x0C/);
    
    if (splits.length === 1) {
      const CHARS_PER_PAGE = 2000;
      splits = [];
      for (let i = 0; i < content.length; i += CHARS_PER_PAGE) {
        splits.push(content.slice(i, i + CHARS_PER_PAGE));
      }
    }
    
    splits.forEach((pageContent, index) => {
      if (pageContent.trim()) {
        pages.push({
          pageNumber: index + 1,
          content: pageContent.trim(),
          totalPages: splits.length
        });
      }
    });
    
    return pages;
  }
  
  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Migrate a single module - extract and save pages from its source document
 */
export async function migrateModuleDocument(moduleId: string): Promise<{
  success: boolean;
  message: string;
  totalPages?: number;
}> {
  try {
    const db = getFirestore();
    if (!db) {
      return { success: false, message: 'Database not available' };
    }

    // Get the module
    const moduleDoc = await db.collection('generatedModules').doc(moduleId).get();
    if (!moduleDoc.exists) {
      return { success: false, message: 'Module not found' };
    }

    const moduleData = moduleDoc.data();
    if (!moduleData) {
      return { success: false, message: 'Module data is empty' };
    }

    // Check if pages already exist
    const existingPages = await db.collection('documentPages')
      .where('moduleId', '==', moduleId)
      .limit(1)
      .get();

    if (!existingPages.empty) {
      return { 
        success: true, 
        message: 'Pages already exist for this module',
        totalPages: existingPages.docs[0].data().totalPages
      };
    }

    // Get the source content to find file path
    const sourceContentId = moduleData.sourceContentId;
    if (!sourceContentId) {
      return { success: false, message: 'No source content ID found' };
    }

    const contentDoc = await db.collection('tutorContent').doc(sourceContentId).get();
    if (!contentDoc.exists) {
      return { success: false, message: 'Source content not found' };
    }

    const contentData = contentDoc.data();
    const filePath = contentData?.filePath;

    if (!filePath || !fs.existsSync(filePath)) {
      return { 
        success: false, 
        message: 'Source file not found or no longer exists. Cannot migrate this module.' 
      };
    }

    // Extract pages from the document
    console.log(`📄 Extracting pages from: ${filePath}`);
    const pages = await extractDocumentPages(filePath);

    if (pages.length === 0) {
      return { success: false, message: 'No pages could be extracted from document' };
    }

    // Save pages to documentPages collection
    const pageStorageId = await saveDocumentPages({
      moduleId,
      contentId: sourceContentId,
      tutorId: moduleData.tutorId || 'unknown',
      title: moduleData.title || 'Untitled',
      totalPages: pages.length,
      pages,
    });

    if (!pageStorageId) {
      return { success: false, message: 'Failed to save document pages' };
    }

    console.log(`✅ Migrated module ${moduleId}: ${pages.length} pages extracted`);

    return {
      success: true,
      message: `Successfully migrated: ${pages.length} pages extracted`,
      totalPages: pages.length
    };

  } catch (error) {
    console.error(`❌ Error migrating module ${moduleId}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Infer user's progress based on completed lessons
 * Estimates which page they've reached based on lesson count and content
 */
export async function inferUserProgressFromLessons(
  userId: string,
  moduleId: string
): Promise<{
  success: boolean;
  estimatedPage: number;
  totalPages: number;
  message: string;
}> {
  try {
    const db = getFirestore();
    if (!db) {
      return { 
        success: false, 
        estimatedPage: 0, 
        totalPages: 0, 
        message: 'Database not available' 
      };
    }

    // Get document pages
    const pagesSnapshot = await db.collection('documentPages')
      .where('moduleId', '==', moduleId)
      .limit(1)
      .get();

    if (pagesSnapshot.empty) {
      return {
        success: false,
        estimatedPage: 0,
        totalPages: 0,
        message: 'No document pages found for this module'
      };
    }

    const documentData = pagesSnapshot.docs[0].data();
    const totalPages = documentData.totalPages || 0;

    // Get user's learning progress
    const learningProgressDoc = await db.collection('learningProgress').doc(userId).get();
    
    if (!learningProgressDoc.exists) {
      return {
        success: true,
        estimatedPage: 0,
        totalPages,
        message: 'No learning progress found - starting from beginning'
      };
    }

    const learningData = learningProgressDoc.data();
    const moduleProgress = learningData?.modulesProgress?.[moduleId];

    if (!moduleProgress) {
      return {
        success: true,
        estimatedPage: 0,
        totalPages,
        message: 'No progress for this module - starting from beginning'
      };
    }

    // Get module to see total lessons
    const moduleDoc = await db.collection('generatedModules').doc(moduleId).get();
    const moduleData = moduleDoc.data();
    const moduleLessons = moduleData?.lessons || [];

    // Get user-generated lessons
    const userLessonsDoc = await db.collection('userLessons').doc(userId).get();
    const userGeneratedLessons = userLessonsDoc.exists
      ? (userLessonsDoc.data()?.modules?.[moduleId]?.lessons || [])
      : [];

    const totalAvailableLessons = moduleLessons.length + userGeneratedLessons.length;
    const completedLessons = moduleProgress.completedLessons?.length || 0;

    // Estimate page based on completion ratio
    // If user has completed X% of lessons, assume they've covered X% of pages
    if (totalAvailableLessons === 0) {
      return {
        success: true,
        estimatedPage: 0,
        totalPages,
        message: 'No lessons available yet'
      };
    }

    const completionRatio = completedLessons / totalAvailableLessons;
    const estimatedPage = Math.floor(completionRatio * totalPages);

    console.log(`📊 Inferred progress for user ${userId}, module ${moduleId}:`);
    console.log(`   - Completed ${completedLessons}/${totalAvailableLessons} lessons`);
    console.log(`   - Estimated page: ${estimatedPage}/${totalPages}`);
    console.log(`   - Completion: ${Math.round(completionRatio * 100)}%`);

    return {
      success: true,
      estimatedPage,
      totalPages,
      message: `Estimated progress: page ${estimatedPage} of ${totalPages} (${Math.round(completionRatio * 100)}%)`
    };

  } catch (error) {
    console.error(`❌ Error inferring progress:`, error);
    return {
      success: false,
      estimatedPage: 0,
      totalPages: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Initialize or update user page progress based on completed lessons
 */
export async function initializeUserPageProgress(
  userId: string,
  moduleId: string
): Promise<boolean> {
  try {
    // Check if progress already exists
    const existingProgress = await getUserPageProgress(userId, moduleId);
    
    // If progress exists and is > 0, don't overwrite
    if (existingProgress && existingProgress.lastPageCovered > 0) {
      console.log(`✓ Progress already exists for user ${userId}, module ${moduleId}`);
      return true;
    }

    // Infer progress from completed lessons
    const inferredProgress = await inferUserProgressFromLessons(userId, moduleId);
    
    if (!inferredProgress.success) {
      console.warn(`⚠️ Could not infer progress: ${inferredProgress.message}`);
      return false;
    }

    // Update user page progress with inferred value
    const success = await updateUserPageProgress(
      userId,
      moduleId,
      inferredProgress.estimatedPage,
      false // Don't increment lessons count, just set initial position
    );

    if (success) {
      console.log(`✅ Initialized progress for user ${userId}, module ${moduleId} at page ${inferredProgress.estimatedPage}`);
    }

    return success;

  } catch (error) {
    console.error(`❌ Error initializing user progress:`, error);
    return false;
  }
}

/**
 * Batch migrate all modules that don't have pages yet
 */
export async function migrateAllOldModules(limit: number = 50): Promise<{
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{ moduleId: string; status: string; message: string }>;
}> {
  const db = getFirestore();
  if (!db) {
    return { total: 0, successful: 0, failed: 0, skipped: 0, results: [] };
  }

  const results: Array<{ moduleId: string; status: string; message: string }> = [];
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Get all published modules
    const modulesSnapshot = await db.collection('generatedModules')
      .where('published', '==', true)
      .limit(limit)
      .get();

    console.log(`📦 Found ${modulesSnapshot.size} published modules to check`);

    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleId = moduleDoc.id;
      const moduleData = moduleDoc.data();

      // Check if pages already exist
      const pagesSnapshot = await db.collection('documentPages')
        .where('moduleId', '==', moduleId)
        .limit(1)
        .get();

      if (!pagesSnapshot.empty) {
        skipped++;
        results.push({
          moduleId,
          status: 'skipped',
          message: 'Pages already exist'
        });
        continue;
      }

      // Attempt migration
      const result = await migrateModuleDocument(moduleId);

      if (result.success) {
        successful++;
        results.push({
          moduleId,
          status: 'success',
          message: result.message
        });
      } else {
        failed++;
        results.push({
          moduleId,
          status: 'failed',
          message: result.message
        });
      }

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total: ${modulesSnapshot.size}`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);

    return {
      total: modulesSnapshot.size,
      successful,
      failed,
      skipped,
      results
    };

  } catch (error) {
    console.error('❌ Error in batch migration:', error);
    return {
      total: results.length,
      successful,
      failed,
      skipped,
      results
    };
  }
}

/**
 * Get comprehensive progress for a user across all modules
 */
export async function getUserComprehensiveProgress(userId: string): Promise<Array<{
  moduleId: string;
  moduleName: string;
  totalPages: number;
  currentPage: number;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
}>> {
  const db = getFirestore();
  if (!db) return [];

  try {
    // Get user's learning progress
    const learningProgressDoc = await db.collection('learningProgress').doc(userId).get();
    
    if (!learningProgressDoc.exists) {
      return [];
    }

    const learningData = learningProgressDoc.data();
    const modulesProgress = learningData?.modulesProgress || {};

    const progressList = [];

    for (const [moduleId, progress] of Object.entries(modulesProgress)) {
      const moduleProgress = progress as any;
      
      // Get module details
      const moduleDoc = await db.collection('generatedModules').doc(moduleId).get();
      if (!moduleDoc.exists) continue;
      
      const moduleData = moduleDoc.data();
      
      // Get page progress
      const pageProgress = await getUserPageProgress(userId, moduleId);
      
      // Get document pages for total
      const pagesSnapshot = await db.collection('documentPages')
        .where('moduleId', '==', moduleId)
        .limit(1)
        .get();

      const totalPages = pagesSnapshot.empty 
        ? 0 
        : pagesSnapshot.docs[0].data().totalPages || 0;

      const currentPage = pageProgress?.lastPageCovered || 0;
      const progressPercentage = totalPages > 0 
        ? Math.round((currentPage / totalPages) * 100)
        : 0;

      // Get lesson counts
      const moduleLessons = moduleData?.lessons || [];
      const userLessonsDoc = await db.collection('userLessons').doc(userId).get();
      const userGeneratedLessons = userLessonsDoc.exists
        ? (userLessonsDoc.data()?.modules?.[moduleId]?.lessons || [])
        : [];

      const totalLessons = moduleLessons.length + userGeneratedLessons.length;
      const completedLessons = moduleProgress.completedLessons?.length || 0;

      progressList.push({
        moduleId,
        moduleName: moduleData?.title || 'Unknown Module',
        totalPages,
        currentPage,
        progressPercentage,
        completedLessons,
        totalLessons
      });
    }

    return progressList;

  } catch (error) {
    console.error('❌ Error getting comprehensive progress:', error);
    return [];
  }
}
