import { Document } from '@langchain/core/documents';
import { VectorStore } from '@langchain/core/vectorstores';
import { Chroma } from '@langchain/community/vectorstores/chroma';
// import { PineconeStore } from '@langchain/pinecone';
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';
// import { Pinecone } from '@pinecone-database/pinecone';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../env';
import { getEmbeddings } from './llm';

let vectorStoreInstance: VectorStore | null = null;

/**
 * Initialize and return the configured vector store
 */
export async function getVectorStore(): Promise<VectorStore> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  const embeddings = getEmbeddings();

  switch (env.VECTOR_BACKEND) {
    case 'chroma': {
      console.log('🔷 Initializing Chroma vector store...');
      vectorStoreInstance = await Chroma.fromExistingCollection(embeddings, {
        collectionName: 'mobilaws_legal',
        url: 'http://localhost:8000', // Chroma default port
        collectionMetadata: {
          'hnsw:space': 'cosine',
        },
      });
      break;
    }

    case 'pinecone': {
      console.log('🔷 Initializing Pinecone vector store...');
      if (!env.PINECONE_API_KEY || !env.PINECONE_ENV || !env.PINECONE_INDEX) {
        throw new Error('Pinecone configuration incomplete');
      }

      // Pinecone integration temporarily disabled due to package issues
      // TODO: Fix Pinecone integration when @langchain/pinecone is available
      throw new Error('Pinecone integration temporarily disabled. Please use Chroma or Qdrant.');
      break;
    }

    case 'qdrant': {
      console.log('🔷 Initializing Qdrant vector store...');
      if (!env.QDRANT_URL) {
        throw new Error('Qdrant URL not configured');
      }

      const client = new QdrantClient({
        url: env.QDRANT_URL,
        apiKey: env.QDRANT_API_KEY,
      });

      // Ensure collection exists
      try {
        await client.getCollection(env.QDRANT_COLLECTION);
      } catch (error) {
        // Create collection if it doesn't exist
        await client.createCollection(env.QDRANT_COLLECTION, {
          vectors: {
            size: 3072, // text-embedding-3-large dimension
            distance: 'Cosine',
          },
        });
      }

      vectorStoreInstance = await QdrantVectorStore.fromExistingCollection(embeddings, {
        client,
        collectionName: env.QDRANT_COLLECTION,
      });
      break;
    }

    default:
      throw new Error(`Unsupported vector backend: ${env.VECTOR_BACKEND}`);
  }

  console.log(`✅ Vector store (${env.VECTOR_BACKEND}) initialized`);
  
  if (!vectorStoreInstance) {
    throw new Error('Vector store not initialized');
  }
  return vectorStoreInstance;
}

/**
 * Add documents to the vector store
 */
export async function upsertDocuments(docs: Document[]): Promise<number> {
  const vectorStore = await getVectorStore();
  
  console.log(`📥 Upserting ${docs.length} documents to vector store...`);
  
  await vectorStore.addDocuments(docs);
  
  console.log(`✅ Successfully indexed ${docs.length} chunks`);
  
  return docs.length;
}

/**
 * Get a retriever instance for similarity search
 */
export async function getRetriever(k?: number) {
  const vectorStore = await getVectorStore();
  return vectorStore.asRetriever({
    k: k || env.TOP_K,
  });
}

/**
 * Perform similarity search
 */
export async function similaritySearch(query: string, k?: number): Promise<Document[]> {
  const vectorStore = await getVectorStore();
  return vectorStore.similaritySearch(query, k || env.TOP_K);
}

