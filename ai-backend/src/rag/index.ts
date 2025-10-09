import fs from 'fs';
import { loadFiles } from './loaders';
import { splitDocuments } from './splitter';
import { upsertDocuments, similaritySearch } from './vectorstore';
import { askQuestion } from './retriever';
import { env } from '../env';

/**
 * Ensure storage directories exist
 */
export function ensureStorageDirectories(): void {
  if (!fs.existsSync(env.docsPath)) {
    fs.mkdirSync(env.docsPath, { recursive: true });
    console.log(`✅ Created documents directory: ${env.docsPath}`);
  }
  
  // Chroma directory is handled by Chroma itself
  if (env.VECTOR_BACKEND === 'chroma' && !fs.existsSync(env.chromaPath)) {
    fs.mkdirSync(env.chromaPath, { recursive: true });
    console.log(`✅ Created Chroma directory: ${env.chromaPath}`);
  }
}

/**
 * Ingest documents into the vector store
 */
export async function ingest(filePaths: string[]): Promise<number> {
  try {
    console.log(`\n📥 Starting ingestion of ${filePaths.length} files...`);
    
    // Load documents
    const documents = await loadFiles(filePaths);
    
    if (documents.length === 0) {
      console.warn('⚠️  No documents loaded');
      return 0;
    }
    
    // Split documents into chunks
    const chunks = await splitDocuments(documents);
    
    if (chunks.length === 0) {
      console.warn('⚠️  No chunks created');
      return 0;
    }
    
    // Upsert to vector store
    const count = await upsertDocuments(chunks);
    
    console.log(`✅ Ingestion complete: ${count} chunks indexed\n`);
    
    return count;
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    throw error;
  }
}

/**
 * Search for relevant document chunks
 */
export async function search(
  query: string,
  k?: number
): Promise<Array<{
  text: string;
  source: string;
  page: number | string;
  title?: string;
}>> {
  try {
    const results = await similaritySearch(query, k);
    
    return results.map(doc => ({
      text: doc.pageContent,
      source: doc.metadata.source || 'Unknown',
      page: doc.metadata.page || 'N/A',
      title: doc.metadata.title,
    }));
  } catch (error) {
    console.error('❌ Search failed:', error);
    throw error;
  }
}

/**
 * Ask a question with streaming response
 */
export async function ask(
  message: string,
  onToken: (token: string) => void
): Promise<{ citations: Array<{ source: string; page: number | string }> }> {
  try {
    const result = await askQuestion(message, onToken);
    return { citations: result.citations };
  } catch (error) {
    console.error('❌ Question answering failed:', error);
    throw error;
  }
}

