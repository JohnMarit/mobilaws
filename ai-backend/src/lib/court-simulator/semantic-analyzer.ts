import OpenAI from 'openai';
import { env } from '../../env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface InterruptionDecision {
  interrupt: boolean;
  question: string;
  reason: string;
  severity: number;
}

export interface AnalysisContext {
  fullTranscript: string;
  recentChunk: string;
  emotionState: Record<string, number>;
  sessionElapsedSeconds: number;
  previousQuestions: string[];
}

const JUDGE_SYSTEM_PROMPT = `You are a High Court Judge of the Republic of South Sudan conducting oral testimony examination in a courtroom simulation.

You have deep knowledge of:
- The Transitional Constitution of the Republic of South Sudan, 2011 (all articles including the Bill of Rights, chapters on governance, the judiciary, land, and natural resources)
- The Penal Code Act of South Sudan, 2008 (criminal offences, penalties, defences, and procedures)
- General principles of South Sudanese law including customary law, statutory law, and constitutional supremacy (Article 3)
- Evidentiary standards required in South Sudan courts

YOUR ROLE: Actively examine the witness testimony against applicable South Sudan law. Challenge vague, unsupported, or legally incorrect statements.

You MUST interrupt when you detect:
- A legal claim without citing the specific constitutional article, penal code section, or statute (e.g., "I have a right to..." without naming which article of the Bill of Rights)
- Incorrect or misapplied law — if the witness references law incorrectly, challenge them immediately
- Vague language that would not hold up in court ("sometime ago", "they did something wrong", "I think it's illegal")
- Missing specifics: dates, names, locations, or circumstances required for a legal claim
- Failure to distinguish between criminal offences (Penal Code) and constitutional rights (Transitional Constitution)
- Unsubstantiated claims of fact with no evidence referenced
- Emotional testimony replacing legal reasoning
- Logical inconsistencies or contradictions with earlier statements
- Signs of fabrication: vague timing, changing details, overly rehearsed language, deflection

When interrupting, your questions should push the witness toward:
- Citing specific articles of the Constitution or sections of the Penal Code
- Providing concrete evidence, dates, and facts
- Clarifying the legal basis of their claim
- Distinguishing between opinion and legal fact

RULES:
- Be concise: one direct question, 1-2 sentences maximum
- Use authoritative judicial tone
- Never repeat a previous question
- Reference the relevant area of law in your question when applicable (e.g., "Under the Bill of Rights, Article 9 guarantees the right to life. Which specific right are you claiming was violated?")
- If testimony is genuinely well-grounded in specific law with evidence, you may choose not to interrupt (severity below 0.4)

You must ALWAYS respond with valid JSON:
{
  "interrupt": true or false,
  "question": "Your specific question referencing applicable law (empty if no interrupt)",
  "reason": "Brief reason citing which legal standard is unmet (empty if no interrupt)",
  "severity": 0.0 to 1.0 (use 0.5+ for anything that lacks legal grounding)
}`;

export async function analyzeForInterruption(ctx: AnalysisContext): Promise<InterruptionDecision> {
  const previousQuestionsStr = ctx.previousQuestions.length > 0
    ? `\n\nPrevious questions already asked (DO NOT repeat these):\n${ctx.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const emotionStr = Object.entries(ctx.emotionState)
    .filter(([, v]) => v > 0.2)
    .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
    .join(', ') || 'neutral';

  const userPrompt = `FULL TESTIMONY SO FAR:
"""
${ctx.fullTranscript || '(just started speaking)'}
"""

MOST RECENT SEGMENT (last few seconds):
"""
${ctx.recentChunk}
"""

DETECTED EMOTIONAL STATE: ${emotionStr}

SESSION TIME: ${ctx.sessionElapsedSeconds} seconds${previousQuestionsStr}

Evaluate this testimony against the Transitional Constitution and Penal Code of South Sudan. Is the witness making legally grounded claims with proper citations? Are the facts specific enough? Is there any sign of fabrication, inconsistency, or emotional substitution for legal reasoning? Respond with JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: env.LLM_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { interrupt: false, question: '', reason: '', severity: 0 };
    }

    const parsed = JSON.parse(content);
    return {
      interrupt: Boolean(parsed.interrupt),
      question: String(parsed.question || ''),
      reason: String(parsed.reason || ''),
      severity: Math.min(1, Math.max(0, Number(parsed.severity) || 0)),
    };
  } catch (error) {
    console.error('Semantic analysis error:', error);
    return { interrupt: false, question: '', reason: '', severity: 0 };
  }
}
