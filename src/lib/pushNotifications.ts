import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { app, db, firebaseConfig } from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const LAST_PROMPT_KEY = 'push:last-prompt-at';

/**
 * Register service worker, request permission, and store FCM token in Firestore for daily nudges.
 * Debounces permission prompt to at most once per 24 hours.
 */
export async function ensureDailyPushRegistration(userId: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    if (!userId || !app) return;
    if (!VAPID_KEY) {
      console.warn('⚠️ Missing VITE_FIREBASE_VAPID_KEY; push registration skipped.');
      return;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.warn('⚠️ Push/FCM not supported in this browser.');
      return;
    }

    // Rate-limit permission prompt
    if (Notification.permission === 'default') {
      const lastPrompt = Number(localStorage.getItem(LAST_PROMPT_KEY) || 0);
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - lastPrompt < oneDayMs) {
        return;
      }
      localStorage.setItem(LAST_PROMPT_KEY, Date.now().toString());
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    } else if (Notification.permission === 'denied') {
      return;
    }

    // Register / ready service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const readyRegistration = await navigator.serviceWorker.ready;

    // Send config to service worker so it can init messaging for background pushes
    readyRegistration.active?.postMessage({
      type: 'INIT_FIREBASE_MESSAGING',
      config: firebaseConfig,
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: readyRegistration,
    });

    if (!token) return;
    if (!db) return;

    const tokenRef = doc(db, 'userPushTokens', userId, 'tokens', token);
    await setDoc(
      tokenRef,
      {
        token,
        platform: 'web',
        userAgent: navigator.userAgent,
        enabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('Push registration failed', err);
  }
}

