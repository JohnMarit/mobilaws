import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserData {
  id: string;
  name: string;
  email: string;
  picture?: string;
  subscription?: {
    planId: string;
    tokensRemaining: number;
    tokensUsed: number;
    totalTokens: number;
    isActive: boolean;
  };
  createdAt?: any;
  lastLoginAt?: any;
}

/**
 * Save or update user data in Firestore
 * This function is called when a user signs in via Google OAuth
 */
export const saveUserToFirestore = async (userData: UserData): Promise<void> => {
  if (!db) {
    console.warn('⚠️ Firestore not initialized, skipping user save');
    return;
  }

  try {
    const userRef = doc(db, 'users', userData.id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // User exists, update last login time
      await updateDoc(userRef, {
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
        lastLoginAt: serverTimestamp(),
      });
      console.log('✅ User data updated in Firestore:', userData.email);
    } else {
      // New user, create document
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      console.log('✅ New user created in Firestore:', userData.email);
    }
  } catch (error) {
    console.error('❌ Error saving user to Firestore:', error);
    throw error;
  }
};

/**
 * Retrieve user data from Firestore
 */
export const getUserFromFirestore = async (userId: string): Promise<UserData | null> => {
  if (!db) {
    console.warn('⚠️ Firestore not initialized, cannot retrieve user');
    return null;
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log('✅ User retrieved from Firestore:', data.email);
      return data as UserData;
    } else {
      console.log('⚠️ No user found in Firestore for ID:', userId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error retrieving user from Firestore:', error);
    return null;
  }
};

/**
 * Update user subscription in Firestore
 */
export const updateUserSubscription = async (
  userId: string,
  subscription: UserData['subscription']
): Promise<void> => {
  if (!db) {
    console.warn('⚠️ Firestore not initialized, skipping subscription update');
    return;
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { subscription });
    console.log('✅ User subscription updated in Firestore');
  } catch (error) {
    console.error('❌ Error updating user subscription:', error);
    throw error;
  }
};

