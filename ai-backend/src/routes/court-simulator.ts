import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { getActiveSessionCount } from '../lib/court-simulator/websocket-server';
import { generateEvaluation, SessionData } from '../lib/court-simulator/evaluation-engine';
import { analyzeForInterruption } from '../lib/court-simulator/semantic-analyzer';
import { env } from '../env';

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
      userRole,
      userName,
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
      userRole: userRole ? String(userRole) : undefined,
      userName: userName ? String(userName) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('Court simulator analyze error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

router.post('/court-simulator/check-face', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Is there a real live human face clearly visible and directly facing the camera in this image? ' +
                    'A photo of a photo, drawing, or cartoon does NOT count. ' +
                    'Reply with JSON only: {"faceDetected": true or false}',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 30,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);
    res.json({ faceDetected: Boolean(parsed.faceDetected) });
  } catch (error) {
    console.error('Face check error:', error);
    // Graceful degradation — allow session if the check cannot complete
    res.json({ faceDetected: true });
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
