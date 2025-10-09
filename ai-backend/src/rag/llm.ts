import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../env';

/**
 * Create and return a configured OpenAI chat model instance
 */
export function getChatModel(): ChatOpenAI {
  return new ChatOpenAI({
    openAIApiKey: env.OPENAI_API_KEY,
    modelName: env.LLM_MODEL,
    temperature: env.TEMPERATURE,
    maxTokens: env.MAX_TOKENS,
    streaming: true,
  });
}

/**
 * Create and return a configured OpenAI embeddings instance
 */
export function getEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    openAIApiKey: env.OPENAI_API_KEY,
    modelName: env.EMBED_MODEL,
  });
}


