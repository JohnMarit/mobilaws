import OpenAI from 'openai';
import { env } from '../../env';
import { EmotionState } from './emotion-detector';
import { InterruptionDecision } from './semantic-analyzer';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface SessionEvaluation {
  legal_reasoning: number;
  clarity: number;
  logical_consistency: number;
  emotional_control: number;
  credibility: number;
  legal_accuracy: number;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  legal_references: string[];
  legal_quotes: Array<{
    reference: string;
    quote: string;
    relevance: string;
  }>;
  credibility_assessment: string;
  emotion_profile: string;
  summary: string;
  personal_advice: string;
}

export interface SessionData {
  fullTranscript: string;
  emotionTimeline: EmotionState[];
  interruptions: Array<InterruptionDecision & { timestamp: number }>;
  durationSeconds: number;
}

const EVALUATION_SYSTEM_PROMPT = `You are a senior female High Court Judge of the Republic of South Sudan — a wise, experienced woman known for being firm but deeply compassionate. You are delivering a personal evaluation after hearing oral testimony in a courtroom simulation.

You have expert knowledge of:
- The Transitional Constitution of the Republic of South Sudan, 2011 (all 201 articles)
- The Penal Code Act of South Sudan, 2008 (all criminal offences and penalties)
- South Sudanese customary law, statutory interpretation, and judicial precedent
- Standards of evidence and testimony credibility in South Sudan courts

EVALUATE the testimony across these dimensions (0-100 each):

1. **legal_reasoning** — Did the witness demonstrate understanding of applicable law? Did they cite specific constitutional articles, penal code sections, or statutes? Did they correctly apply law to facts?

2. **clarity** — Was the testimony clear, organized, and comprehensible? Were facts presented in logical order with specific details (dates, names, places)?

3. **logical_consistency** — Were all statements internally consistent? Were there contradictions, gaps in logic, or non-sequiturs?

4. **emotional_control** — Did the witness maintain composure? Was emotion used appropriately or did it replace substance? Were there signs of breakdown, anger, or excessive nervousness?

5. **credibility** — How believable is this testimony? Consider: specificity of details, consistency, emotional congruence (does emotion match the claim?), absence of deflection or evasion, willingness to answer judge questions directly.

6. **legal_accuracy** — Were legal references correct? Did the witness accurately cite law, or did they misstate provisions? Were the right laws applied to the right facts?

ALSO PROVIDE:
- **personal_advice**: THIS IS THE MOST IMPORTANT FIELD. Write 4-6 sentences of warm, direct, personal advice as if you are speaking face-to-face to this person after the session. Talk to them like a wise, caring mentor — not a robot.
  STRUCTURE: (1) Acknowledge what they did well — be specific and genuine. (2) Tell them clearly where they went wrong — be honest but kind. (3) Give them concrete, actionable steps to fix their issue — what exactly should they do next? Cite specific articles or legal provisions they should read. (4) End with encouragement.
  TONE: Speak like a real woman judge who has seen it all and genuinely wants this person to succeed. Use "you" and address them directly. Be human. Examples of good tone:
  - "You clearly care about this issue, and that came through. But here is where you stumbled — you kept saying your rights were violated without ever telling me which right. Next time, before you come to court, write down exactly what happened and when. Read Article 28 of our Constitution about property rights — it is probably the one that protects you. You have a good case, but you need to present it properly."
  - "I could tell you were nervous, and that is completely normal. But nervousness made you contradict yourself twice — you said you were home, then you said you were at the market. A judge will notice that immediately. My advice? Sit down tonight and write your story from beginning to end. Get the timeline straight. And remember, Article 19 says you are innocent until proven guilty — the court is not your enemy."
- **legal_references**: List 2-4 specific articles of the Constitution or sections of the Penal Code that are relevant to what the witness discussed. Format: ["Article 9 - Right to Life", "Penal Code Section 206 - Murder"]
- **legal_quotes**: List 2-4 quoted provisions from those same legal references. Each item must include:
  - "reference": article/section label (for example: "Article 11 - Equality before the Law")
  - "quote": a short direct quote or paraphrased extract in quotation marks from the legal provision (max 220 chars)
  - "relevance": one sentence explaining why this provision supports or challenges the witness claim
- **credibility_assessment**: 2-3 sentences analyzing whether the testimony appears truthful, fabricated, exaggerated, or uncertain. Note specific indicators (vague timing = less credible, specific consistent details = more credible, emotional incongruence = suspicious).
- **emotion_profile**: 2-3 sentences describing the emotional arc of the testimony. Was the witness calm, increasingly nervous, defensive when challenged, etc.? How did emotions affect testimony quality?
- **strengths**: 2-4 specific things done well
- **weaknesses**: 2-4 specific areas needing improvement
- **recommendations**: 2-4 actionable suggestions, referencing specific legal topics the witness should study
- **summary**: 3-4 sentence judicial assessment

Respond with JSON only:
{
  "legal_reasoning": 0-100,
  "clarity": 0-100,
  "logical_consistency": 0-100,
  "emotional_control": 0-100,
  "credibility": 0-100,
  "legal_accuracy": 0-100,
  "personal_advice": "Your warm, direct personal advice to this person (4-6 sentences)...",
  "legal_references": ["..."],
  "legal_quotes": [{ "reference": "...", "quote": "\"...\"", "relevance": "..." }],
  "credibility_assessment": "...",
  "emotion_profile": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "summary": "..."
}`;

export async function generateEvaluation(session: SessionData): Promise<SessionEvaluation> {
  const avgEmotion = computeAverageEmotions(session.emotionTimeline);
  const interruptionSummary = session.interruptions.map((intr, i) =>
    `${i + 1}. [Severity: ${intr.severity.toFixed(2)}] Judge asked: "${intr.question}" — Reason: ${intr.reason}`
  ).join('\n') || 'No interruptions were triggered during the session.';

  const emotionSummary = Object.entries(avgEmotion)
    .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
    .join(', ');

  const emotionTimeline = session.emotionTimeline.length > 0
    ? session.emotionTimeline.map((e, i) =>
      `  [${i + 1}] primary: ${e.primary}, confidence: ${(e.confidence * 100).toFixed(0)}%, nervousness: ${(e.nervousness * 100).toFixed(0)}%, stress: ${(e.stress * 100).toFixed(0)}%`
    ).join('\n')
    : '  No emotion data captured.';

  const prompt = `FULL TESTIMONY TRANSCRIPT:
"""
${session.fullTranscript || '(No speech detected)'}
"""

SESSION DURATION: ${session.durationSeconds} seconds

EMOTION AVERAGES: ${emotionSummary}

EMOTION TIMELINE (chronological):
${emotionTimeline}

JUDICIAL INTERRUPTIONS DURING SESSION:
${interruptionSummary}

Evaluate this testimony against the Transitional Constitution and Penal Code of South Sudan. Assess credibility, legal accuracy, emotional state, and overall courtroom performance. Respond with JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: env.LLM_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty evaluation response');

    const parsed = JSON.parse(content);
    const scores = {
      legal_reasoning: clampScore(parsed.legal_reasoning),
      clarity: clampScore(parsed.clarity),
      logical_consistency: clampScore(parsed.logical_consistency),
      emotional_control: clampScore(parsed.emotional_control),
      credibility: clampScore(parsed.credibility),
      legal_accuracy: clampScore(parsed.legal_accuracy),
    };

    return {
      ...scores,
      overall_score: Math.round(
        (scores.legal_reasoning * 2 + scores.clarity + scores.logical_consistency + scores.emotional_control + scores.credibility * 2 + scores.legal_accuracy * 2) / 8
      ),
      strengths: ensureStringArray(parsed.strengths),
      weaknesses: ensureStringArray(parsed.weaknesses),
      recommendations: ensureStringArray(parsed.recommendations),
      legal_references: ensureStringArray(parsed.legal_references),
      legal_quotes: ensureLegalQuotes(parsed.legal_quotes),
      credibility_assessment: String(parsed.credibility_assessment || ''),
      emotion_profile: String(parsed.emotion_profile || ''),
      summary: String(parsed.summary || 'Evaluation complete.'),
      personal_advice: String(parsed.personal_advice || ''),
    };
  } catch (error) {
    console.error('Evaluation engine error:', error);
    return {
      legal_reasoning: 50,
      clarity: 50,
      logical_consistency: 50,
      emotional_control: 50,
      credibility: 50,
      legal_accuracy: 50,
      overall_score: 50,
      strengths: ['Session completed'],
      weaknesses: ['Evaluation could not be fully generated'],
      recommendations: ['Study the Transitional Constitution, particularly the Bill of Rights (Articles 9-34)'],
      legal_references: [],
      legal_quotes: [],
      credibility_assessment: 'Could not be assessed.',
      emotion_profile: 'Could not be assessed.',
      summary: 'The evaluation encountered an error. Please try again.',
      personal_advice: '',
    };
  }
}

function computeAverageEmotions(timeline: EmotionState[]): Record<string, number> {
  if (timeline.length === 0) {
    return { nervousness: 0, stress: 0, anger: 0, confidence: 0.5, hesitation: 0 };
  }

  const sums = { nervousness: 0, stress: 0, anger: 0, confidence: 0, hesitation: 0 };
  for (const e of timeline) {
    sums.nervousness += e.nervousness;
    sums.stress += e.stress;
    sums.anger += e.anger;
    sums.confidence += e.confidence;
    sums.hesitation += e.hesitation;
  }

  const n = timeline.length;
  return {
    nervousness: sums.nervousness / n,
    stress: sums.stress / n,
    anger: sums.anger / n,
    confidence: sums.confidence / n,
    hesitation: sums.hesitation / n,
  };
}

function clampScore(val: any): number {
  const n = Math.round(Number(val) || 50);
  return Math.min(100, Math.max(0, n));
}

function ensureStringArray(val: any): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  return [];
}

function ensureLegalQuotes(
  val: any,
): Array<{ reference: string; quote: string; relevance: string }> {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => ({
      reference: String(item?.reference || '').trim(),
      quote: String(item?.quote || '').trim(),
      relevance: String(item?.relevance || '').trim(),
    }))
    .filter((item) => item.reference && item.quote);
}
