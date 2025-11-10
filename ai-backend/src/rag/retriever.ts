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
- When referencing sources, mention the document name and page number.

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
  return docs
    .map((doc, idx) => {
      const source = doc.metadata.source || 'Unknown';
      const page = doc.metadata.page || 'N/A';
      return `[${idx + 1}] Source: ${source} (Page ${page})\n${doc.pageContent}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Extract unique citations from retrieved documents
 */
function extractCitations(docs: Document[]): Array<{ source: string; page: number | string }> {
  const citationsMap = new Map<string, { source: string; page: number | string }>();
  
  docs.forEach(doc => {
    const source = doc.metadata.source || 'Unknown';
    const page = doc.metadata.page || 'N/A';
    const key = `${source}:${page}`;
    
    if (!citationsMap.has(key)) {
      citationsMap.set(key, { source, page });
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


