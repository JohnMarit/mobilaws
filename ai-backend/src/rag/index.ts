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
 * Processes files one at a time to handle large files efficiently
 */
export async function ingest(filePaths: string[]): Promise<number> {
  try {
    console.log(`\n📥 Starting ingestion of ${filePaths.length} files...`);

    let totalChunks = 0;
    const BATCH_SIZE = 50; // Process chunks in batches to avoid memory issues

    // Process files one at a time to handle large files
    for (const filePath of filePaths) {
      console.log(`\n📄 Processing: ${filePath}`);

      try {
        // Load single file
        const { loadFile } = await import('./loaders');
        const documents = await loadFile(filePath);

        if (documents.length === 0) {
          console.warn(`⚠️  No documents loaded from ${filePath}`);
          continue;
        }

        // Split documents into chunks
        const chunks = await splitDocuments(documents);

        if (chunks.length === 0) {
          console.warn(`⚠️  No chunks created from ${filePath}`);
          continue;
        }

        // Upsert chunks in batches to avoid payload size limits
        console.log(`📦 Upserting ${chunks.length} chunks in batches of ${BATCH_SIZE}...`);

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE);
          const batchCount = await upsertDocuments(batch);
          totalChunks += batchCount;

          console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchCount} chunks indexed`);
        }

        console.log(`✅ Completed: ${filePath} (${chunks.length} chunks indexed)`);
      } catch (fileError) {
        console.error(`❌ Error processing ${filePath}:`, fileError);
        // Continue with next file instead of failing completely
        continue;
      }
    }

    console.log(`\n✅ Ingestion complete: ${totalChunks} total chunks indexed from ${filePaths.length} files\n`);

    return totalChunks;
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
  onToken: (token: string) => void,
  previousResponse?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ citations: Array<{ source: string; page: number | string }> }> {
  try {
    const result = await askQuestion(message, onToken, previousResponse, conversationHistory);
    return { citations: result.citations };
  } catch (error) {
    console.error('❌ Question answering failed:', error);
    throw error;
  }
}

