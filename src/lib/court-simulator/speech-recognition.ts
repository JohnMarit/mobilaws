type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

export class BrowserSpeechRecognition {
  private recognition: any = null;
  private isRunning = false;
  private onTranscript: ((text: string, isFinal: boolean) => void) | null = null;
  private restartTimeout: NodeJS.Timeout | null = null;
  private shouldBeRunning = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!this.onTranscript) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const isFinal = result.isFinal;
        this.onTranscript(text, isFinal);
      }
    };

    this.recognition.onend = () => {
      this.isRunning = false;
      if (this.shouldBeRunning) {
        this.restartTimeout = setTimeout(() => {
          if (this.shouldBeRunning) {
            this.startRecognition();
          }
        }, 200);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('Speech recognition error:', event.error);
    };
  }

  start(onTranscript: (text: string, isFinal: boolean) => void): void {
    if (!this.recognition) return;
    this.onTranscript = onTranscript;
    this.shouldBeRunning = true;
    this.startRecognition();
  }

  private startRecognition(): void {
    if (!this.recognition || this.isRunning) return;
    try {
      this.recognition.start();
      this.isRunning = true;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
    }
  }

  pause(): void {
    this.shouldBeRunning = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition && this.isRunning) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped
      }
      this.isRunning = false;
    }
  }

  resume(): void {
    this.shouldBeRunning = true;
    this.startRecognition();
  }

  stop(): void {
    this.shouldBeRunning = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped
      }
      this.isRunning = false;
    }
    this.onTranscript = null;
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }
}
