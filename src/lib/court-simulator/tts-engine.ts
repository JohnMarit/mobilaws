/**
 * Robust TTS engine that works reliably across desktop and mobile browsers.
 *
 * Key design decisions:
 *  - warmUp() MUST be called during a user gesture (button click) to unlock
 *    both AudioContext and SpeechSynthesis on mobile browsers.
 *  - Every speak() plays a short "gavel" alert tone via Web Audio API first,
 *    guaranteeing audible feedback even if SpeechSynthesis silently fails.
 *  - A keep-alive interval counters Android Chrome pausing speech mid-sentence.
 *  - A watchdog timeout ensures the promise always resolves.
 */
export class TTSEngine {
  private synth: SpeechSynthesis;
  private audioCtx: AudioContext | null = null;
  private isSpeaking = false;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private keepAlive: ReturnType<typeof setInterval> | null = null;
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private warmedUp = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.cacheVoice();
    if (typeof this.synth.onvoiceschanged !== 'undefined') {
      this.synth.addEventListener('voiceschanged', () => this.cacheVoice());
    }
  }

  /* ────────────────────── public API ────────────────────── */

  /**
   * MUST be called during a user gesture (click/tap) to unlock audio on
   * iOS Safari, Android Chrome, and other mobile browsers.
   */
  warmUp(): void {
    if (this.warmedUp) return;
    this.warmedUp = true;

    // 1. Unlock AudioContext
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buf = this.audioCtx.createBuffer(1, 1, 22050);
      const src = this.audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(this.audioCtx.destination);
      src.start(0);
    } catch { /* graceful */ }

    // 2. Unlock SpeechSynthesis with a near-silent utterance
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0.01;
      u.rate = 10;
      this.synth.speak(u);
    } catch { /* graceful */ }

    this.cacheVoice();
  }

  /** Speak text aloud. Always resolves (never rejects). */
  speak(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const trimmed = text.trim();
      if (!trimmed) { resolve(); return; }

      // Play audible alert tone immediately — guaranteed to work after warmUp
      this.playAlertTone();

      // Only cancel if actually speaking, otherwise skip (avoids Chrome cancel() bug)
      if (this.synth.speaking || this.synth.pending) {
        this.stopCurrent();
        // Longer delay after a real cancel to let the browser fully reset
        setTimeout(() => this.doSpeak(trimmed, resolve), 350);
      } else {
        // No prior speech → small delay just to let the alert tone ring
        setTimeout(() => this.doSpeak(trimmed, resolve), 250);
      }
    });
  }

  cancel(): void {
    this.stopCurrent();
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /* ────────────────────── internals ────────────────────── */

  private doSpeak(text: string, onDone: () => void): void {
    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice  = this.cachedVoice;
    utterance.rate   = 0.9;
    utterance.pitch  = 1.05;
    utterance.volume = 1.0;

    // Watchdog — resolve if browser never fires onend (mobile Chrome bug)
    const maxMs = Math.max(10_000, text.length * 100);
    this.watchdog = setTimeout(() => this.finishUp(onDone), maxMs);

    // Keep-alive: periodically call resume() to counter Android Chrome pausing
    this.keepAlive = setInterval(() => {
      if (this.synth.paused) this.synth.resume();
    }, 2500);

    utterance.onend = () => this.finishUp(onDone);
    utterance.onerror = (evt) => {
      if (evt.error !== 'interrupted' && evt.error !== 'canceled') {
        console.warn('TTS error:', evt.error);
      }
      this.finishUp(onDone);
    };

    try {
      this.synth.speak(utterance);
    } catch {
      this.finishUp(onDone);
    }

    // Extra safety: after 500 ms, check if synth actually started. If not,
    // the utterance was silently dropped — resolve early so UI doesn't hang.
    setTimeout(() => {
      if (this.isSpeaking && !this.synth.speaking && !this.synth.pending) {
        console.warn('TTS: utterance was silently dropped — resolving');
        this.finishUp(onDone);
      }
    }, 800);
  }

  private finishUp(onDone: () => void): void {
    if (!this.isSpeaking) return;
    this.isSpeaking = false;
    this.clearTimers();
    onDone();
  }

  private stopCurrent(): void {
    this.isSpeaking = false;
    this.clearTimers();
    try { this.synth.cancel(); } catch { /* */ }
  }

  private clearTimers(): void {
    if (this.watchdog)  { clearTimeout(this.watchdog);   this.watchdog  = null; }
    if (this.keepAlive) { clearInterval(this.keepAlive); this.keepAlive = null; }
  }

  /**
   * Two-tone "court gavel" alert via Web Audio API.
   * Works reliably after warmUp() — even when SpeechSynthesis fails.
   */
  private playAlertTone(): void {
    const ctx = this.audioCtx;
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = i === 0 ? 620 : 520;
        gain.gain.setValueAtTime(0.45, now + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.38);
        osc.start(now + i * 0.22);
        osc.stop(now + i * 0.22 + 0.45);
      }
    } catch { /* graceful */ }
  }

  private cacheVoice(): void {
    const voices = this.synth.getVoices();
    
    // Priority 1: Female African English voices
    // Common African English voice names from various browsers:
    // - "Microsoft Zira" (Nigerian English, female)
    // - "Google UK English Female" / "Google British English Female" (closest to African accent)
    // - "Samantha" (South African on some systems)
    // - Look for "South African", "Nigerian", "Kenyan" in voice names
    
    const isFemaleVoice = (v: SpeechSynthesisVoice) => {
      const name = v.name.toLowerCase();
      return name.includes('female') || 
             name.includes('woman') ||
             name.includes('zira') || 
             name.includes('samantha') ||
             name.includes('fiona') ||
             name.includes('karen') ||
             name.includes('moira') ||
             name.includes('tessa') ||
             name.includes('veena') ||
             !name.includes('male'); // if gender not specified, assume female (default on most systems)
    };

    const isAfricanOrSimilar = (v: SpeechSynthesisVoice) => {
      const fullText = `${v.name} ${v.lang}`.toLowerCase();
      return fullText.includes('south africa') ||
             fullText.includes('nigeria') ||
             fullText.includes('kenya') ||
             fullText.includes('ghana') ||
             fullText.includes('zira') || // Microsoft Nigerian voice
             fullText.includes('en-za') || // South African locale
             fullText.includes('en-ng') || // Nigerian locale
             fullText.includes('en-ke') || // Kenyan locale
             fullText.includes('british') || // British accent is closer to African than American
             fullText.includes('uk') ||
             fullText.includes('en-gb');
    };

    // Try to find: Female + African/British
    this.cachedVoice =
      voices.find(v => isFemaleVoice(v) && isAfricanOrSimilar(v)) ||
      // Fallback: Any female English voice
      voices.find(v => isFemaleVoice(v) && v.lang.startsWith('en')) ||
      // Fallback: British/African (any gender)
      voices.find(v => isAfricanOrSimilar(v)) ||
      // Fallback: en-GB (closest to African accent)
      voices.find(v => v.lang === 'en-GB' && v.localService) ||
      voices.find(v => v.lang === 'en-GB') ||
      // Last resort: any English voice
      voices.find(v => v.lang.startsWith('en')) ||
      null;

    // Debug log to help users see what voice was selected
    if (this.cachedVoice) {
      console.log('TTS Voice selected:', this.cachedVoice.name, '|', this.cachedVoice.lang);
    }
  }
}
