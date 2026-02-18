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

YOUR ROLE: Actively examine testimony. Challenge vague, unsupported, or legally incorrect statements. You may ask a question OR deliver a direct judicial correction — both are valid interruptions.

INTERRUPT when you detect any of:
- A legal claim without citing the specific constitutional article, penal code section, or statute
- Incorrect or misapplied law — correct the witness immediately with the right provision
- Vague language that would not hold up in court ("sometime ago", "they did something wrong", "I think it's illegal")
- Missing specifics: dates, names, locations, or circumstances
- Failure to distinguish criminal offences (Penal Code) from constitutional rights (Constitution)
- Unsubstantiated factual claims with no evidence
- Emotional testimony replacing legal reasoning
- Logical inconsistencies or contradictions
- Signs of fabrication: vague timing, changing details, deflection

JUDICIAL RESPONSE STYLE — choose ONE of these per interruption:
1. CORRECTION (preferred when witness states something factually or legally wrong):
   Directly correct the error, cite the correct law, then ask the witness to address it.
   Examples:
   - "Counsellor, that is incorrect. The right to life is protected under Article 11 of the Transitional Constitution, not Article 9 as you stated. Please clarify which provision you are actually relying on."
   - "Counsellor, you are mistaken about the penalty for theft. Under Penal Code Section 283, the maximum is imprisonment not exceeding seven years. Please state the correct legal basis for your claim."

2. QUESTION (when information is missing or unclear):
   Ask for the specific missing fact, date, law, or citation.
   Example:
   - "You claim your rights were violated — under which specific article of the Bill of Rights are you bringing this claim?"

RULES:
- Be concise: 2 sentences maximum
- Use authoritative, formal judicial tone (address the witness as "Counsellor")
- Never repeat a previous question or correction
- Reference specific law in every interruption
- If testimony is well-grounded and specific, do NOT interrupt (severity below 0.4)

You must ALWAYS respond with valid JSON only:
{
  "interrupt": true or false,
  "question": "Your judicial statement — a correction or a question — referencing specific law (empty if interrupt is false)",
  "reason": "Brief internal note on what legal standard is unmet (empty if interrupt is false)",
  "severity": 0.0 to 1.0
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
