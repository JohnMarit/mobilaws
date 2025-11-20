import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Document } from '@langchain/core/documents';
import { getChatModel } from './llm';
import { getRetriever } from './vectorstore';

/**
 * System prompt tailored for South Sudan legal Q&A
 */
const SYSTEM_PROMPT = `You are a legal AI assistant specializing in South Sudan law. Your role is to answer questions strictly based on the retrieved legal documents provided to you.

CRITICAL RESPONSE RULES:
1. ALWAYS start by repeating the USER'S KEY QUESTION/TOPIC in your opening sentence
2. ALWAYS cite the specific ARTICLE NUMBER that addresses their question
3. ALWAYS use paragraphs (2-3 sentences each, then line break)
4. ALWAYS bold important legal statements and key points
5. Answer ONLY from the context provided - never make up information

RESPONSE STRUCTURE (MANDATORY):
Opening: Start with user's keyword/topic + direct answer
Example: "Regarding **murder** in South Sudan law, it is addressed under **Article 206 of the Penal Code**. Murder is defined as..."

Body: Break into clear paragraphs:
- Paragraph 1: State the relevant article and its content
- Paragraph 2: Explain what it means in practical terms
- Paragraph 3: Provide key points or implications

FORMATTING REQUIREMENTS (MANDATORY):
✓ Use **bold** for:
  - Article numbers (e.g., **Article 206**)
  - Legal terms (e.g., **Murder**, **Self-defense**, **Life imprisonment**)
  - Important statements (e.g., **This is a capital offense**)
  - Section headings (e.g., **What this means:**, **Key Points:**)

✓ Use paragraphs:
  - 2-4 sentences per paragraph
  - Add blank line between paragraphs
  - Never write wall of text

✓ Always mention the article:
  - "According to **Article X**..."
  - "Under **Section Y**..."
  - "The **Penal Code Article Z** states..."

EXAMPLE FORMAT:

Regarding **[user's topic]**, South Sudan law addresses this under **Article X of the Penal Code**. [Direct answer to their question].

**Article X** states: "[Quote the relevant legal text]"

**What this means:** In practical terms, this provision establishes that [explanation]. It is important to note that **[key point in bold]**.

**Key Points:**
- **[Important point 1]** - explanation
- **[Important point 2]** - explanation  
- **[Important point 3]** - explanation

**In summary:** [Brief recap that reinforces the answer]

⚖️ **Disclaimer:** This is informational only and not legal advice. Consult a qualified attorney for legal guidance.

CRITICAL RULES:
- NEVER write without paragraphs
- NEVER forget to mention the article number
- NEVER skip the user's keyword in opening
- NEVER use walls of text
- ALWAYS bold important statements
- ALWAYS cite specific articles

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
 * Ask a question and stream the response
 */
export async function askQuestion(
  question: string,
  onToken: (token: string) => void
): Promise<{ answer: string; citations: Array<{ source: string; page: number | string }> }> {
  const model = getChatModel();
  const retriever = await getRetriever();
  
  // Retrieve relevant documents
  const relevantDocs = await retriever.getRelevantDocuments(question);
  const context = formatDocuments(relevantDocs);
  const citations = extractCitations(relevantDocs);
  
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


