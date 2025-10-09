// Secure Backend Service - Connects to RAG backend (no exposed API keys)

export interface BackendMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BackendStreamResponse {
  type: 'token' | 'done' | 'error' | 'metadata';
  text?: string;
  citations?: Array<{ source: string; page: number | string }>;
  error?: string;
  metadata?: any;
}

export interface SearchResult {
  rank: number;
  source: string;
  page: number | string;
  title?: string;
  text: string;
}

export interface UploadResult {
  success: boolean;
  files: Array<{
    originalName: string;
    savedName: string;
    size: number;
    path: string;
  }>;
  indexed_chunks: number;
}

export class BackendService {
  private baseUrl: string;
  private isConnected: boolean = false;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/healthz`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isConnected = data.ok === true;
        console.log('✅ Backend connected:', this.baseUrl);
      }
    } catch (error) {
      console.warn('⚠️ Backend not connected. Make sure the backend server is running.');
      this.isConnected = false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/healthz`);
      const data = await response.json();
      this.isConnected = data.ok === true;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Stream chat responses with SSE
   */
  async *streamChat(
    message: string,
    convoId?: string
  ): AsyncGenerator<BackendStreamResponse, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message,
          convoId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.slice(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              
              // Handle different event types
              if (data.text !== undefined) {
                yield {
                  type: 'token',
                  text: data.text,
                };
              } else if (data.citations !== undefined) {
                yield {
                  type: 'done',
                  citations: data.citations,
                };
              } else if (data.message) {
                // Error message
                yield {
                  type: 'error',
                  error: data.message,
                };
              } else if (data.convoId !== undefined) {
                // Metadata
                yield {
                  type: 'metadata',
                  metadata: data,
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line);
            }
          }

          if (line.startsWith(':')) {
            // Heartbeat comment, ignore
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Backend stream error:', error);
      
      let errorMessage = 'Failed to connect to backend';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot reach backend server. Please ensure the backend is running on ' + this.baseUrl;
        } else {
          errorMessage = error.message;
        }
      }
      
      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Search documents
   */
  async search(query: string, k: number = 5): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/search?q=${encodeURIComponent(query)}&k=${k}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Upload documents for indexing
   */
  async uploadDocuments(files: File[]): Promise<UploadResult> {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get backend info
   */
  async getInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      if (!response.ok) {
        throw new Error('Failed to get backend info');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get backend info:', error);
      return null;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.checkConnection();
  }
}

// Create singleton instance
// Check for environment variable or use default
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const backendService = new BackendService(backendUrl);


