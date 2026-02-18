export class TTSEngine {
  private synth: SpeechSynthesis;
  private isSpeaking = false;
  private queue: Array<{ text: string; resolve: () => void }> = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.isSpeaking) {
        this.queue.push({ text, resolve });
        return;
      }

      this.playUtterance(text, resolve);
    });
  }

  private playUtterance(text: string, onDone: () => void): void {
    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const voices = this.synth.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
    ) || voices.find(v =>
      v.lang.startsWith('en-GB')
    ) || voices.find(v =>
      v.lang.startsWith('en')
    );

    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.rate = 0.95;
    utterance.pitch = 0.85;
    utterance.volume = 1;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onDone();
      this.processQueue();
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      onDone();
      this.processQueue();
    };

    this.synth.speak(utterance);
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;
    const next = this.queue.shift()!;
    this.playUtterance(next.text, next.resolve);
  }

  cancel(): void {
    this.synth.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.queue.forEach(q => q.resolve());
    this.queue = [];
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
