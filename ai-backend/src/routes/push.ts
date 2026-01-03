import { Router } from 'express';
import { admin, initializeFirebaseAdmin } from '../lib/firebase-admin';

const router = Router();

const TARGET_HOURS = [9, 13, 18]; // local hours for reminders

function getFirestore() {
  const app = initializeFirebaseAdmin();
  if (!app) return null;
  return admin.firestore();
}

function getLocalHour(date: Date, tzOffsetMinutes?: number, timeZone?: string): number {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone,
      }).formatToParts(date);
      const hourPart = parts.find(p => p.type === 'hour');
      if (hourPart?.value) {
        return Number(hourPart.value);
      }
    } catch {
      // fall back to offset-based calculation
    }
  }
  const offset = tzOffsetMinutes ?? 0;
  const utcHour = date.getUTCHours();
  const localHour = (utcHour + offset / 60 + 24) % 24;
  return Math.floor(localHour);
}

router.post('/api/push/dispatch-daily', async (_req, res) => {
  const db = getFirestore();
  if (!db) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  const messaging = admin.messaging();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sentCount: { attempts: number; success: number; skipped: number; errors: number } = {
    attempts: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    const snapshot = await db.collectionGroup('tokens').get();
    const messages: admin.messaging.TokenMessage[] = [];
    const updates: Array<Promise<unknown>> = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data() as {
        token?: string;
        enabled?: boolean;
        tzOffsetMinutes?: number;
        timeZone?: string;
        lastSentSlot?: string;
        lastSentAt?: admin.firestore.Timestamp;
      };
      const token = data.token;
      const enabled = data.enabled !== false;
      if (!token || !enabled) {
        sentCount.skipped += 1;
        return;
      }

      const localHour = getLocalHour(now, data.tzOffsetMinutes, data.timeZone);
      if (!TARGET_HOURS.includes(localHour)) {
        sentCount.skipped += 1;
        return;
      }

      const slotId = `${today}-${localHour}`;
      if (data.lastSentSlot === slotId) {
        sentCount.skipped += 1;
        return;
      }

      sentCount.attempts += 1;
      messages.push({
        token,
        notification: {
          title: 'Keep your streak going',
          body: 'Jump in for a quick lesson now.',
        },
        data: {
          click_action: '/',
        },
      });

      updates.push(
        docSnap.ref.set(
          {
            lastSentSlot: slotId,
            lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      );
    });

    if (messages.length === 0) {
      return res.json({ sent: 0, ...sentCount, note: 'No tokens eligible this hour' });
    }

    const batchSize = 500;
    for (let i = 0; i < messages.length; i += batchSize) {
      const slice = messages.slice(i, i + batchSize);
      const response = await messaging.sendEach(slice);
      sentCount.success += response.successCount;
      sentCount.errors += response.failureCount;

      // Cleanup invalid tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const msg = slice[idx];
          const errorCode = (resp.error as any)?.code;
          if (errorCode === 'messaging/registration-token-not-registered' && msg.token) {
            updates.push(
              db.collectionGroup('tokens')
                .where('token', '==', msg.token)
                .get()
                .then(qs => Promise.all(qs.docs.map(d => d.ref.delete())))
            );
          }
        }
      });
    }

    await Promise.allSettled(updates);
    return res.json({ sent: sentCount.success, ...sentCount, totalMessages: messages.length });
  } catch (error) {
    console.error('❌ Push dispatch failed', error);
    return res.status(500).json({ error: 'Failed to dispatch pushes', details: (error as any)?.message });
  }
});

export default router;

