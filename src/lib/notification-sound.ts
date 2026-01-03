/**
 * Notification Sound Utility
 * Plays notification sounds for incoming requests and messages
 */

class NotificationSound {
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    // Initialize on first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', () => this.init(), { once: true });
      document.addEventListener('touchstart', () => this.init(), { once: true });
    }
  }

  private init() {
    if (this.initialized) return;
    
    try {
      // Create a simple beep using data URI
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate a simple notification sound
      const sampleRate = audioContext.sampleRate;
      const duration = 0.5;
      const frequency = 800;
      
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * Math.exp(-3 * i / buffer.length);
      }
      
      this.initialized = true;
      console.log('✅ Notification sound initialized');
    } catch (error) {
      console.error('❌ Error initializing notification sound:', error);
    }
  }

  /**
   * Play notification sound for incoming counsel request
   */
  async playRequestNotification() {
    if (!this.enabled) return;
    
    try {
      // Use Web Audio API for reliable cross-browser sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const now = audioContext.currentTime;
      
      // Create three ascending tones (like WhatsApp)
      await this.playTone(audioContext, 659.25, now, 0.15); // E5
      await this.playTone(audioContext, 783.99, now + 0.15, 0.15); // G5
      await this.playTone(audioContext, 987.77, now + 0.3, 0.2); // B5
      
      console.log('🔔 Request notification played');
    } catch (error) {
      console.error('❌ Error playing notification:', error);
      // Fallback: try system beep
      this.fallbackBeep();
    }
  }

  /**
   * Play notification sound for incoming message
   */
  async playMessageNotification() {
    if (!this.enabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const now = audioContext.currentTime;
      await this.playTone(audioContext, 800, now, 0.1);
      
      console.log('💬 Message notification played');
    } catch (error) {
      console.error('❌ Error playing notification:', error);
      this.fallbackBeep();
    }
  }

  /**
   * Play a tone at specified frequency
   */
  private async playTone(
    audioContext: AudioContext,
    frequency: number,
    startTime: number,
    duration: number
  ) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope: quick attack, sustain, quick release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
    gainNode.gain.setValueAtTime(0.5, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    // Return a promise that resolves when the tone finishes
    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });
  }

  /**
   * Fallback beep using system alert
   */
  private fallbackBeep() {
    try {
      // Try to play a system beep
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Silent fail
    }
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const notificationSound = new NotificationSound();
