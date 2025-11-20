// OpenAI Chat Service for real AI reasoning
import OpenAI from 'openai';

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIStreamResponse {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

export class OpenAIChatService {
  private openai: OpenAI | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    // SECURITY: OpenAI API keys should NEVER be in frontend code!
    // This service is disabled - all OpenAI calls go through the secure backend
    // DO NOT set VITE_OPENAI_API_KEY in frontend environment variables
    
    console.warn('⚠️ OpenAIChatService is disabled for security. All AI requests go through the secure backend.');
    this.isConnected = false;
    return;
    
    /* SECURITY FIX: Disabled frontend OpenAI usage
    // OpenAI API keys should only be used in backend, never in frontend
    // If you need OpenAI, use the backend API endpoint instead
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. Using secure backend instead.');
      return;
    }

    // DO NOT USE - This would expose your API key to hackers!
    // All OpenAI calls should go through: https://mobilaws-ympe.vercel.app/api/chat
    */
  }

  async testConnection(): Promise<boolean> {
    // SECURITY: This service is disabled - use backend instead
    console.warn('⚠️ OpenAIChatService is disabled. Use backend API for secure AI requests.');
    return false;
    
    /* SECURITY FIX: Disabled for security
    // All OpenAI calls should go through the secure backend
    // Frontend should never have direct access to OpenAI API keys
    */
  }

  async *streamChat(messages: OpenAIMessage[], lawContext?: string): AsyncGenerator<OpenAIStreamResponse, void, unknown> {
    // SECURITY: This service is disabled - use backend instead
    yield {
      type: 'error',
      error: '⚠️ This service is disabled for security. All AI requests must go through the secure backend API.'
    };
    return;
    
    /* SECURITY FIX: Disabled for security
    // OpenAI API keys should NEVER be exposed in frontend
    // Use backend endpoint: POST /api/chat
    if (!this.isConnected || !this.openai) {
      yield {
        type: 'error',
        error: 'OpenAI service is not available. Please use the secure backend API.'
      };
      return;
    }

    try {
      // Prepare system message with law context
      const systemMessage: OpenAIMessage = {
        role: 'system',
        content: `You are a helpful South Sudan law assistant. You have access to the following legal information:

${lawContext || 'South Sudan Constitution and legal provisions'}

Instructions:
- Answer questions about South Sudan law in a clear, conversational way
- Explain legal concepts in simple terms
- Reference specific articles when relevant
- Be helpful and accurate
- If you don't know something, say so rather than guessing
- Use a friendly, professional tone like ChatGPT`
      };

      const allMessages = [systemMessage, ...messages];

      const stream = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: allMessages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield {
            type: 'content',
            content: content
          };
        }
      }

      yield { type: 'done' };
    } catch (error) {
      // SECURITY: This code is disabled - errors won't occur
      console.error('OpenAI stream error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'Failed to get AI response';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Invalid API key. Please check your OpenAI API key.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'API quota exceeded. Please check your OpenAI billing.';
        } else {
          errorMessage = `OpenAI error: ${error.message}`;
        }
      }
      
      yield {
        type: 'error',
        error: errorMessage
      };
    }
    */
  }

  async sendMessage(message: string, conversationHistory: OpenAIMessage[] = [], lawContext?: string): Promise<string> {
    // SECURITY: This service is disabled - use backend instead
    throw new Error('⚠️ This service is disabled for security. Use the secure backend API: POST /api/chat');
    
    /* SECURITY FIX: Disabled for security
    // All OpenAI calls should go through the secure backend
    // Frontend should never have direct access to OpenAI API keys
    const messages: OpenAIMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    let fullResponse = '';
    
    for await (const chunk of this.streamChat(messages, lawContext)) {
      if (chunk.type === 'content' && chunk.content) {
        fullResponse += chunk.content;
      } else if (chunk.type === 'error') {
        throw new Error(chunk.error || 'Unknown error');
      } else if (chunk.type === 'done') {
        break;
      }
    }

    return fullResponse;
    */
  }
}

// SECURITY NOTE: This service is disabled to prevent API key exposure
// All OpenAI requests should go through the secure backend: /api/chat
// Create singleton instance (disabled for security)
export const openaiChatService = new OpenAIChatService();
