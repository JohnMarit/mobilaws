import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { env } from '../env';

/**
 * Create a text splitter configured for legal documents
 */
export function getTextSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: env.CHUNK_SIZE,
    chunkOverlap: env.CHUNK_OVERLAP,
    separators: ['\n\n', '\n', '. ', ' ', ''],
    keepSeparator: true,
  });
}

/**
 * Split documents into chunks with metadata preservation
 */
export async function splitDocuments(documents: Document[]): Promise<Document[]> {
  const splitter = getTextSplitter();
  const chunks = await splitter.splitDocuments(documents);
  
  console.log(`📄 Split ${documents.length} documents into ${chunks.length} chunks`);
  
  return chunks;
}


