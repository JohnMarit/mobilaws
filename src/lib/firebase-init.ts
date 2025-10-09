// Firebase initialization helper
// This file provides utilities for Firebase setup and error handling

export const initializeFirebase = async () => {
  try {
    const { app, auth } = await import('./firebase');
    
    if (!app || !auth) {
      throw new Error('Firebase not properly initialized');
    }
    
    console.log('✅ Firebase modules loaded successfully');
    return { app, auth };
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error);
    return { app: null, auth: null };
  }
};

export const isFirebaseAvailable = async (): Promise<boolean> => {
  try {
    await import('firebase/app');
    return true;
  } catch {
    return false;
  }
};

export default initializeFirebase;
