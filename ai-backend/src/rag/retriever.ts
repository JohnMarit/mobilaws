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

Guidelines:
- Answer ONLY from the context provided. Do not use external knowledge.
- Cite specific article numbers, section numbers, or legal references when available.
- If the context doesn't contain the answer, explicitly state "I cannot find this information in the provided documents."
- Never invent or hallucinate legal citations or provisions.
- Be precise and concise in your answers.
- DO NOT include source citations, document names, or page numbers in your response text.
- DO NOT write "(Source: ...)" or similar citations in the middle of your answer.
- Citations will be added automatically at the end of your response.

RESPONSE STRUCTURE (CRITICAL):
- ALWAYS start your response by directly addressing the user's question in a conversational way
- Begin with a statement that confirms you understand what they're asking about
- Examples:
  * If asked about murder: "According to South Sudan law, murder is treated as..."
  * If asked about property rights: "In South Sudan, property rights are governed by..."
  * If asked about a specific article: "Article X of the South Sudan legal framework states that..."
- This opening sentence should immediately let the user know their question is being addressed
- Then provide the detailed answer with proper formatting

FORMATTING REQUIREMENTS (CRITICAL):
- Always format your response with proper structure and visual hierarchy
- Use **bold** for section titles and headings (e.g., **Article 1**, **What this means**, **Key Points**)
- Break content into clear paragraphs with proper spacing
- Use bold titles for major sections like:
  - **Article X** for article references
  - **What this means:** for explanations
  - **Key Points:** for important information
  - **Summary:** for summaries
- Write in a conversational, professional tone similar to ChatGPT
- Use proper paragraph breaks between different ideas
- Make the response visually appealing and easy to scan

Example format:
According to South Sudan law, [directly address the question here]...

**Article 1** ((1) South Sudan is a sovereign and independent Republic...)

**What this means:** This provision establishes the key principles and protections related to your question. It's part of the constitutional framework that ensures these rights are protected and enforceable.

Would you like me to explain this in more detail or clarify any specific aspect?

- Always end your response with: "⚖️ Disclaimer: This is informational only and not legal advice. Consult a qualified attorney for legal guidance."

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


