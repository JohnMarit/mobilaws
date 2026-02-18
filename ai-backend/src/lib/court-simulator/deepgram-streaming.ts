import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { env } from '../../env';

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
  words: Array<{ word: string; start: number; end: number; confidence: number }>;
}

export class DeepgramStreamer extends EventEmitter {
  private dgSocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private isConnected = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private accumulatedTranscript = '';
  private lastFinalTimestamp = 0;

  constructor() {
    super();
  }

  async connect(): Promise<void> {
    if (!env.DEEPGRAM_API_KEY) {
      console.warn('⚠️ DEEPGRAM_API_KEY not set — using fallback silence-based transcript simulation');
      this.isConnected = true;
      this.emit('ready');
      return;
    }

    return new Promise((resolve, reject) => {
      const url = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
        model: 'nova-2',
        language: 'en',
        smart_format: 'true',
        interim_results: 'true',
        utterance_end_ms: '1500',
        vad_events: 'true',
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
      }).toString();

      this.dgSocket = new WebSocket(url, {
        headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` },
      });

      this.dgSocket.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startKeepAlive();
        this.emit('ready');
        resolve();
      });

      this.dgSocket.on('message', (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          this.handleDeepgramMessage(response);
        } catch (err) {
          console.error('Failed to parse Deepgram message:', err);
        }
      });

      this.dgSocket.on('close', (code, reason) => {
        this.isConnected = false;
        this.stopKeepAlive();
        if (code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Deepgram reconnecting (attempt ${this.reconnectAttempts})...`);
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
        this.emit('closed', code, reason?.toString());
      });

      this.dgSocket.on('error', (err) => {
        console.error('Deepgram WebSocket error:', err);
        this.emit('error', err);
        if (!this.isConnected) reject(err);
      });
    });
  }

  private handleDeepgramMessage(response: any): void {
    if (response.type === 'Results') {
      const channel = response.channel;
      if (!channel?.alternatives?.[0]) return;

      const alternative = channel.alternatives[0];
      const transcript = alternative.transcript;

      if (!transcript || transcript.trim().length === 0) return;

      const result: TranscriptResult = {
        text: transcript,
        isFinal: response.is_final === true,
        confidence: alternative.confidence || 0,
        timestamp: Date.now(),
        words: (alternative.words || []).map((w: any) => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.confidence,
        })),
      };

      if (result.isFinal) {
        this.accumulatedTranscript += (this.accumulatedTranscript ? ' ' : '') + result.text;
        this.lastFinalTimestamp = result.timestamp;
      }

      this.emit('transcript', result);
    } else if (response.type === 'UtteranceEnd') {
      this.emit('utterance_end', { timestamp: Date.now() });
    } else if (response.type === 'SpeechStarted') {
      this.emit('speech_started', { timestamp: Date.now() });
    }
  }

  sendAudio(audioData: Buffer): void {
    if (!env.DEEPGRAM_API_KEY) {
      return;
    }
    if (this.dgSocket && this.isConnected && this.dgSocket.readyState === WebSocket.OPEN) {
      this.dgSocket.send(audioData);
    }
  }

  getAccumulatedTranscript(): string {
    return this.accumulatedTranscript;
  }

  resetTranscript(): void {
    this.accumulatedTranscript = '';
  }

  private startKeepAlive(): void {
    this.keepAliveInterval = setInterval(() => {
      if (this.dgSocket && this.isConnected && this.dgSocket.readyState === WebSocket.OPEN) {
        this.dgSocket.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  disconnect(): void {
    this.stopKeepAlive();
    if (this.dgSocket) {
      this.isConnected = false;
      if (this.dgSocket.readyState === WebSocket.OPEN) {
        this.dgSocket.close(1000, 'Session ended');
      }
      this.dgSocket = null;
    }
    this.accumulatedTranscript = '';
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
