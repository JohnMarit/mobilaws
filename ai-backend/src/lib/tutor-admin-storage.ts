/**
 * Tutor Admin storage and management in Firestore
 * Handles tutor admin authentication, roles, and permissions
 */

import fs from 'fs';
import { getFirebaseAuth, admin } from './firebase-admin';

const TUTOR_ADMINS_COLLECTION = 'tutorAdmins';
const TUTOR_CONTENT_COLLECTION = 'tutorContent';

export interface TutorAdmin {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  active: boolean;
  specializations?: string[]; // Areas of expertise
  bio?: string;
}

export interface UploadedContent {
  id: string;
  tutorId: string;
  tutorName: string;
  title: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[]; // Which tiers can access
  category: string; // e.g., "constitutional-law", "international-law"
  status: 'processing' | 'ready' | 'failed';
  uploadedAt: admin.firestore.Timestamp;
  processedAt?: admin.firestore.Timestamp;
  generatedModuleId?: string; // Reference to generated learning module
  published?: boolean; // Whether the module has been published to users
  deletedAt?: admin.firestore.Timestamp; // Timestamp when moved to trash (soft delete)
}

function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return admin.firestore();
}

/**
 * Check if user is a tutor admin
 */
export async function isTutorAdmin(email: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized');
    return false;
  }

  try {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('🔍 Checking tutor admin in Firestore...');
    console.log('📧 Original email:', email);
    console.log('📧 Normalized email:', normalizedEmail);
    console.log('📁 Collection:', TUTOR_ADMINS_COLLECTION);
    
    const snapshot = await db.collection(TUTOR_ADMINS_COLLECTION)
      .where('email', '==', normalizedEmail)
      .where('active', '==', true)
      .limit(1)
      .get();

    console.log('📊 Query result: Found', snapshot.size, 'document(s)');
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      console.log('✅ Found tutor admin:', doc.data().email);
    } else {
      console.log('❌ No tutor admin found');
    }

    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error checking tutor admin status:', error);
    return false;
  }
}

/**
 * Get tutor admin by email
 */
export async function getTutorAdmin(email: string): Promise<TutorAdmin | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase().trim();
    
    const snapshot = await db.collection(TUTOR_ADMINS_COLLECTION)
      .where('email', '==', normalizedEmail)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TutorAdmin;
  } catch (error) {
    console.error('❌ Error fetching tutor admin:', error);
    return null;
  }
}

/**
 * Get tutor admin by ID
 */
export async function getTutorAdminById(tutorId: string): Promise<TutorAdmin | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    const doc = await db.collection(TUTOR_ADMINS_COLLECTION).doc(tutorId).get();
    if (!doc.exists) return null;

    return { id: doc.id, ...doc.data() } as TutorAdmin;
  } catch (error) {
    console.error('❌ Error fetching tutor admin by ID:', error);
    return null;
  }
}

/**
 * Create or update tutor admin
 */
export async function createTutorAdmin(
  email: string,
  name: string,
  picture?: string,
  specializations?: string[],
  bio?: string
): Promise<TutorAdmin | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('═══════════════════════════════════════════════');
    console.log('📝 CREATING/UPDATING TUTOR ADMIN');
    console.log('═══════════════════════════════════════════════');
    console.log('📧 Original email:', email);
    console.log('📧 Normalized email:', normalizedEmail);
    console.log('👤 Name:', name);
    
    // Check if already exists
    const existing = await getTutorAdmin(normalizedEmail);
    if (existing) {
      console.log('ℹ️  Tutor admin already exists, updating...');
      // Update existing
      await db.collection(TUTOR_ADMINS_COLLECTION).doc(existing.id).update({
        name,
        picture: picture || existing.picture,
        specializations: specializations || existing.specializations,
        bio: bio || existing.bio,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      console.log(`✅ Updated existing tutor admin: ${normalizedEmail}`);
      console.log('═══════════════════════════════════════════════');
      return getTutorAdminById(existing.id);
    }

    // Create new
    const now = admin.firestore.Timestamp.now();
    const tutorData: Omit<TutorAdmin, 'id'> = {
      email: normalizedEmail,
      name,
      picture,
      specializations: specializations || [],
      bio,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(TUTOR_ADMINS_COLLECTION).add(tutorData);
    console.log(`✅ Created new tutor admin: ${normalizedEmail}`);
    console.log('🆔 Document ID:', docRef.id);
    console.log('✓  Active: true');
    console.log('═══════════════════════════════════════════════');

    return { id: docRef.id, ...tutorData };
  } catch (error) {
    console.error('═══════════════════════════════════════════════');
    console.error('❌ ❌ ❌ ERROR CREATING TUTOR ADMIN! ❌ ❌ ❌');
    console.error('💥 Error:', error);
    console.error('📧 Email:', email);
    console.error('═══════════════════════════════════════════════');
    return null;
  }
}

/**
 * Get all tutor admins
 */
export async function getAllTutorAdmins(): Promise<TutorAdmin[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(TUTOR_ADMINS_COLLECTION)
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TutorAdmin[];
  } catch (error) {
    console.error('❌ Error fetching tutor admins:', error);
    return [];
  }
}

/**
 * Save uploaded content metadata
 */
export async function saveUploadedContent(content: Omit<UploadedContent, 'id' | 'uploadedAt'>): Promise<string | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    const docRef = await db.collection(TUTOR_CONTENT_COLLECTION).add({
      ...content,
      uploadedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Saved uploaded content: ${content.title}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving uploaded content:', error);
    return null;
  }
}

/**
 * Update content status
 */
export async function updateContentStatus(
  contentId: string,
  status: 'processing' | 'ready' | 'failed',
  generatedModuleId?: string
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const updates: any = {
      status,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (status === 'ready' && generatedModuleId) {
      updates.processedAt = admin.firestore.Timestamp.now();
      updates.generatedModuleId = generatedModuleId;
    }

    await db.collection(TUTOR_CONTENT_COLLECTION).doc(contentId).update(updates);
    console.log(`✅ Updated content status: ${contentId} -> ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating content status:', error);
    return false;
  }
}

/**
 * Get uploaded content by tutor (excludes deleted items)
 */
export async function getContentByTutor(tutorId: string): Promise<UploadedContent[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(TUTOR_CONTENT_COLLECTION)
      .where('tutorId', '==', tutorId)
      .orderBy('uploadedAt', 'desc')
      .get();

    // Filter out deleted items (items with deletedAt field)
    return snapshot.docs
      .filter(doc => !doc.data().deletedAt)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UploadedContent[];
  } catch (error) {
    console.error('❌ Error fetching tutor content:', error);
    return [];
  }
}

/**
 * Get deleted content by tutor (trash bin)
 */
export async function getDeletedContentByTutor(tutorId: string): Promise<UploadedContent[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(TUTOR_CONTENT_COLLECTION)
      .where('tutorId', '==', tutorId)
      .get();

    // Filter to only include deleted items and sort by deletedAt
    const deletedItems = snapshot.docs
      .filter(doc => doc.data().deletedAt)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UploadedContent[];

    // Sort by deletedAt timestamp (most recent first)
    deletedItems.sort((a, b) => {
      if (!a.deletedAt) return 1;
      if (!b.deletedAt) return -1;
      const aTime = a.deletedAt.toMillis ? a.deletedAt.toMillis() : a.deletedAt;
      const bTime = b.deletedAt.toMillis ? b.deletedAt.toMillis() : b.deletedAt;
      return bTime - aTime;
    });

    return deletedItems;
  } catch (error) {
    console.error('❌ Error fetching deleted tutor content:', error);
    return [];
  }
}

/**
 * Get all uploaded content (excludes deleted items)
 */
export async function getAllUploadedContent(): Promise<UploadedContent[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(TUTOR_CONTENT_COLLECTION)
      .orderBy('uploadedAt', 'desc')
      .limit(100)
      .get();

    // Filter out deleted items (items with deletedAt field)
    return snapshot.docs
      .filter(doc => !doc.data().deletedAt)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UploadedContent[];
  } catch (error) {
    console.error('❌ Error fetching all content:', error);
    return [];
  }
}

/**
 * Soft delete uploaded content (move to trash)
 */
export async function deleteUploadedContent(contentId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const docRef = db.collection(TUTOR_CONTENT_COLLECTION).doc(contentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.error(`❌ Content not found: ${contentId}`);
      return false;
    }

    // Soft delete: set deletedAt timestamp instead of deleting
    await docRef.update({
      deletedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Moved content to trash: ${contentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error soft deleting content:', error);
    return false;
  }
}

/**
 * Permanently delete uploaded content and associated files
 */
export async function permanentlyDeleteUploadedContent(contentId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const docRef = db.collection(TUTOR_CONTENT_COLLECTION).doc(contentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.error(`❌ Content not found: ${contentId}`);
      return false;
    }

    const content = doc.data() as UploadedContent;

    // Delete the file from storage if it exists
    if (content.filePath && fs.existsSync(content.filePath)) {
      try {
        fs.unlinkSync(content.filePath);
        console.log(`✅ Deleted file: ${content.filePath}`);
      } catch (fileError) {
        console.warn(`⚠️ Failed to delete file: ${content.filePath}`, fileError);
        // Continue with deletion even if file deletion fails
      }
    }

    // Permanently delete the document from Firestore
    await docRef.delete();
    console.log(`✅ Permanently deleted content: ${contentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error permanently deleting content:', error);
    return false;
  }
}

/**
 * Restore content from trash
 */
export async function restoreUploadedContent(contentId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const docRef = db.collection(TUTOR_CONTENT_COLLECTION).doc(contentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.error(`❌ Content not found: ${contentId}`);
      return false;
    }

    // Remove deletedAt field to restore
    await docRef.update({
      deletedAt: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Restored content from trash: ${contentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error restoring content:', error);
    return false;
  }
}

/**
 * Update uploaded content metadata
 */
export async function updateUploadedContent(
  contentId: string,
  updates: {
    title?: string;
    description?: string;
    category?: string;
    accessLevels?: ('free' | 'basic' | 'standard' | 'premium')[];
  }
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const docRef = db.collection(TUTOR_CONTENT_COLLECTION).doc(contentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.error(`❌ Content not found: ${contentId}`);
      return false;
    }

    await docRef.update({
      ...updates,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Updated content: ${contentId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating content:', error);
    return false;
  }
}

/**
 * Get uploaded content by ID
 */
export async function getUploadedContentById(contentId: string): Promise<UploadedContent | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    const doc = await db.collection(TUTOR_CONTENT_COLLECTION).doc(contentId).get();
    if (!doc.exists) return null;

    return { id: doc.id, ...doc.data() } as UploadedContent;
  } catch (error) {
    console.error('❌ Error fetching content by ID:', error);
    return null;
  }
}

