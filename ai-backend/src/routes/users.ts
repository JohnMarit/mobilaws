import { Router, Request, Response } from 'express';
import { adminStorage } from './admin';

const router = Router();

/**
 * Sync (create/update) a user from the frontend
 * POST /api/users/sync
 * Body: { id: string, email: string, name?: string, picture?: string }
 */
router.post('/users/sync', async (req: Request, res: Response) => {
  try {
    const { id, email, name, picture } = req.body || {};

    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required fields: id, email' });
    }

    const existing = adminStorage.users.get(id);
    const nowIso = new Date().toISOString();

    const userRecord = existing
      ? {
          ...existing,
          email,
          name: name || existing.name || email.split('@')[0],
          picture: picture || existing.picture,
          updatedAt: nowIso,
        }
      : {
          id,
          email,
          name: name || email.split('@')[0],
          picture,
          status: 'active',
          createdAt: nowIso,
          updatedAt: nowIso,
        };

    adminStorage.users.set(id, userRecord);

    return res.json({ success: true, user: userRecord });
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    return res.status(500).json({ error: 'Failed to sync user' });
  }
});

export default router;


