import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../env';
import { DeepgramStreamer, TranscriptResult } from './deepgram-streaming';
import { analyzeForInterruption, InterruptionDecision } from './semantic-analyzer';
import { detectEmotions, analyzeFrameWithVision, EmotionState } from './emotion-detector';
import { generateEvaluation, SessionEvaluation, SessionData } from './evaluation-engine';

interface ActiveSession {
  id: string;
  userId: string;
  ws: WebSocket;
  deepgram: DeepgramStreamer;
  startTime: number;
  fullTranscript: string;
  recentChunk: string;
  emotionTimeline: EmotionState[];
  interruptions: Array<InterruptionDecision & { timestamp: number }>;
  previousQuestions: string[];
  lastInterruptionTime: number;
  lastEmotionState: Record<string, number>;
  analysisInProgress: boolean;
  isActive: boolean;
  analyzeTimer: NodeJS.Timeout | null;
}

const activeSessions = new Map<string, ActiveSession>();

export function attachWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws/court-simulator' });

  wss.on('connection', (ws: WebSocket) => {
    let session: ActiveSession | null = null;

    ws.on('message', async (data: RawData, isBinary: boolean) => {
      try {
        const rawBuffer = Array.isArray(data)
          ? Buffer.concat(data.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
          : Buffer.isBuffer(data)
            ? data
            : Buffer.from(data);

        if (isBinary) {
          if (session?.isActive) {
            session.deepgram.sendAudio(rawBuffer);
          }
          return;
        }

        const message = JSON.parse(rawBuffer.toString('utf8'));

        switch (message.type) {
          case 'session_start':
            session = await handleSessionStart(ws, message);
            break;

          case 'video_frame':
            if (session?.isActive && message.data) {
              handleVideoFrame(session, message.data);
            }
            break;

          case 'transcript_fallback':
            if (session?.isActive && message.text) {
              handleFallbackTranscript(session, message.text, message.isFinal);
            }
            break;

          case 'session_end':
            if (session?.isActive) {
              await handleSessionEnd(session);
            }
            break;

          default:
            sendMessage(ws, { type: 'error', message: `Unknown message type: ${message.type}` });
        }
      } catch (error) {
        console.error('Court simulator WebSocket message error:', error);
        sendMessage(ws, { type: 'error', message: 'Failed to process message' });
      }
    });

    ws.on('close', () => {
      if (session) {
        cleanupSession(session);
      }
    });

    ws.on('error', (err) => {
      console.error('Court simulator WebSocket error:', err);
      if (session) {
        cleanupSession(session);
      }
    });
  });

  console.log('⚖️  Court Simulator WebSocket server attached at /ws/court-simulator');
  return wss;
}

async function handleSessionStart(ws: WebSocket, message: any): Promise<ActiveSession> {
  const sessionId = message.sessionId || uuidv4();
  const userId = message.userId || 'anonymous';

  const deepgram = new DeepgramStreamer();

  const session: ActiveSession = {
    id: sessionId,
    userId,
    ws,
    deepgram,
    startTime: Date.now(),
    fullTranscript: '',
    recentChunk: '',
    emotionTimeline: [],
    interruptions: [],
    previousQuestions: [],
    lastInterruptionTime: 0,
    lastEmotionState: {},
    analysisInProgress: false,
    isActive: true,
    analyzeTimer: null,
  };

  activeSessions.set(sessionId, session);

  deepgram.on('transcript', (result: TranscriptResult) => {
    if (!session.isActive) return;

    if (result.isFinal && result.text.trim()) {
      session.fullTranscript += (session.fullTranscript ? ' ' : '') + result.text;
      session.recentChunk = result.text;
    }

    sendMessage(ws, {
      type: 'transcript',
      text: result.text,
      isFinal: result.isFinal,
      confidence: result.confidence,
      timestamp: result.timestamp,
    });
  });

  deepgram.on('error', (err: Error) => {
    console.error(`Deepgram error for session ${sessionId}:`, err);
  });

  try {
    await deepgram.connect();
  } catch (err) {
    console.warn('Deepgram connection failed — will rely on browser-side recognition:', err);
  }

  session.analyzeTimer = setInterval(() => {
    if (session.isActive && session.recentChunk.trim().length > 0 && !session.analysisInProgress) {
      runSemanticAnalysis(session);
    }
  }, 4000);

  sendMessage(ws, {
    type: 'session_ready',
    sessionId,
    maxDuration: env.COURT_SIM_MAX_DURATION,
    minDuration: env.COURT_SIM_MIN_DURATION,
  });

  console.log(`⚖️  Court session started: ${sessionId} for user ${userId}`);
  return session;
}

function handleFallbackTranscript(session: ActiveSession, text: string, isFinal: boolean): void {
  if (isFinal && text.trim()) {
    session.fullTranscript += (session.fullTranscript ? ' ' : '') + text;
    session.recentChunk = text;
  }
}

async function handleVideoFrame(session: ActiveSession, base64Jpeg: string): Promise<void> {
  try {
    const frameDescription = await analyzeFrameWithVision(base64Jpeg);
    if (frameDescription && session.recentChunk) {
      const emotions = await detectEmotions(session.recentChunk, frameDescription);
      session.emotionTimeline.push(emotions);
      session.lastEmotionState = {
        nervousness: emotions.nervousness,
        stress: emotions.stress,
        anger: emotions.anger,
        confidence: emotions.confidence,
        hesitation: emotions.hesitation,
      };

      sendMessage(session.ws, {
        type: 'emotion',
        emotions: session.lastEmotionState,
        primary: emotions.primary,
        timestamp: emotions.timestamp,
      });
    }
  } catch (error) {
    console.error('Video frame processing error:', error);
  }
}

async function runSemanticAnalysis(session: ActiveSession): Promise<void> {
  if (session.analysisInProgress || !session.isActive) return;

  const elapsed = (Date.now() - session.startTime) / 1000;
  if (elapsed < 15) return;

  const timeSinceLastInterrupt = session.lastInterruptionTime > 0
    ? (Date.now() - session.lastInterruptionTime) / 1000
    : Infinity;
  if (timeSinceLastInterrupt < env.COURT_SIM_INTERRUPT_COOLDOWN) return;

  session.analysisInProgress = true;

  try {
    const result = await analyzeForInterruption({
      fullTranscript: session.fullTranscript,
      recentChunk: session.recentChunk,
      emotionState: session.lastEmotionState,
      sessionElapsedSeconds: elapsed,
      previousQuestions: session.previousQuestions,
    });

    session.recentChunk = '';

    if (result.interrupt && result.severity >= env.COURT_SIM_SEVERITY_THRESHOLD) {
      session.lastInterruptionTime = Date.now();
      session.previousQuestions.push(result.question);
      session.interruptions.push({ ...result, timestamp: Date.now() });

      sendMessage(session.ws, {
        type: 'interrupt',
        question: result.question,
        reason: result.reason,
        severity: result.severity,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('Semantic analysis error:', error);
  } finally {
    session.analysisInProgress = false;
  }
}

async function handleSessionEnd(session: ActiveSession): Promise<void> {
  session.isActive = false;

  if (session.analyzeTimer) {
    clearInterval(session.analyzeTimer);
    session.analyzeTimer = null;
  }

  session.deepgram.disconnect();

  sendMessage(session.ws, { type: 'finalizing', message: 'Generating evaluation...' });

  try {
    if (!session.recentChunk && session.fullTranscript) {
      const emotions = await detectEmotions(session.fullTranscript);
      session.emotionTimeline.push(emotions);
    }

    const sessionData: SessionData = {
      fullTranscript: session.fullTranscript,
      emotionTimeline: session.emotionTimeline,
      interruptions: session.interruptions,
      durationSeconds: Math.round((Date.now() - session.startTime) / 1000),
    };

    const evaluation = await generateEvaluation(sessionData);

    sendMessage(session.ws, {
      type: 'evaluation',
      evaluation,
      transcript: session.fullTranscript,
      emotionTimeline: session.emotionTimeline,
      interruptions: session.interruptions,
      durationSeconds: sessionData.durationSeconds,
    });
  } catch (error) {
    console.error('Session evaluation error:', error);
    sendMessage(session.ws, { type: 'error', message: 'Failed to generate evaluation' });
  }

  cleanupSession(session);
}

function cleanupSession(session: ActiveSession): void {
  session.isActive = false;
  if (session.analyzeTimer) {
    clearInterval(session.analyzeTimer);
    session.analyzeTimer = null;
  }
  session.deepgram.disconnect();
  activeSessions.delete(session.id);
  console.log(`⚖️  Court session cleaned up: ${session.id}`);
}

function sendMessage(ws: WebSocket, data: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}
