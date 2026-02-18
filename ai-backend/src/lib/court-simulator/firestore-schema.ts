/**
 * Firestore collections for Court Simulator:
 *
 * court_sessions/{sessionId}
 *   - userId: string
 *   - startTime: Timestamp
 *   - endTime: Timestamp | null
 *   - durationSeconds: number
 *   - emotionSummary: { nervousness, stress, anger, confidence, hesitation }
 *   - finalScore: { legal_reasoning, clarity, logical_consistency, emotional_control, overall_score }
 *   - status: 'active' | 'completed' | 'abandoned'
 *
 * court_sessions/{sessionId}/transcripts/{transcriptId}
 *   - timestamp: Timestamp
 *   - text: string
 *   - emotion: string (primary)
 *   - interruptionFlag: boolean
 *
 * court_sessions/{sessionId}/interruptions/{interruptionId}
 *   - timestamp: Timestamp
 *   - question: string
 *   - reason: string
 *   - severity: number
 *
 * court_sessions/{sessionId}/scores/{scoreId}
 *   - legal_reasoning: number (0-100)
 *   - clarity: number (0-100)
 *   - logical_consistency: number (0-100)
 *   - emotional_control: number (0-100)
 *   - overall_score: number (0-100)
 *   - strengths: string[]
 *   - weaknesses: string[]
 *   - recommendations: string[]
 *   - summary: string
 *
 * SQL equivalent (for migration/reference):
 *
 * CREATE TABLE court_sessions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id TEXT NOT NULL,
 *   start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   end_time TIMESTAMPTZ,
 *   duration_seconds INTEGER,
 *   emotion_summary JSONB,
 *   final_score_json JSONB,
 *   status TEXT NOT NULL DEFAULT 'active'
 * );
 *
 * CREATE TABLE court_transcripts (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id UUID REFERENCES court_sessions(id) ON DELETE CASCADE,
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   text TEXT NOT NULL,
 *   emotion TEXT,
 *   interruption_flag BOOLEAN DEFAULT false
 * );
 *
 * CREATE TABLE court_interruptions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id UUID REFERENCES court_sessions(id) ON DELETE CASCADE,
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   question TEXT NOT NULL,
 *   reason TEXT,
 *   severity REAL NOT NULL
 * );
 *
 * CREATE TABLE court_scores (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id UUID REFERENCES court_sessions(id) ON DELETE CASCADE,
 *   legal_reasoning INTEGER NOT NULL,
 *   clarity INTEGER NOT NULL,
 *   logical_consistency INTEGER NOT NULL,
 *   emotional_control INTEGER NOT NULL,
 *   overall_score INTEGER NOT NULL,
 *   strengths JSONB,
 *   weaknesses JSONB,
 *   recommendations JSONB,
 *   summary TEXT,
 *   feedback_json JSONB
 * );
 *
 * CREATE INDEX idx_court_sessions_user ON court_sessions(user_id);
 * CREATE INDEX idx_court_transcripts_session ON court_transcripts(session_id);
 * CREATE INDEX idx_court_interruptions_session ON court_interruptions(session_id);
 * CREATE INDEX idx_court_scores_session ON court_scores(session_id);
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';

interface SaveSessionParams {
  sessionId: string;
  userId: string;
  durationSeconds: number;
  fullTranscript: string;
  emotionSummary: Record<string, number>;
  evaluation: {
    legal_reasoning: number;
    clarity: number;
    logical_consistency: number;
    emotional_control: number;
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    summary: string;
  };
  interruptions: Array<{
    question: string;
    reason: string;
    severity: number;
    timestamp: number;
  }>;
}

export async function saveSessionToFirestore(params: SaveSessionParams): Promise<void> {
  try {
    const db = getFirestore();
    const sessionRef = db.collection('court_sessions').doc(params.sessionId);

    await sessionRef.set({
      userId: params.userId,
      startTime: Timestamp.fromMillis(Date.now() - params.durationSeconds * 1000),
      endTime: Timestamp.now(),
      durationSeconds: params.durationSeconds,
      emotionSummary: params.emotionSummary,
      finalScore: {
        legal_reasoning: params.evaluation.legal_reasoning,
        clarity: params.evaluation.clarity,
        logical_consistency: params.evaluation.logical_consistency,
        emotional_control: params.evaluation.emotional_control,
        overall_score: params.evaluation.overall_score,
      },
      fullTranscript: params.fullTranscript,
      status: 'completed',
    });

    await sessionRef.collection('scores').add({
      ...params.evaluation,
      createdAt: Timestamp.now(),
    });

    for (const intr of params.interruptions) {
      await sessionRef.collection('interruptions').add({
        question: intr.question,
        reason: intr.reason,
        severity: intr.severity,
        timestamp: Timestamp.fromMillis(intr.timestamp),
      });
    }

    console.log(`⚖️  Session ${params.sessionId} saved to Firestore`);
  } catch (error) {
    console.error('Failed to save session to Firestore:', error);
  }
}
