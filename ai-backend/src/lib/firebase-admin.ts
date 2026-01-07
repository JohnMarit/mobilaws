/**
 * Firebase Admin SDK initialization for backend operations
 * This allows us to fetch all Firebase Auth users server-side
 */

import * as admin from 'firebase-admin';
import { env } from '../env';

let firebaseAdmin: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variable
 */
export function initializeFirebaseAdmin(): admin.app.App | null {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Check if Firebase service account is configured
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not set. Cannot fetch Auth users.');
      console.warn('💡 Set FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON');
      return null;
    }

    // Parse service account JSON
    const serviceAccountJson = JSON.parse(serviceAccount);

    // Initialize Firebase Admin
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson),
      projectId: serviceAccountJson.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseAdmin;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

/**
 * Get Firebase Admin Auth instance
 */
export function getFirebaseAuth(): admin.auth.Auth | null {
  const app = initializeFirebaseAdmin();
  if (!app) return null;
  
  return admin.auth(app);
}

/**
 * Get Firestore instance safely
 */
export function getFirestore(): admin.firestore.Firestore | null {
  const app = initializeFirebaseAdmin();
  if (!app) {
    console.error('❌ Firebase Admin not initialized - cannot access Firestore');
    return null;
  }
  return admin.firestore(app);
}

/**
 * Fetch all users from Firebase Authentication
 * @param maxResults Maximum number of users to fetch (default: 1000)
 */
export async function getAllFirebaseAuthUsers(maxResults: number = 1000): Promise<admin.auth.UserRecord[]> {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    console.warn('⚠️ Firebase Admin not initialized. Cannot fetch users.');
    return [];
  }

  try {
    const users: admin.auth.UserRecord[] = [];
    let pageToken: string | undefined;

    do {
      const listUsersResult = await auth.listUsers(Math.min(maxResults - users.length, 1000), pageToken);
      users.push(...listUsersResult.users);
      pageToken = listUsersResult.pageToken;
    } while (pageToken && users.length < maxResults);

    console.log(`✅ Retrieved ${users.length} users from Firebase Auth`);
    return users;
  } catch (error) {
    console.error('❌ Error fetching Firebase Auth users:', error);
    return [];
  }
}

export { admin };

