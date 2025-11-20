/**
 * One-time script to sync existing Firebase Auth users to Firestore
 * This fixes the issue where users exist in Auth but not in Firestore Database
 */

import { auth, db } from './firebase';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export async function syncAuthUsersToFirestore(): Promise<{ success: number; failed: number }> {
  if (!auth || !db) {
    console.error('❌ Firebase not initialized');
    return { success: 0, failed: 0 };
  }

  console.log('🔄 Starting sync of Auth users to Firestore...');
  
  // Note: We can only sync the currently logged-in user from the client side
  // To sync all users, you'd need to use Firebase Admin SDK on the backend
  
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.warn('⚠️ No user is currently logged in. Cannot sync.');
    return { success: 0, failed: 0 };
  }

  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    const userData = {
      id: currentUser.uid,
      email: currentUser.email || '',
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      picture: currentUser.photoURL || '',
      createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(userRef, userData, { merge: true });
    
    console.log('✅ Successfully synced current user to Firestore:', currentUser.email);
    console.log('👤 User data:', userData);
    
    return { success: 1, failed: 0 };
  } catch (error) {
    console.error('❌ Failed to sync user to Firestore:', error);
    return { success: 0, failed: 1 };
  }
}

// Export function to be called from browser console
if (typeof window !== 'undefined') {
  (window as any).syncAuthUsersToFirestore = syncAuthUsersToFirestore;
}

