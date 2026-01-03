/**
 * Notification Sound Utility
 * Plays notification sounds for incoming requests and messages
 */

class NotificationSound {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;
  private currentRinging: {
    intervalId: number | null;
    stopCallback: (() => void) | null;
  } = { intervalId: null, stopCallback: null };

  constructor() {
    // Initialize on first user interaction
    if (typeof window !== 'undefined') {
      const initHandler = () => {
        this.init();
        console.log('👆 User interaction detected, initializing audio...');
      };
      
      document.addEventListener('click', initHandler, { once: true });
      document.addEventListener('touchstart', initHandler, { once: true });
      document.addEventListener('keydown', initHandler, { once: true });
    }
  }

  private init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Try to resume immediately
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('✅ Audio context resumed');
        });
      }
      
      this.initialized = true;
      console.log('✅ Notification sound initialized successfully!');
      console.log('   Audio context state:', this.audioContext.state);
    } catch (error) {
      console.error('❌ Error initializing notification sound:', error);
    }
  }
  
  /**
   * Manually test/initialize the sound system
   */
  async testSound() {
    console.log('🔊 Testing notification sound...');
    
    if (!this.initialized) {
      this.init();
    }
    
    if (!this.audioContext) {
      console.error('❌ Audio context not available');
      return false;
    }
    
    try {
      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Play a short test beep
      const now = this.audioContext.currentTime;
      await this.playTone(800, now, 0.2, 0.3);
      
      console.log('✅ Test sound played successfully!');
      return true;
    } catch (error) {
      console.error('❌ Test sound failed:', error);
      return false;
    }
  }

  /**
   * Play phone-style ringback tone for incoming counsel request
   * Rings repeatedly until stopped
   */
  async playRequestNotification() {
    if (!this.enabled) return;
    
    console.log('📞 Playing incoming call ringtone...');
    
    // Stop any previous ringing
    this.stopRinging();
    
    try {
      if (!this.audioContext) {
        this.init();
      }
      
      if (!this.audioContext) {
        console.error('❌ Audio context not available');
        return;
      }
      
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        console.log('⏸️ Audio context suspended, resuming...');
        await this.audioContext.resume();
      }
      
      console.log('🎵 Audio context state:', this.audioContext.state);
      
      // Play initial ring
      await this.playPhoneRing();
      
      // Set up repeating ring every 4 seconds (like a real phone)
      this.currentRinging.intervalId = window.setInterval(async () => {
        await this.playPhoneRing();
      }, 4000);
      
      console.log('✅ Phone ringtone started (will repeat every 4 seconds)');
    } catch (error) {
      console.error('❌ Error playing notification:', error);
    }
  }

  /**
   * Stop the ringing
   */
  stopRinging() {
    if (this.currentRinging.intervalId) {
      clearInterval(this.currentRinging.intervalId);
      this.currentRinging.intervalId = null;
      console.log('🔕 Ringtone stopped');
    }
    if (this.currentRinging.stopCallback) {
      this.currentRinging.stopCallback();
      this.currentRinging.stopCallback = null;
    }
  }

  /**
   * Play a single phone ring cycle (ring-ring pattern)
   * Standard phone ringtone uses dual-tone: 440Hz + 480Hz
   */
  private async playPhoneRing() {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Ring pattern: RING (0.4s) - PAUSE (0.2s) - RING (0.4s) - PAUSE (2s)
    // First ring
    await this.playDualTone(440, 480, now, 0.4, 0.3);
    // Short pause (200ms)
    // Second ring
    await this.playDualTone(440, 480, now + 0.6, 0.4, 0.3);
  }

  /**
   * Play dual-tone (like a real phone ringtone)
   */
  private async playDualTone(
    freq1: number,
    freq2: number,
    startTime: number,
    duration: number,
    volume: number = 0.3
  ) {
    if (!this.audioContext) return;

    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator1.frequency.value = freq1;
    oscillator2.frequency.value = freq2;
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Envelope: quick attack, sustain, quick release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator1.start(startTime);
    oscillator2.start(startTime);
    oscillator1.stop(startTime + duration);
    oscillator2.stop(startTime + duration);

    // Return a promise that resolves when the tone finishes
    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });
  }

  /**
   * Play notification sound for incoming message (single beep)
   */
  async playMessageNotification() {
    if (!this.enabled) return;
    
    try {
      if (!this.audioContext) {
        this.init();
      }
      
      if (!this.audioContext) return;
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      const now = this.audioContext.currentTime;
      await this.playTone(800, now, 0.1, 0.2);
      
      console.log('💬 Message notification played');
    } catch (error) {
      console.error('❌ Error playing notification:', error);
    }
  }

  /**
   * Play a single tone at specified frequency
   */
  private async playTone(
    frequency: number,
    startTime: number,
    duration: number,
    volume: number = 0.3
  ) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope: quick attack, sustain, quick release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    // Return a promise that resolves when the tone finishes
    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopRinging();
    }
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
