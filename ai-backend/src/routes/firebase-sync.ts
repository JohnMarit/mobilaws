/**
 * Firebase Sync Routes
 * Endpoint to sync all Firebase Auth users to backend storage
 */

import { Router, Request, Response } from 'express';
import { getAllFirebaseAuthUsers } from '../lib/firebase-admin';
import { adminStorage } from './admin';

const router = Router();

/**
 * Sync all Firebase Auth users to backend storage
 * GET /api/firebase-sync/users
 * 
 * This endpoint:
 * 1. Fetches all users from Firebase Authentication
 * 2. Adds them to backend in-memory storage
 * 3. Returns the list of synced users
 * 
 * Admin authentication required
 */
router.get('/firebase-sync/users', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Starting Firebase Auth → Backend sync...');
    
    // Fetch all users from Firebase Auth
    const firebaseUsers = await getAllFirebaseAuthUsers();
    
    if (firebaseUsers.length === 0) {
      return res.json({
        success: false,
        message: 'No users found in Firebase Auth or Firebase Admin not configured',
        synced: 0,
        users: []
      });
    }

    console.log(`📊 Found ${firebaseUsers.length} users in Firebase Auth`);
    
    // Sync each user to backend storage
    let syncedCount = 0;
    const syncedUsers: any[] = [];

    for (const firebaseUser of firebaseUsers) {
      try {
        const userId = firebaseUser.uid;
        const email = firebaseUser.email || '';
        const name = firebaseUser.displayName || email.split('@')[0] || 'User';
        const picture = firebaseUser.photoURL || undefined;
        
        // Check if user already exists
        const existing = adminStorage.users.get(userId);
        const nowIso = new Date().toISOString();

        const userRecord = existing
          ? {
              ...existing,
              email,
              name,
              picture,
              updatedAt: nowIso,
            }
          : {
              id: userId,
              email,
              name,
              picture,
              status: 'active',
              createdAt: firebaseUser.metadata.creationTime || nowIso,
              updatedAt: nowIso,
            };

        adminStorage.users.set(userId, userRecord);
        syncedUsers.push(userRecord);
        syncedCount++;
        
        console.log(`✅ Synced user: ${email}`);
      } catch (error) {
        console.error(`❌ Failed to sync user ${firebaseUser.email}:`, error);
      }
    }

    console.log(`✅ Sync complete: ${syncedCount}/${firebaseUsers.length} users synced`);

    return res.json({
      success: true,
      message: `Successfully synced ${syncedCount} users from Firebase Auth`,
      synced: syncedCount,
      total: firebaseUsers.length,
      users: syncedUsers
    });
  } catch (error) {
    console.error('❌ Error during Firebase sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync users from Firebase Auth',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

