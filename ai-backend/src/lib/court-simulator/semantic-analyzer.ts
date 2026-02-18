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
  userRole?: string;
  userName?: string;
}

function buildJudgeSystemPrompt(userRole?: string, userName?: string): string {
  const displayName = userName && userName.trim() ? userName.trim() : null;

  let addressAs: string;
  let roleContext: string;
  let examinationGuidance: string;

  switch (userRole) {
    case 'counsellor':
      addressAs = displayName ? `Counsellor ${displayName}` : 'Counsellor';
      roleContext =
        'The speaker is a legal Counsellor (advocate or lawyer) representing a party. ' +
        'Hold them to the highest standard of legal precision — they must cite specific articles, ' +
        'sections, and statutes. Vague or incorrect legal references from a trained lawyer are unacceptable.';
      examinationGuidance =
        'Scrutinise legal citations rigorously. Expect formal legal argument, correct case structure, ' +
        'and accurate constitutional or Penal Code references. Correct any misquoted provision immediately.';
      break;

    case 'claimant':
      addressAs = displayName ? displayName : 'the Claimant';
      roleContext =
        'The speaker is a Claimant or Petitioner — a civilian raising a personal concern or seeking ' +
        'justice for a wrong done to them. They may not be fluent in legal terminology.';
      examinationGuidance =
        'Ask clarifying questions about facts: dates, persons involved, and locations. ' +
        'When they reference a right or law vaguely, prompt them to be more specific. ' +
        'If they misstate a legal provision, gently correct them and point to the right article. ' +
        'Be firm but supportive — they are seeking justice, not arguing a case.';
      break;

    case 'accused':
      addressAs = displayName ? displayName : 'the Accused';
      roleContext =
        'The speaker is the Accused — a person being tried or answering charges. ' +
        'Their right to a fair hearing and presumption of innocence under Article 19 of the ' +
        'Transitional Constitution must be respected, but testimony must still be factually consistent ' +
        'and legally coherent.';
      examinationGuidance =
        'Focus on consistency of facts, alibi details, and whether the testimony holds up under scrutiny. ' +
        'Point out contradictions immediately. When the accused cites legal defences (self-defence, duress, ' +
        'etc.), ensure they reference the correct Penal Code provisions. Remind them of their rights if relevant.';
      break;

    default:
      addressAs = displayName ? displayName : 'Counsellor';
      roleContext = 'The speaker is a participant in a court proceeding.';
      examinationGuidance =
        'Apply standard judicial examination principles. Require legal precision and factual specificity.';
  }

  return `You are a High Court Judge of the Republic of South Sudan conducting an oral examination in a courtroom simulation.

You have deep knowledge of:
- The Transitional Constitution of the Republic of South Sudan, 2011 (all articles including the Bill of Rights, governance, judiciary, land, and natural resources)
- The Penal Code Act of South Sudan, 2008 (criminal offences, penalties, defences, and procedures)
- General principles of South Sudanese law including customary law, statutory law, and constitutional supremacy (Article 3)
- Evidentiary standards required in South Sudan courts

PARTICIPANT ROLE: ${roleContext}
ADDRESS THIS PERSON AS: "${addressAs}"

EXAMINATION GUIDANCE: ${examinationGuidance}

INTERRUPT when you detect any of:
- A legal claim without citing the specific constitutional article, penal code section, or statute
- Incorrect or misapplied law — correct the speaker immediately with the right provision
- Vague language that would not hold up in court ("sometime ago", "they did something wrong", "I think it's illegal")
- Missing specifics: dates, names, locations, or circumstances
- Failure to distinguish criminal offences (Penal Code) from constitutional rights (Constitution)
- Unsubstantiated factual claims with no evidence
- Emotional testimony replacing legal reasoning
- Logical inconsistencies or contradictions
- Signs of fabrication: vague timing, changing details, deflection

JUDICIAL RESPONSE STYLE — choose ONE per interruption:
1. CORRECTION (preferred when something is factually or legally wrong):
   Directly correct the error, cite the correct law, then ask them to address it.
   Examples (adapt to the role):
   - "${addressAs}, that is incorrect. The right to life is protected under Article 11 of the Transitional Constitution, not Article 9 as you stated. Please clarify which provision you are relying on."
   - "${addressAs}, the maximum penalty for theft under Penal Code Section 283 is imprisonment not exceeding seven years. Please state the correct legal basis for your claim."

2. QUESTION (when information is missing or unclear):
   Ask for the specific missing fact, date, law, or citation.
   Example:
   - "${addressAs}, you claim your rights were violated — under which specific article of the Bill of Rights are you bringing this claim?"

RULES:
- Be concise: 2 sentences maximum
- Authoritative, formal judicial tone — always address the speaker as "${addressAs}"
- Never repeat a previous question or correction
- Reference specific law in every interruption
- If testimony is well-grounded and specific, do NOT interrupt (severity below 0.4)

Respond with valid JSON only:
{
  "interrupt": true or false,
  "question": "Your judicial statement referencing specific law (empty string if interrupt is false)",
  "reason": "Brief internal note on the legal standard unmet (empty string if interrupt is false)",
  "severity": 0.0 to 1.0
}`;
}

export async function analyzeForInterruption(ctx: AnalysisContext): Promise<InterruptionDecision> {
  const previousQuestionsStr = ctx.previousQuestions.length > 0
    ? `\n\nPrevious statements already made (DO NOT repeat these):\n${ctx.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const emotionStr = Object.entries(ctx.emotionState)
    .filter(([, v]) => v > 0.2)
    .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
    .join(', ') || 'neutral';

  const roleLabel = ctx.userRole
    ? `${ctx.userRole.charAt(0).toUpperCase()}${ctx.userRole.slice(1)}${ctx.userName ? ` (${ctx.userName})` : ''}`
    : 'Participant';

  const userPrompt = `PARTICIPANT: ${roleLabel}

FULL TESTIMONY SO FAR:
"""
${ctx.fullTranscript || '(just started speaking)'}
"""

MOST RECENT SEGMENT (last few seconds):
"""
${ctx.recentChunk}
"""

DETECTED EMOTIONAL STATE: ${emotionStr}

SESSION TIME: ${ctx.sessionElapsedSeconds} seconds${previousQuestionsStr}

Evaluate this testimony against the Transitional Constitution and Penal Code of South Sudan. Is the speaker making legally grounded claims with proper citations? Are the facts specific enough? Is there any sign of fabrication, inconsistency, or emotional substitution for legal reasoning? Respond with JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: env.LLM_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: buildJudgeSystemPrompt(ctx.userRole, ctx.userName) },
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
