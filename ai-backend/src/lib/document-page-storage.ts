/**
 * Document Page Storage
 * Manages page-by-page storage of uploaded documents for sequential lesson generation
 */

import { admin, getFirebaseAuth } from './firebase-admin';

export interface DocumentPage {
  pageNumber: number;
  content: string;
  totalPages: number;
}

export interface StoredDocument {
  id?: string;
  moduleId: string;
  contentId: string;
  tutorId: string;
  title: string;
  totalPages: number;
  pages: DocumentPage[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface UserPageProgress {
  id?: string;
  userId: string;
  moduleId: string;
  contentId: string;
  lastPageCovered: number; // Last page number used for lesson generation
  totalPagesInDocument: number;
  lessonsGenerated: number; // Number of lesson sets generated
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return admin.firestore();
}

/**
 * Save document pages to Firestore
 */
export async function saveDocumentPages(document: Omit<StoredDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const db = getFirestore();
    if (!db) {
      console.error('❌ Firestore not available');
      return null;
    }

    const docRef = db.collection('documentPages').doc();
    const now = admin.firestore.Timestamp.now();

    await docRef.set({
      ...document,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Saved ${document.totalPages} pages for document: ${document.title}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving document pages:', error);
    return null;
  }
}

/**
 * Get document pages by module ID
 */
export async function getDocumentPagesByModuleId(moduleId: string): Promise<StoredDocument | null> {
  try {
    const db = getFirestore();
    if (!db) return null;

    const snapshot = await db.collection('documentPages')
      .where('moduleId', '==', moduleId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn(`⚠️ No document pages found for module: ${moduleId}`);
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as StoredDocument;
  } catch (error) {
    console.error('❌ Error fetching document pages:', error);
    return null;
  }
}

/**
 * Get document pages by content ID
 */
export async function getDocumentPagesByContentId(contentId: string): Promise<StoredDocument | null> {
  try {
    const db = getFirestore();
    if (!db) return null;

    const snapshot = await db.collection('documentPages')
      .where('contentId', '==', contentId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn(`⚠️ No document pages found for content: ${contentId}`);
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as StoredDocument;
  } catch (error) {
    console.error('❌ Error fetching document pages:', error);
    return null;
  }
}

/**
 * Get or create user page progress
 */
export async function getUserPageProgress(userId: string, moduleId: string): Promise<UserPageProgress | null> {
  try {
    const db = getFirestore();
    if (!db) return null;

    const progressId = `${userId}_${moduleId}`;
    const docRef = db.collection('userPageProgress').doc(progressId);
    const doc = await docRef.get();

    if (doc.exists) {
      return {
        id: doc.id,
        ...doc.data(),
      } as UserPageProgress;
    }

    // Get document to find total pages
    const documentPages = await getDocumentPagesByModuleId(moduleId);
    if (!documentPages) {
      console.warn(`⚠️ No document found for module: ${moduleId}`);
      return null;
    }

    // Create new progress tracker starting at page 0
    const now = admin.firestore.Timestamp.now();
    const newProgress: Omit<UserPageProgress, 'id'> = {
      userId,
      moduleId,
      contentId: documentPages.contentId,
      lastPageCovered: 0,
      totalPagesInDocument: documentPages.totalPages,
      lessonsGenerated: 0,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newProgress);
    
    console.log(`✅ Created page progress tracker for user ${userId}, module ${moduleId}`);
    return {
      id: progressId,
      ...newProgress,
    };
  } catch (error) {
    console.error('❌ Error getting user page progress:', error);
    return null;
  }
}

/**
 * Update user page progress
 */
export async function updateUserPageProgress(
  userId: string,
  moduleId: string,
  lastPageCovered: number,
  incrementLessonsGenerated: boolean = true
): Promise<boolean> {
  try {
    const db = getFirestore();
    if (!db) return false;

    const progressId = `${userId}_${moduleId}`;
    const docRef = db.collection('userPageProgress').doc(progressId);

    const updateData: any = {
      lastPageCovered,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (incrementLessonsGenerated) {
      updateData.lessonsGenerated = admin.firestore.FieldValue.increment(1);
    }

    await docRef.set(updateData, { merge: true });

    console.log(`✅ Updated page progress: user ${userId}, module ${moduleId}, page ${lastPageCovered}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating user page progress:', error);
    return false;
  }
}

/**
 * Get next pages for lesson generation
 * Returns sequential pages starting from where the user left off
 */
export async function getNextPagesForLessons(
  userId: string,
  moduleId: string,
  numberOfPages: number = 5
): Promise<{ pages: DocumentPage[]; progressUpdate: { startPage: number; endPage: number } } | null> {
  try {
    // Get user's current progress
    const progress = await getUserPageProgress(userId, moduleId);
    if (!progress) {
      console.error('❌ Could not get user progress');
      return null;
    }

    // Get document pages
    const document = await getDocumentPagesByModuleId(moduleId);
    if (!document) {
      console.error('❌ Could not get document pages');
      return null;
    }

    // Calculate which pages to return
    const startPage = progress.lastPageCovered + 1;
    const endPage = Math.min(startPage + numberOfPages - 1, document.totalPages);

    // Handle case where user has completed all pages
    if (startPage > document.totalPages) {
      console.log(`⚠️ User ${userId} has completed all pages in module ${moduleId}`);
      // Return last pages to allow review
      const reviewStartPage = Math.max(1, document.totalPages - numberOfPages + 1);
      const reviewPages = document.pages.filter(
        p => p.pageNumber >= reviewStartPage && p.pageNumber <= document.totalPages
      );
      return {
        pages: reviewPages,
        progressUpdate: { startPage: reviewStartPage, endPage: document.totalPages }
      };
    }

    // Get the requested pages
    const requestedPages = document.pages.filter(
      p => p.pageNumber >= startPage && p.pageNumber <= endPage
    );

    // Sort by page number to ensure correct order
    requestedPages.sort((a, b) => a.pageNumber - b.pageNumber);

    console.log(`📖 Retrieved pages ${startPage}-${endPage} for user ${userId}, module ${moduleId}`);

    return {
      pages: requestedPages,
      progressUpdate: { startPage, endPage }
    };
  } catch (error) {
    console.error('❌ Error getting next pages:', error);
    return null;
  }
}

/**
 * Get progress percentage for a user's journey through a document
 */
export async function getDocumentProgressPercentage(userId: string, moduleId: string): Promise<number> {
  try {
    const progress = await getUserPageProgress(userId, moduleId);
    if (!progress || progress.totalPagesInDocument === 0) {
      return 0;
    }

    return Math.min(100, Math.round((progress.lastPageCovered / progress.totalPagesInDocument) * 100));
  } catch (error) {
    console.error('❌ Error calculating progress percentage:', error);
    return 0;
  }
}
