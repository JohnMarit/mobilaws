export class VideoFrameCapture {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private intervalId: NodeJS.Timeout | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  start(
    videoElement: HTMLVideoElement,
    intervalMs: number,
    onFrame: (base64Jpeg: string) => void
  ): void {
    this.videoElement = videoElement;
    this.canvas.width = 320;
    this.canvas.height = 240;

    this.intervalId = setInterval(() => {
      if (!this.videoElement || this.videoElement.readyState < 2) return;

      this.ctx.drawImage(this.videoElement, 0, 0, 320, 240);
      const dataUrl = this.canvas.toDataURL('image/jpeg', 0.5);
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        onFrame(base64);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.videoElement = null;
  }

  captureOnce(): string | null {
    if (!this.videoElement || this.videoElement.readyState < 2) return null;

    this.ctx.drawImage(this.videoElement, 0, 0, 320, 240);
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.5);
    return dataUrl.split(',')[1] || null;
  }
}
