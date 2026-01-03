/**
 * Notification Sound Utility
 * Plays notification sounds for incoming requests and messages
 */

class NotificationSound {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', () => this.initAudioContext(), { once: true });
    }
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play notification sound for incoming counsel request
   */
  async playRequestNotification() {
    if (!this.enabled) return;
    
    this.initAudioContext();
    if (!this.audioContext) return;

    try {
      // Create a pleasant notification sound (three ascending tones)
      const now = this.audioContext.currentTime;
      
      // First tone (E5 - 659.25 Hz)
      await this.playTone(659.25, now, 0.15);
      // Second tone (G5 - 783.99 Hz)
      await this.playTone(783.99, now + 0.15, 0.15);
      // Third tone (B5 - 987.77 Hz)
      await this.playTone(987.77, now + 0.3, 0.2);
      
      console.log('🔔 Request notification played');
    } catch (error) {
      console.error('Error playing notification:', error);
    }
  }

  /**
   * Play notification sound for incoming message
   */
  async playMessageNotification() {
    if (!this.enabled) return;
    
    this.initAudioContext();
    if (!this.audioContext) return;

    try {
      // Create a simple message notification (single tone)
      const now = this.audioContext.currentTime;
      await this.playTone(800, now, 0.1);
      
      console.log('💬 Message notification played');
    } catch (error) {
      console.error('Error playing notification:', error);
    }
  }

  /**
   * Play a tone at specified frequency
   */
  private async playTone(frequency: number, startTime: number, duration: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope: quick attack, sustain, quick release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
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

