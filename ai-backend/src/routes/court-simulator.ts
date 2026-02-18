import { Router, Request, Response } from 'express';
import { getActiveSessionCount } from '../lib/court-simulator/websocket-server';
import { generateEvaluation, SessionData } from '../lib/court-simulator/evaluation-engine';
import { analyzeForInterruption } from '../lib/court-simulator/semantic-analyzer';

const router = Router();

router.get('/court-simulator/status', (_req: Request, res: Response) => {
  res.json({
    service: 'court-simulator',
    status: 'active',
    activeSessions: getActiveSessionCount(),
    config: {
      maxDuration: 120,
      minDuration: 60,
      interruptCooldown: 10,
      severityThreshold: 0.5,
    },
  });
});

router.post('/court-simulator/analyze', async (req: Request, res: Response) => {
  try {
    const {
      fullTranscript,
      recentChunk,
      emotionState,
      sessionElapsedSeconds,
      previousQuestions,
    } = req.body;

    if (!fullTranscript && !recentChunk) {
      res.status(400).json({ error: 'fullTranscript or recentChunk is required' });
      return;
    }

    const result = await analyzeForInterruption({
      fullTranscript: String(fullTranscript || ''),
      recentChunk: String(recentChunk || fullTranscript || ''),
      emotionState: emotionState || {},
      sessionElapsedSeconds: Number(sessionElapsedSeconds) || 30,
      previousQuestions: Array.isArray(previousQuestions) ? previousQuestions : [],
    });

    res.json(result);
  } catch (error) {
    console.error('Court simulator analyze error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

router.post('/court-simulator/evaluate', async (req: Request, res: Response) => {
  try {
    const { fullTranscript, emotionTimeline, interruptions, durationSeconds } = req.body;

    if (!fullTranscript) {
      res.status(400).json({ error: 'fullTranscript is required' });
      return;
    }

    const sessionData: SessionData = {
      fullTranscript: String(fullTranscript),
      emotionTimeline: Array.isArray(emotionTimeline) ? emotionTimeline : [],
      interruptions: Array.isArray(interruptions) ? interruptions : [],
      durationSeconds: Number(durationSeconds) || 60,
    };

    const evaluation = await generateEvaluation(sessionData);
    res.json({ evaluation });
  } catch (error) {
    console.error('Court simulator evaluation error:', error);
    res.status(500).json({ error: 'Failed to generate evaluation' });
  }
});

export default router;
