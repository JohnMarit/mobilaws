import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

try {
  // Check if all required Firebase config values are present
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.warn('⚠️ Missing Firebase configuration:', missingFields.join(', '));
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Set persistence to LOCAL (persists across browser sessions and page refreshes)
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Firebase Auth persistence set to LOCAL');
    })
    .catch((error) => {
      console.warn('⚠️ Failed to set Firebase Auth persistence:', error);
    });
  
  db = getFirestore(app);
  console.log('✅ Firestore initialized:', {
    projectId: firebaseConfig.projectId,
    hasDb: !!db,
    type: db?.type
  });
  
  // Initialize Analytics (only in browser and if supported)
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
      console.log('✅ Firebase initialized successfully (Auth + Firestore + Analytics)');
    } catch (analyticsError) {
      console.warn('⚠️ Analytics not supported in this environment');
      console.log('✅ Firebase initialized successfully (Auth + Firestore)');
    }
  } else {
    console.log('✅ Firebase initialized successfully (Auth + Firestore)');
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization failed:', error);
  console.warn('💡 Please configure Firebase environment variables in .env file');
  app = null;
  auth = null;
  db = null;
  analytics = null;
}

export { app, auth, db, analytics };
export default app;