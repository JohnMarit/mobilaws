import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * GET /healthz
 */
router.get('/healthz', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default router;


