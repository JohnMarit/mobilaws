export type FaceStatus = 'scanning' | 'detected' | 'not-detected' | 'unsupported';

const BACKEND_BASE = (
  (import.meta as any).env?.VITE_BACKEND_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  'http://localhost:8000'
).replace(/\/api\/?$/, '');

/**
 * Attempt to detect a human face in the given video element.
 *
 * Strategy:
 *  1. Native browser FaceDetector API (Chrome/Edge on Android & desktop)
 *  2. Capture a frame and ask the backend /api/court-simulator/check-face
 *     (backed by GPT-4o Vision)
 *  3. If both fail → returns 'unsupported' so the caller can decide gracefully.
 */
export async function detectFace(videoEl: HTMLVideoElement): Promise<FaceStatus> {
  if (!videoEl || videoEl.readyState < 2) return 'scanning';

  // ── 1. Native FaceDetector API ────────────────────────────────────────────
  if ('FaceDetector' in window) {
    try {
      const detector = new (window as any).FaceDetector({
        fastMode: true,
        maxDetectedFaces: 1,
      });
      const faces: unknown[] = await detector.detect(videoEl);
      return faces.length > 0 ? 'detected' : 'not-detected';
    } catch {
      // security error or unsupported context — fall through
    }
  }

  // ── 2. Backend GPT Vision fallback ────────────────────────────────────────
  try {
    const canvas = document.createElement('canvas');
    canvas.width  = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-ctx');
    ctx.drawImage(videoEl, 0, 0, 320, 240);
    const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];

    const res = await fetch(`${BACKEND_BASE}/api/court-simulator/check-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64 }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return 'unsupported';
    const data = await res.json();
    return data.faceDetected ? 'detected' : 'not-detected';
  } catch {
    return 'unsupported';
  }
}
