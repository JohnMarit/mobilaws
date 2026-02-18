export class TTSEngine {
  private synth: SpeechSynthesis;
  private isSpeaking = false;
  private queue: Array<{ text: string; resolve: () => void }> = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.primeVoices();
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
    this.synth.cancel();
    this.synth.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const voices = this.synth.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && v.localService
    ) || voices.find(v =>
      v.lang.startsWith('en-US')
    ) || voices.find(v =>
      v.lang.startsWith('en-GB')
    ) || voices.find(v =>
      v.lang.startsWith('en')
    );

    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    const maxDurationMs = Math.min(20000, Math.max(6000, text.length * 90));
    const watchdog = setTimeout(() => {
      this.finishCurrent(onDone);
    }, maxDurationMs);

    const settle = () => {
      clearTimeout(watchdog);
      this.finishCurrent(onDone);
    };

    utterance.onend = settle;
    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      settle();
    };

    this.synth.speak(utterance);
  }

  private finishCurrent(onDone: () => void): void {
    if (!this.isSpeaking) return;
    this.isSpeaking = false;
    this.currentUtterance = null;
    onDone();
    this.processQueue();
  }

  private primeVoices(): void {
    if (this.synth.getVoices().length > 0) {
      return;
    }

    const onVoicesChanged = () => {
      if (this.synth.getVoices().length > 0) {
        this.synth.removeEventListener('voiceschanged', onVoicesChanged);
      }
    };
    this.synth.addEventListener('voiceschanged', onVoicesChanged);
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
