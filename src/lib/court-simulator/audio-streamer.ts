export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private ws: WebSocket | null = null;
  private isStreaming = false;
  private levelCallback: ((level: number) => void) | null = null;
  private animFrameId: number | null = null;

  async start(
    stream: MediaStream,
    websocket: WebSocket | null,
    onMicLevel: (level: number) => void
  ): Promise<void> {
    this.ws = websocket;
    this.levelCallback = onMicLevel;

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.5;

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.sourceNode.connect(this.analyserNode);

    if (this.ws) {
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.processorNode.onaudioprocess = (event) => {
        if (!this.isStreaming || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcm16 = float32ToInt16(inputData);
        this.ws.send(pcm16.buffer);
      };
    }

    this.isStreaming = true;
    this.monitorLevel();
  }

  private monitorLevel(): void {
    if (!this.analyserNode || !this.levelCallback) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const tick = () => {
      if (!this.isStreaming || !this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalized = Math.min(1, average / 128);
      this.levelCallback?.(normalized);

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  pause(): void {
    this.isStreaming = false;
  }

  resume(): void {
    this.isStreaming = true;
    this.monitorLevel();
  }

  stop(): void {
    this.isStreaming = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.ws = null;
    this.levelCallback = null;
  }

  getIsStreaming(): boolean {
    return this.isStreaming;
  }
}

function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}
