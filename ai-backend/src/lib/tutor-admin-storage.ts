/**
 * Tutor Admin storage and management in Firestore
 * Handles tutor admin authentication, roles, and permissions
 */

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
  if (!db) return false;

  try {
    const snapshot = await db.collection(TUTOR_ADMINS_COLLECTION)
      .where('email', '==', email)
      .where('active', '==', true)
      .limit(1)
      .get();

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
    const snapshot = await db.collection(TUTOR_ADMINS_COLLECTION)
      .where('email', '==', email)
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
    // Check if already exists
    const existing = await getTutorAdmin(email);
    if (existing) {
      // Update existing
      await db.collection(TUTOR_ADMINS_COLLECTION).doc(existing.id).update({
        name,
        picture: picture || existing.picture,
        specializations: specializations || existing.specializations,
        bio: bio || existing.bio,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return getTutorAdminById(existing.id);
    }

    // Create new
    const now = admin.firestore.Timestamp.now();
    const tutorData: Omit<TutorAdmin, 'id'> = {
      email,
      name,
      picture,
      specializations: specializations || [],
      bio,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(TUTOR_ADMINS_COLLECTION).add(tutorData);
    console.log(`✅ Created tutor admin: ${email}`);

    return { id: docRef.id, ...tutorData };
  } catch (error) {
    console.error('❌ Error creating tutor admin:', error);
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
 * Get uploaded content by tutor
 */
export async function getContentByTutor(tutorId: string): Promise<UploadedContent[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(TUTOR_CONTENT_COLLECTION)
      .where('tutorId', '==', tutorId)
      .orderBy('uploadedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UploadedContent[];
  } catch (error) {
    console.error('❌ Error fetching tutor content:', error);
    return [];
  }
}

/**
 * Get all uploaded content
 */
export async function getAllUploadedContent(): Promise<UploadedContent[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(TUTOR_CONTENT_COLLECTION)
      .orderBy('uploadedAt', 'desc')
      .limit(100)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UploadedContent[];
  } catch (error) {
    console.error('❌ Error fetching all content:', error);
    return [];
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

