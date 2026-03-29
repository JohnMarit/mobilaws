import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/FirebaseAuthContext';

export type SavedAssistantMode = 'student' | 'lawyer' | 'consumer';

const VALID: SavedAssistantMode[] = ['student', 'lawyer', 'consumer'];

function normalizeMode(value: unknown): SavedAssistantMode | null {
  if (typeof value !== 'string') return null;
  return VALID.includes(value as SavedAssistantMode) ? (value as SavedAssistantMode) : null;
}

/**
 * Live Firestore preference for users/{uid}.assistantMode.
 * When not signed in, hasSavedAssistantMode is false and assistantMode is null.
 */
export function useAssistantModePreference() {
  const { user } = useAuth();
  const [assistantMode, setAssistantMode] = useState<SavedAssistantMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAssistantMode(null);
      setLoading(false);
      return;
    }

    if (!db) {
      setAssistantMode(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, 'users', user.id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const raw = snap.exists() ? snap.data().assistantMode : null;
        setAssistantMode(normalizeMode(raw));
        setLoading(false);
      },
      (err) => {
        console.error('assistantMode snapshot error', err);
        setAssistantMode(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const hasSavedAssistantMode = Boolean(assistantMode);

  return { assistantMode, hasSavedAssistantMode, loading };
}
