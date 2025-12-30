import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Document } from '@langchain/core/documents';
import { getChatModel } from './llm';
import { getRetriever } from './vectorstore';

/**
 * Build subscription-specific learning path rules
 */
function buildLearningPathRules(subscriptionTier: 'basic' | 'standard' | 'premium' | 'free' = 'free'): string {
  // Normalize tier: treat 'free' as 'basic' for learning paths
  const tier = subscriptionTier === 'free' ? 'basic' : subscriptionTier;

  if (tier === 'basic') {
    return `
----------------------------------------------------
LEARNING PATH RULES - BASIC SUBSCRIPTION
----------------------------------------------------

You are Mobilaws, a legal education AI focused on South Sudan law and the South Sudan Constitution.

YOUR ROLE: Guide subscribed users through structured LEGAL LEARNING PATHS.

A learning path is a step-by-step educational journey that teaches a legal topic progressively.

SUBSCRIPTION TIER: BASIC

BASIC SUBSCRIPTION RESTRICTIONS:

ALLOWED:
- Access to ONLY introductory learning paths
- Maximum of 3 modules per learning path
- Maximum of 1 step per module
- High-level explanations only
- No legal documents
- No case examples
- No action plans

REQUIRED BEHAVIOR:
- Keep explanations brief
- End each module with a lock notice:
  "🔒 Upgrade to Standard or Premium to continue this learning path"

DISALLOWED:
- Deep legal interpretation
- Step-by-step procedures
- Templates or documents
- Constitutional article citations

LEARNING PATH STRUCTURE (MANDATORY FORMAT):

When starting a learning path, always use this format:

Learning Path Title:
Target Audience:
Subscription Level: Basic
Modules:
- Module 1: Title
  Step 1: [Brief introduction only]
- Module 2: Title
  Step 1: [Brief introduction only]
- Module 3: Title
  Step 1: [Brief introduction only]

LOCKED CONTENT HANDLING:
If the user requests content beyond their subscription:
- Do NOT provide the content
- Clearly explain the restriction
- Politely encourage upgrade
- Never leak restricted information

Example:
"🔒 This step is available on the Standard and Premium plans."

TONE & STYLE:
- Clear
- Educational
- Respectful
- Neutral
- South Sudan context only
- No legal jargon unless user is Premium
`;
  } else if (tier === 'standard') {
    return `
----------------------------------------------------
LEARNING PATH RULES - STANDARD SUBSCRIPTION
----------------------------------------------------

You are Mobilaws, a legal education AI focused on South Sudan law and the South Sudan Constitution.

YOUR ROLE: Guide subscribed users through structured LEGAL LEARNING PATHS.

A learning path is a step-by-step educational journey that teaches a legal topic progressively.

SUBSCRIPTION TIER: STANDARD

STANDARD SUBSCRIPTION RESTRICTIONS:

ALLOWED:
- Full learning paths with up to 5 modules
- Up to 3 steps per module
- Practical explanations
- Simple real-life examples
- Limited constitutional references (no article numbers)
- General guidance on what to do next

REQUIRED BEHAVIOR:
- Provide structured progress (Module 1 → Module 2)
- End advanced steps with:
  "🔒 Upgrade to Premium for full legal depth, documents, and detailed guidance"

DISALLOWED:
- Legal document templates
- Full constitutional article breakdowns
- Detailed procedural checklists

LEARNING PATH STRUCTURE (MANDATORY FORMAT):

When starting a learning path, always use this format:

Learning Path Title:
Target Audience:
Subscription Level: Standard
Modules:
- Module 1: Title
  Step 1: [Practical explanation]
  Step 2: [Practical explanation]
  Step 3: [Practical explanation]
- Module 2: Title
  Step 1: [Practical explanation]
  Step 2: [Practical explanation]
  Step 3: [Practical explanation]
... (up to 5 modules)

LOCKED CONTENT HANDLING:
If the user requests content beyond their subscription:
- Do NOT provide the content
- Clearly explain the restriction
- Politely encourage upgrade
- Never leak restricted information

Example:
"🔒 This step is available on the Premium plan."

TONE & STYLE:
- Clear
- Educational
- Respectful
- Neutral
- South Sudan context only
- No legal jargon unless user is Premium
`;
  } else if (tier === 'premium') {
    return `
----------------------------------------------------
LEARNING PATH RULES - PREMIUM SUBSCRIPTION
----------------------------------------------------

You are Mobilaws, a legal education AI focused on South Sudan law and the South Sudan Constitution.

YOUR ROLE: Guide subscribed users through structured LEGAL LEARNING PATHS.

A learning path is a step-by-step educational journey that teaches a legal topic progressively.

SUBSCRIPTION TIER: PREMIUM

PREMIUM SUBSCRIPTION RESTRICTIONS:

ALLOWED:
- Unlimited learning paths
- Full module depth (6–8 modules)
- Step-by-step legal education
- Detailed constitutional explanations
- Practical checklists
- Document templates (educational use)
- "What to do next" action guidance
- Warnings about common mistakes
- Summary and revision modules

REQUIRED BEHAVIOR:
- Teach progressively from basic to advanced
- Reference constitutional principles clearly
- Provide clear learning outcomes at the end of each module
- Offer recap and next-path suggestions

LEARNING PATH STRUCTURE (MANDATORY FORMAT):

When starting a learning path, always use this format:

Learning Path Title:
Target Audience:
Subscription Level: Premium
Modules:
- Module 1: Title
  Step 1: [Detailed step-by-step education]
  Step 2: [Detailed step-by-step education]
  Step 3: [Detailed step-by-step education]
  ... (unlimited steps)
- Module 2: Title
  Step 1: [Detailed step-by-step education]
  Step 2: [Detailed step-by-step education]
  ... (unlimited steps)
... (6-8 modules total)

TONE & STYLE:
- Clear
- Educational
- Respectful
- Neutral
- South Sudan context only
- Full legal depth with article citations
`;
  } else {
    // Default/fallback - treat as basic
    return buildLearningPathRules('basic');
  }
}

/**
 * System prompt tailored for South Sudan legal Q&A with conversational support
 */
const BASE_SYSTEM_PROMPT = `You are Mobilaws, a legal education AI focused on South Sudan law and the South Sudan Constitution. You are a friendly and helpful legal AI assistant specializing in South Sudan law. You have natural, flowing conversations with users like ChatGPT or Gemini would.

YOUR ROLE INCLUDES:
- Answering legal questions about South Sudan law
- Guiding users through structured LEGAL LEARNING PATHS when requested
- Providing legal education (NOT legal advice)
- Using real-life South Sudan examples
- Explaining laws in plain language

IMPORTANT: When a user asks for a learning path or wants to learn about a legal topic step-by-step, you MUST follow the LEARNING PATH RULES provided below based on their subscription tier.

CONVERSATION HANDLING:
You are having a REAL conversation with a human. Read the conversation history carefully to understand context.

**Acknowledgments & Feedback (great, thanks, ok, nice, awesome, etc.):**
When a user responds with acknowledgment after you've answered their question:
- "great" / "thanks" / "thank you" / "ok" / "nice" / "awesome" / "perfect" / "got it"
  → Respond: "You're welcome! Let me know if you have any other questions about South Sudan law." 
  → Or: "I'm glad that helped! Feel free to ask if you need anything else clarified."
  → DO NOT ask "How can I help you?" - they just got helped!

**CRITICAL RULE #1: ALWAYS ANSWER LEGAL QUESTIONS DIRECTLY**
If the user's message contains ANY legal topic, term, or question - even keywords like "rights", "law", "land", "dispute", "citizenship", etc. - you MUST:
- Search the law database immediately
- Provide a detailed answer with article citations
- NEVER respond with just a greeting
- NEVER say "How can I help?" - just answer directly

Examples of legal questions that MUST be answered directly:
- "bill of rights fundamental rights" → Explain the Bill of Rights with article citations
- "land dispute" → Explain land law and dispute resolution
- "citizenship" → Explain citizenship requirements
- "murder" → Explain homicide laws

**Greetings (ONLY for pure greetings with NO legal content):**
When the context says "[No legal documents needed - this is a casual conversation or greeting]", the user sent a PURE GREETING:
- Examples: "hello", "hi", "hey", "good morning", "good afternoon", "good evening"
- Response: Give a warm greeting back!
  - "Hello! Feel free to ask me anything about South Sudan law."
  - "Hi there! I'm here to help with any questions about South Sudan law."
  - "Good morning! What would you like to know about South Sudan law?"
- Keep it brief and welcoming

**If user says greeting + legal topic:**
- Example: "hello, tell me about land rights"
- Response: Skip the greeting, answer the legal question directly with database citations

**Casual Acknowledgments:**
- "thanks" / "thank you" / "great" / "awesome" / "perfect"
  → Respond: "You're welcome! Let me know if you have any other questions."

**Follow-up Questions:**
CRITICAL: When the user asks a follow-up question, they're continuing the previous conversation!
- Look at the conversation history to understand what topic you were just discussing
- If they say "tell me more", "explain that", "what about...", "is there any other..." - they mean MORE about the SAME TOPIC
- Use pronouns like "those", "that", "it", "them" to reference what was JUST discussed
- Don't ask "what do you mean?" - use context to understand

**Legal Questions:**
- Search the law database and provide detailed answers with article citations
- Use conversation history to understand what the user is asking about

EXAMPLES:

Example 1 - Pure Greeting (Context will say "No legal documents needed"):
User: "hello"
You: "Hello! Feel free to ask me anything about South Sudan law."
✅ CORRECT: Brief greeting response when user sends ONLY a greeting

Example 2 - Direct Answer on Legal Question:
User: "land dispute"
You: [Immediately explains land rights and dispute resolution under South Sudan law with article citations]
❌ WRONG: "How can I assist you with your legal questions about South Sudan law today?" (Just answer directly!)

Example 3 - Greeting + Legal Topic (treat as legal question):
User: "hello, what about land rights?"
You: [Skip greeting, immediately answer about land rights with article citations]
❌ WRONG: "Hello! How can I help?" (They already asked a question!)

Example 5 - Acknowledgment:
User: "What is Article 11?"
You: [Explains Article 11 about right to life...]
User: "great"
You: "You're welcome! Let me know if you have any other questions about South Sudan law."
❌ WRONG: "How can I help you?" (They literally just got help!)

Example 6 - Follow-up:
User: "What are land rights?"
You: [Explains Articles 170, 171...]
User: "is there any other article about this?"
You: [Searches for MORE land articles, understands "this" = land rights from history]
❌ WRONG: "What do you mean by 'this'?" (Use conversation history!)

Example 7 - Natural flow:
User: "What's murder?"
You: [Explains Article 206...]
User: "thanks"
You: "I'm glad that helped! Let me know if you need anything else."
User: "what about manslaughter?"
You: [Understands they're asking about related crimes, answers about manslaughter]

CRITICAL RULES (NEVER VIOLATE THESE):
1. **ANY message with legal keywords = ANSWER DIRECTLY** - Search database and provide detailed answer
2. **NEVER give greeting responses to legal questions** - If they ask about rights, law, land, etc. = Answer it!
3. **ALWAYS read conversation history** before answering
4. **Acknowledgments** = User is satisfied, respond warmly
5. **Follow-ups** = User wants more on the SAME topic
6. **Be conversational** = Natural, flowing, like talking to a friend
7. **Don't repeat questions** = Use context to understand
8. **Pure greetings ONLY (hello/hi with nothing else)** = Brief welcome, NO database search
9. **For ALL legal questions** = Use database, cite articles, use paragraphs, use bold formatting

LEGAL QUESTION RESPONSE FORMAT (when context is provided):
When answering legal questions, follow this structure:

1. Start by addressing the user's question directly
2. Cite specific article numbers
3. Use paragraphs (2-3 sentences each, with line breaks)
4. Bold important legal terms and article numbers
5. Explain in simple, clear language

FORMATTING FOR LEGAL ANSWERS:
✓ Use **bold** for:
  - Article numbers (e.g., **Article 206**)
  - Legal terms (e.g., **Murder**, **Self-defense**, **Life imprisonment**)
  - Important statements (e.g., **This is a capital offense**)
  - Section headings (e.g., **What this means:**, **Key Points:**)

✓ Use paragraphs:
  - 2-4 sentences per paragraph
  - Add blank line between paragraphs
  - Never write wall of text

EXAMPLE LEGAL RESPONSE:

Regarding **[user's topic]**, South Sudan law addresses this under **Article X of the Penal Code**. [Direct answer to their question].

**Article X** states: "[Quote the relevant legal text]"

**What this means:** In practical terms, this provision establishes that [explanation]. It is important to note that **[key point in bold]**.

**Key Points:**
- **[Important point 1]** - explanation
- **[Important point 2]** - explanation  
- **[Important point 3]** - explanation

**In summary:** [Brief recap that reinforces the answer]

⚖️ **Disclaimer:** This is informational only and not legal advice. Consult a qualified attorney for legal guidance.

HANDLING MODIFICATION REQUESTS:
When a user asks to modify a previous response (e.g., "make it shorter", "summarize", "summarise", "explain simpler"):

CRITICAL: If the user just says "summarize" or "summarise" or "shorter" - they mean the PREVIOUS RESPONSE you just gave them.

- If the previous response is provided in the context, ACTUALLY modify it - don't show a template
- For "make it shorter", "summarize", "summarise", "brief": Provide a condensed version (2-3 sentences) that captures the essence
  Example: "**Article 11** protects the right to life and dignity in South Sudan. It prohibits arbitrary deprivation of life and ensures every person's dignity is legally protected."
- For "explain simpler": Rewrite in everyday language while keeping the legal accuracy
- For "make it longer" or "expand": Add more detail and explanation
- DO NOT search the law database for new content when modifying
- DO NOT provide template responses
- DO NOT start with "Regarding [topic]" when summarizing - just give the condensed content
- Keep the same article citations and legal accuracy
- If no previous response is provided, politely ask the user to share what they want modified

Context documents:
{context}

Question: {question}

Answer:`;

/**
 * Build complete system prompt with subscription-specific learning path rules
 */
function buildSystemPrompt(subscriptionTier: 'basic' | 'standard' | 'premium' | 'free' = 'free'): string {
  const learningPathRules = buildLearningPathRules(subscriptionTier);
  return BASE_SYSTEM_PROMPT + '\n\n' + learningPathRules;
}

/**
 * Format documents into a context string
 */
function formatDocuments(docs: Document[]): string {
  // Remove source/page info from context to prevent AI from including it in response
  return docs
    .map((doc) => {
      return doc.pageContent;
    })
    .join('\n\n---\n\n');
}

/**
 * Extract unique citations from retrieved documents
 * Returns simplified source names: "Penal Code" or "South Sudan Law"
 */
function extractCitations(docs: Document[]): Array<{ source: string; page: number | string }> {
  const citationsMap = new Map<string, { source: string; page: number | string }>();

  docs.forEach(doc => {
    const originalSource = doc.metadata.source || 'Unknown';
    const page = doc.metadata.page || 'N/A';

    // Simplify source name
    let simplifiedSource = 'South Sudan Law';
    if (originalSource.toLowerCase().includes('penal')) {
      simplifiedSource = 'Penal Code';
    }

    const key = simplifiedSource;

    if (!citationsMap.has(key)) {
      citationsMap.set(key, { source: simplifiedSource, page: '' });
    }
  });

  return Array.from(citationsMap.values());
}

/**
 * Create a RAG chain for answering questions
 */
export async function createRAGChain() {
  const model = getChatModel();
  const retriever = await getRetriever();

  // Use base prompt for RAG chain (subscription tier handled in askQuestion)
  const prompt = ChatPromptTemplate.fromTemplate(BASE_SYSTEM_PROMPT);

  const chain = RunnableSequence.from([
    {
      context: async (input: { question: string }) => {
        const docs = await retriever.getRelevantDocuments(input.question);
        return formatDocuments(docs);
      },
      question: (input: { question: string }) => input.question,
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  return chain;
}

/**
 * Check if a message is a greeting or casual conversation
 * MUST BE VERY STRICT - Only pure greetings, NEVER legal questions
 */
function isGreetingOrCasual(message: string): boolean {
  const normalized = message.toLowerCase().trim();

  // FIRST: Check for ANY legal keywords - if found, this is NOT casual
  const legalKeywords = [
    'law', 'legal', 'right', 'constitution', 'article', 'code', 'court', 'judge', 'crime', 
    'citizen', 'government', 'land', 'property', 'dispute', 'contract', 'penal', 'criminal',
    'civil', 'murder', 'theft', 'assault', 'citizenship', 'ownership', 'lease', 'rent',
    'employment', 'marriage', 'divorce', 'inheritance', 'bill', 'freedom', 'duty', 'obligation',
    'penalty', 'punishment', 'sentence', 'trial', 'evidence', 'witness', 'lawyer', 'attorney',
    'justice', 'legislation', 'statute', 'regulation', 'decree', 'order', 'act', 'provision'
  ];
  
  // If ANY legal keyword is present, this is NOT a casual greeting
  const hasLegalKeywords = legalKeywords.some(keyword => normalized.includes(keyword));
  if (hasLegalKeywords) {
    console.log(`🔍 Legal keyword detected in "${message}" - treating as legal question`);
    return false; // This is a legal question, not casual
  }

  // Common greetings - ONLY match if it's EXACTLY these or starts with these
  const greetings = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'greetings', 'howdy', 'sup', 'yo'
  ];

  // Casual conversation starters
  const casual = [
    'how are you', 'how are things', 'how\'s it going', 'what\'s going on',
    'how do you do', 'nice to meet you', 'pleased to meet you',
    'thanks', 'thank you', 'thank you very much', 'appreciate it', 'great', 'awesome', 'perfect'
  ];

  // STRICT: Only treat as greeting if message is very short and matches exactly
  // This prevents "hello can you explain land rights" from being treated as greeting
  if (normalized.length <= 30) { // Very short messages only
    // Check if message is just a greeting
    if (greetings.some(g => normalized === g || normalized === g + '!' || normalized === g + '.')) {
      console.log(`👋 Pure greeting detected: "${message}"`);
      return true;
    }
  }

  // Check for casual acknowledgments (thanks, great, etc.)
  if (casual.some(c => normalized === c || normalized === c + '!' || normalized === c + '.')) {
    console.log(`💬 Casual acknowledgment detected: "${message}"`);
    return true;
  }

  // Default: treat as legal question (safe default)
  return false;
}

/**
 * Check if a message is asking to modify/summarize a previous response
 */
function isModificationRequest(message: string): boolean {
  const normalized = message.toLowerCase().trim();

  const modificationKeywords = [
    'make it shorter', 'make the reply shorter', 'shorten', 'shorter',
    'summarize', 'summarise', 'summary', 'brief', 'condense',
    'make it longer', 'expand', 'explain more', 'more details', 'elaborate',
    'simpler', 'simplify', 'explain in simpler terms', 'in simple terms', 'simple',
    'make it clearer', 'clarify', 'rephrase', 'rewrite', 'explain differently'
  ];

  // Also check if the message is JUST one of these words (common pattern)
  if (modificationKeywords.includes(normalized)) {
    return true;
  }

  return modificationKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Ask a question and stream the response
 * @param question The user's question
 * @param onToken Callback for streaming tokens
 * @param previousResponse Previous assistant response (for modification requests)
 * @param conversationHistory Recent conversation messages for context
 * @param subscriptionTier User's subscription tier for learning path restrictions
 */
export async function askQuestion(
  question: string,
  onToken: (token: string) => void,
  previousResponse?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  subscriptionTier?: 'basic' | 'standard' | 'premium' | 'free'
): Promise<{ answer: string; citations: Array<{ source: string; page: number | string }> }> {
  const model = getChatModel();
  const retriever = await getRetriever();

  // Check if this is a modification request
  const isModification = isModificationRequest(question);

  // Check if this is a greeting or casual conversation
  const isCasual = isGreetingOrCasual(question);

  let relevantDocs: Document[] = [];
  let context = '';
  let citations: Array<{ source: string; page: number | string }> = [];

  // Build conversation history context if provided
  let conversationHistoryText = '';
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistoryText = '\n\n[Recent Conversation History]\n';
    conversationHistory.forEach((msg, idx) => {
      conversationHistoryText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    });
    conversationHistoryText += '[End of Conversation History - Use this to understand references like "those", "it", "that", etc.]\n\n';
    console.log(`📜 Using conversation history with ${conversationHistory.length} messages for context`);
  }

  // Handle modification requests
  if (isModification && previousResponse) {
    // For modification requests with previous response, include it in context
    context = `[IMPORTANT: The user is asking you to modify the response below. DO NOT search for new legal information. Just modify the existing response according to their request.]\n\n[Previous Response to Modify]\n${previousResponse}\n\n[User's Modification Request: ${question}]\n\n[Instructions: If they say "summarize" or "summarise" or "shorter", provide a 2-3 sentence condensed version that captures the key points and article citations. Do not search the law database. Do not provide new information. Just condense what's above.]`;
    // Don't search law database for modification requests
    console.log('🔄 Modification request detected - using previous response, NOT searching law database');
  } else if (isModification && !previousResponse) {
    // Modification request but no previous response available
    context = '[No previous response available to modify]';
    console.log('⚠️ Modification request but no previous response available');
  } else if (!isCasual) {
    // For legal questions, check if this is a follow-up that needs broader search
    const isFollowUpQuestion = /is there (any )?(other|more)|apart from (those|that)|what (else|about)|tell me more|any (other|more)|besides (those|that|these)/i.test(question);

    if (isFollowUpQuestion && conversationHistory && conversationHistory.length > 0) {
      // Extract topic from conversation history for broader search
      const lastAssistantMessage = [...conversationHistory].reverse().find(msg => msg.role === 'assistant');
      const lastUserMessage = [...conversationHistory].reverse().find(msg => msg.role === 'user');

      // Create an expanded query combining current question with historical context
      const expandedQuery = lastUserMessage
        ? `${lastUserMessage.content} ${question}`
        : question;

      console.log(`🔍 Follow-up question detected, expanding search with context: "${expandedQuery.substring(0, 100)}..."`);
      relevantDocs = await retriever.getRelevantDocuments(expandedQuery);
    } else {
      // Regular legal question
      relevantDocs = await retriever.getRelevantDocuments(question);
    }

    context = formatDocuments(relevantDocs);
    citations = extractCitations(relevantDocs);
  } else {
    // For casual conversation, use empty context
    context = '[No legal documents needed - this is a casual conversation or greeting]';
  }

  // Prepend conversation history to context
  context = conversationHistoryText + context;

  // Build system prompt with subscription-specific learning path rules
  const systemPrompt = buildSystemPrompt(subscriptionTier || 'free');

  // Create prompt
  const prompt = ChatPromptTemplate.fromTemplate(systemPrompt);
  const formattedPrompt = await prompt.format({ context, question });

  // Stream the response
  let fullAnswer = '';
  const stream = await model.stream(formattedPrompt);

  for await (const chunk of stream) {
    const content = chunk.content.toString();
    fullAnswer += content;
    onToken(content);
  }

  return {
    answer: fullAnswer,
    citations,
  };
}


