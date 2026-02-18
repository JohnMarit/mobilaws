export class TTSEngine {
  private synth: SpeechSynthesis;
  private isSpeaking = false;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private keepAlive: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    // Pre-warm the voice list immediately so voices are ready before first speak()
    this.loadVoices();
    if (typeof this.synth.onvoiceschanged !== 'undefined') {
      this.synth.addEventListener('voiceschanged', () => this.loadVoices());
    }
  }

  private loadVoices(): void {
    this.synth.getVoices(); // triggers voice list population
  }

  /** Speak text. Always resolves (never rejects), even on error or timeout. */
  speak(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      // Stop anything currently running first
      this.stopCurrent();

      // Small delay lets the browser fully process the cancel() before we speak
      setTimeout(() => {
        this.doSpeak(text.trim(), resolve);
      }, 120);
    });
  }

  private doSpeak(text: string, onDone: () => void): void {
    if (!text) {
      onDone();
      return;
    }

    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.pickVoice();
    utterance.rate   = 0.88;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Watchdog — if browser never fires onend/onerror (mobile Chrome bug), resolve anyway
    const maxMs = Math.max(8000, text.length * 85);
    this.watchdog = setTimeout(() => {
      this.finishUp(onDone);
    }, maxMs);

    // Android Chrome pauses speechSynthesis after ~14 words. Periodic resume() keeps it alive.
    this.keepAlive = setInterval(() => {
      if (this.synth.paused) this.synth.resume();
    }, 4000);

    utterance.onend = () => this.finishUp(onDone);
    utterance.onerror = (evt) => {
      // 'interrupted' / 'canceled' happen when cancel() is called — not a real error
      if (evt.error !== 'interrupted' && evt.error !== 'canceled') {
        console.warn('TTS error:', evt.error, '— text:', text.slice(0, 60));
      }
      this.finishUp(onDone);
    };

    this.synth.speak(utterance);
  }

  private finishUp(onDone: () => void): void {
    if (!this.isSpeaking) return; // already finished
    this.isSpeaking = false;
    this.clearTimers();
    onDone();
  }

  private stopCurrent(): void {
    this.isSpeaking = false;
    this.clearTimers();
    try { this.synth.cancel(); } catch { /* ignore */ }
  }

  private clearTimers(): void {
    if (this.watchdog)   { clearTimeout(this.watchdog);   this.watchdog  = null; }
    if (this.keepAlive)  { clearInterval(this.keepAlive); this.keepAlive = null; }
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const voices = this.synth.getVoices();
    // Prefer a local English voice for reliability on mobile
    return (
      voices.find(v => v.lang === 'en-US'  && v.localService) ||
      voices.find(v => v.lang === 'en-GB'  && v.localService) ||
      voices.find(v => v.lang.startsWith('en') && v.localService) ||
      voices.find(v => v.lang === 'en-US')  ||
      voices.find(v => v.lang === 'en-GB')  ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  }

  cancel(): void {
    this.stopCurrent();
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
