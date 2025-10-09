// AI Chat Service - Now integrated with Fastbots
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIStreamResponse {
  type: 'content' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolCall?: any;
  toolResult?: any;
  error?: string;
}

export class AIChatService {
  private botId: string = 'cmgc1bkqx06r7p31l972xran2';
  private isConnected: boolean = false;
  private fastbotsApiUrl: string = 'https://api.fastbots.ai';

  constructor() {
    // Fastbots is now the primary service
    this.checkFastbotsConnection();
  }

  private async checkFastbotsConnection(): Promise<void> {
    // Check if Fastbots embed script is loaded
    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).fastbots) {
        this.isConnected = true;
        clearInterval(checkInterval);
        console.log('Fastbots connected successfully');
      }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.isConnected) {
        console.log('Fastbots widget not detected, using direct API approach');
        this.isConnected = true; // Still allow API calls
      }
    }, 10000);
  }

  async testConnection(): Promise<boolean> {
    // Fastbots is always considered "connected" since we're using the embed script
    // The embed script will handle the actual connection
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        console.log('Fastbots AI Service: Ready');
        resolve(true);
      }, 1000);
    });
  }

  async *streamChat(messages: AIMessage[]): AsyncGenerator<AIStreamResponse, void, unknown> {
    if (!this.isConnected) {
      await this.testConnection();
    }

    try {
      // Extract the user's question (last message)
      const userMessage = messages[messages.length - 1]?.content || '';
      
      // Try to use Fastbots widget API if available
      if (typeof window !== 'undefined' && (window as any).fastbots?.sendMessage) {
        try {
          const response = await (window as any).fastbots.sendMessage(userMessage);
          yield { type: 'content', content: response };
          yield { type: 'done' };
          return;
        } catch (widgetError) {
          console.log('Fastbots widget API not available');
        }
      }

      // For now, the Fastbots public API is not available
      // Provide a helpful message directing users to the widget
      throw new Error('FASTBOTS_WIDGET_REQUIRED');

    } catch (error) {
      console.error('Fastbots chat error:', error);
      
      // Special handling for CORS/API access errors
      if (error instanceof Error && 
          (error.message === 'FASTBOTS_WIDGET_REQUIRED' || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('CORS'))) {
        yield {
          type: 'error',
          error: 'WIDGET_ONLY'
        };
      } else {
        yield {
          type: 'error',
          error: error instanceof Error ? error.message : 'An unexpected error occurred.'
        };
      }
    }
  }

  async sendMessage(message: string, conversationHistory: AIMessage[] = []): Promise<string> {
    const messages: AIMessage[] = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    let fullResponse = '';
    
    for await (const chunk of this.streamChat(messages)) {
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

// Create a singleton instance for Fastbots integration
export const aiChatService = new AIChatService();

// Extend window interface for Fastbots
declare global {
  interface Window {
    fastbots?: {
      sendMessage?: (message: string) => Promise<string>;
      open?: () => void;
      close?: () => void;
    };
  }
}
