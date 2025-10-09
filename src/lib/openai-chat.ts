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
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    console.log('Checking for OpenAI API key...');
    console.log('API key found:', !!apiKey);
    console.log('API key starts with sk-:', apiKey?.startsWith('sk-'));
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      console.warn('OpenAI API key format is invalid. Should start with "sk-"');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for browser usage
      });
      this.isConnected = true;
      console.log('OpenAI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      this.isConnected = false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConnected || !this.openai) {
      console.log('OpenAI not initialized or API key missing');
      return false;
    }

    // Check if API key is valid format
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.log('Invalid API key format');
      return false;
    }

    console.log('OpenAI connection test passed');
    return true;
  }

  async *streamChat(messages: OpenAIMessage[], lawContext?: string): AsyncGenerator<OpenAIStreamResponse, void, unknown> {
    if (!this.isConnected || !this.openai) {
      yield {
        type: 'error',
        error: 'OpenAI service is not available. Please check your API key.'
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
  }

  async sendMessage(message: string, conversationHistory: OpenAIMessage[] = [], lawContext?: string): Promise<string> {
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
  }
}

// Create singleton instance
export const openaiChatService = new OpenAIChatService();
