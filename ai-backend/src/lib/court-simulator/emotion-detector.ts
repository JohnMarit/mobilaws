import OpenAI from 'openai';
import { env } from '../../env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface EmotionState {
  nervousness: number;
  stress: number;
  anger: number;
  confidence: number;
  hesitation: number;
  primary: string;
  timestamp: number;
}

const EMOTION_SYSTEM_PROMPT = `You are an expert forensic psychologist analyzing witness testimony in a South Sudan courtroom for emotional and credibility indicators.

Your analysis serves two purposes:
1. Emotional state detection — how the witness is feeling
2. Credibility signals — whether the emotional state is congruent with the claims being made

Score each dimension from 0.0 to 1.0:
- nervousness: self-corrections, filler words (um, uh, like), false starts, voice tremor indicators
- stress: rapid/fragmented speech, incomplete sentences, raised intensity, topic avoidance
- anger: aggressive or defensive language, blame-shifting, hostility toward the examiner
- confidence: clear assertions, steady pacing, specific details (names, dates, places), direct answers
- hesitation: pauses, qualifications ("I think", "maybe", "not sure", "I believe"), hedging, vagueness

Also determine the "primary" label. Choose from:
- "confident" — dominant confidence with specific claims
- "nervous" — dominant nervousness suggesting anxiety
- "evasive" — hesitation combined with vagueness suggesting avoidance
- "defensive" — anger or stress in response to probing, suggesting vulnerability
- "composed" — balanced, measured delivery (high confidence, low everything else)
- "distressed" — high stress and nervousness suggesting genuine emotional difficulty
- "uncertain" — primarily hesitant without strong other signals
- "neutral" — no strong emotional signals

Respond with JSON only:
{
  "nervousness": 0.0-1.0,
  "stress": 0.0-1.0,
  "anger": 0.0-1.0,
  "confidence": 0.0-1.0,
  "hesitation": 0.0-1.0,
  "primary": "label"
}`;

export async function detectEmotions(
  transcriptChunk: string,
  frameDescription?: string
): Promise<EmotionState> {
  if (!transcriptChunk || transcriptChunk.trim().length < 5) {
    return {
      nervousness: 0,
      stress: 0,
      anger: 0,
      confidence: 0.5,
      hesitation: 0,
      primary: 'neutral',
      timestamp: Date.now(),
    };
  }

  const visualContext = frameDescription
    ? `\n\nVISUAL OBSERVATION (from camera): ${frameDescription}`
    : '';

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EMOTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `TESTIMONY SEGMENT:\n"""${transcriptChunk}"""${visualContext}\n\nAnalyze the witness's emotional state and credibility signals. Respond with JSON only.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    const parsed = JSON.parse(content);
    return {
      nervousness: clamp(parsed.nervousness),
      stress: clamp(parsed.stress),
      anger: clamp(parsed.anger),
      confidence: clamp(parsed.confidence),
      hesitation: clamp(parsed.hesitation),
      primary: String(parsed.primary || 'neutral'),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Emotion detection error:', error);
    return {
      nervousness: 0,
      stress: 0,
      anger: 0,
      confidence: 0.5,
      hesitation: 0,
      primary: 'neutral',
      timestamp: Date.now(),
    };
  }
}

export async function analyzeFrameWithVision(base64Jpeg: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Briefly describe the person\'s visible emotional state and body language in one sentence. Focus on: facial expression, posture tension, eye contact direction, and any signs of stress, confidence, or evasion. Note if the expression matches someone giving truthful vs fabricated testimony.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Jpeg}`, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Frame analysis error:', error);
    return '';
  }
}

function clamp(val: any): number {
  const n = Number(val) || 0;
  return Math.min(1, Math.max(0, n));
}
