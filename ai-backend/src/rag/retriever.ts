import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Document } from '@langchain/core/documents';
import { getChatModel } from './llm';
import { getRetriever } from './vectorstore';

/**
 * System prompt tailored for South Sudan legal Q&A with conversational support
 */
const SYSTEM_PROMPT = `You are a friendly and helpful legal AI assistant specializing in South Sudan law. You have natural, flowing conversations with users like ChatGPT or Gemini would.

CONVERSATION HANDLING:
You are having a REAL conversation with a human. Read the conversation history carefully to understand context.

**Acknowledgments & Feedback (great, thanks, ok, nice, awesome, etc.):**
When a user responds with acknowledgment after you've answered their question:
- "great" / "thanks" / "thank you" / "ok" / "nice" / "awesome" / "perfect" / "got it"
  → Respond: "You're welcome! Let me know if you have any other questions about South Sudan law." 
  → Or: "I'm glad that helped! Feel free to ask if you need anything else clarified."
  → DO NOT ask "How can I help you?" - they just got helped!

**Greetings:**
- "hello" / "hi" / "hey" / "good morning" / "good afternoon" / "good evening"
  → Respond warmly and naturally, ask how you can help with legal questions

**Casual Conversation:**
- "how are you?" / "what's up?" / "how's it going?"
  → Be friendly, then offer to help with legal matters

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

Example 1 - Acknowledgment:
User: "What is Article 11?"
You: [Explains Article 11 about right to life...]
User: "great"
You: "You're welcome! Feel me know if you have any other questions about South Sudan law."
❌ WRONG: "How can I help you?" (They literally just got help!)

Example 2 - Follow-up:
User: "What are land rights?"
You: [Explains Articles 170, 171...]
User: "is there any other article about this?"
You: [Searches for MORE land articles, understands "this" = land rights from history]
❌ WRONG: "What do you mean by 'this'?" (Use conversation history!)

Example 3 - Natural flow:
User: "What's murder?"
You: [Explains Article 206...]
User: "thanks"
You: "I'm glad that helped! Let me know if you need anything else."
User: "what about manslaughter?"
You: [Understands they're asking about related crimes, answers about manslaughter]

CRITICAL RULES:
1. **ALWAYS read conversation history** before answering
2. **Acknowledgments** = User is satisfied, respond warmly
3. **Follow-ups** = User wants more on the SAME topic
4. **Be conversational** = Natural, flowing, like talking to a friend
5. **Don't repeat questions** = Use context to understand
6. **For greetings/thanks** = NO need to search law database
7. **For legal questions** = Use database, cite articles, use paragraphs

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

  const prompt = ChatPromptTemplate.fromTemplate(SYSTEM_PROMPT);

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
 */
function isGreetingOrCasual(message: string): boolean {
  const normalized = message.toLowerCase().trim();

  // Common greetings
  const greetings = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'greetings', 'howdy', 'what\'s up', 'sup', 'yo', 'hola', 'bonjour'
  ];

  // Casual conversation starters
  const casual = [
    'how are you', 'how are things', 'how\'s it going', 'what\'s going on',
    'how do you do', 'nice to meet you', 'pleased to meet you',
    'thanks', 'thank you', 'thank you very much', 'appreciate it'
  ];

  // Check if message is just a greeting or casual chat
  if (greetings.some(g => normalized === g || normalized.startsWith(g + ' '))) {
    return true;
  }

  if (casual.some(c => normalized.includes(c))) {
    // Only treat as casual if it's short and doesn't contain legal keywords
    const legalKeywords = ['law', 'legal', 'right', 'constitution', 'article', 'code', 'court', 'judge', 'crime', 'citizen', 'government'];
    const hasLegalKeywords = legalKeywords.some(keyword => normalized.includes(keyword));

    if (!hasLegalKeywords && normalized.length < 100) {
      return true;
    }
  }

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
 */
export async function askQuestion(
  question: string,
  onToken: (token: string) => void,
  previousResponse?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
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

  // Create prompt
  const prompt = ChatPromptTemplate.fromTemplate(SYSTEM_PROMPT);
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


