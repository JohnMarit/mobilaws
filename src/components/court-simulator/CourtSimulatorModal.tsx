import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Video, VideoOff, Mic, Play, Square, Loader2, AlertCircle, WifiOff, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourtSimulator } from '@/contexts/CourtSimulatorContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { AudioStreamer } from '@/lib/court-simulator/audio-streamer';
import { VideoFrameCapture } from '@/lib/court-simulator/video-capture';
import { TTSEngine } from '@/lib/court-simulator/tts-engine';
import { BrowserSpeechRecognition } from '@/lib/court-simulator/speech-recognition';
import MicLevelIndicator from './MicLevelIndicator';
import SessionTimer from './SessionTimer';
import EmotionIndicator from './EmotionIndicator';
import TranscriptDisplay from './TranscriptDisplay';
import JudgeInterruption from './JudgeInterruption';
import ScoreDashboard from './ScoreDashboard';

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/\/api\/?$/, '');

const WS_BASE = BACKEND_BASE
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

const ANALYSIS_INTERVAL_MS = 6000;
const SEVERITY_THRESHOLD = 0.45;
const MIN_SECONDS_BEFORE_INTERRUPT = 12;
const INTERRUPT_COOLDOWN_MS = 12000;
const MIN_MANUAL_DURATION_MINUTES = 5;
const DEFAULT_MANUAL_DURATION_MINUTES = 5;
const MAX_MANUAL_DURATION_MINUTES = 60;

export default function CourtSimulatorModal() {
  const { state, dispatch, closeSimulator } = useCourtSimulator();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const videoCaptureRef = useRef<VideoFrameCapture | null>(null);
  const ttsRef = useRef<TTSEngine | null>(null);
  const speechRecRef = useRef<BrowserSpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef(0);
  const fullTranscriptRef = useRef('');
  const recentChunkRef = useRef('');
  const isLocalModeRef = useRef(false);
  const lastInterruptTimeRef = useRef(0);
  const previousQuestionsRef = useRef<string[]>([]);
  const interruptingRef = useRef(false);
  const sessionStartTimeRef = useRef(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const interruptionQuestionRef = useRef('');
  const interruptionReasonRef = useRef('');
  const preferredCameraFacingModeRef = useRef<'user' | 'environment'>('user');

  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraSwitchAvailable, setCameraSwitchAvailable] = useState(false);
  const [manualDurationMinutes, setManualDurationMinutes] = useState(DEFAULT_MANUAL_DURATION_MINUTES);

  const { isModalOpen, sessionState, mediaStream } = state;

  // Keep refs in sync with state
  useEffect(() => {
    fullTranscriptRef.current = state.fullTranscript;
  }, [state.fullTranscript]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  // Callback ref: whenever a <video> element mounts, attach the stream
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && mediaStreamRef.current) {
      el.srcObject = mediaStreamRef.current;
    }
  }, []);

  // Also re-attach when mediaStream changes and videoRef exists
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Initialize media on PREVIEW
  useEffect(() => {
    if (sessionState !== 'PREVIEW') return;

    let cancelled = false;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: preferredCameraFacingModeRef.current,
          },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        dispatch({ type: 'SET_MEDIA_STREAM', stream });
        setCameraError(null);
        detectCameraSwitchAvailability();
      } catch (err: any) {
        const msg = err.name === 'NotAllowedError'
          ? 'Camera and microphone access denied. Please allow permissions and try again.'
          : 'Could not access camera or microphone. Please check your device settings.';
        setCameraError(msg);
        dispatch({ type: 'SET_ERROR', error: msg });
      }
    }

    initMedia();

    return () => { cancelled = true; };
  }, [sessionState, dispatch]);

  async function detectCameraSwitchAvailability() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCameraSwitchAvailable(false);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setCameraSwitchAvailable(videoInputs.length > 1);
    } catch {
      setCameraSwitchAvailable(false);
    }
  }

  // Session tick timer
  useEffect(() => {
    const activeStates = ['RECORDING', 'ANALYZING', 'INTERRUPTING', 'RESUMING'];
    if (activeStates.includes(sessionState) && !timerRef.current) {
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        dispatch({ type: 'TICK', seconds: elapsedRef.current });

        if (elapsedRef.current >= state.maxDuration) {
          endSession();
        }
      }, 1000);
    }
  }, [sessionState]);

  // Cleanup on close
  useEffect(() => {
    if (!isModalOpen) {
      cleanupAll();
    }
  }, [isModalOpen]);

  function cleanupAll() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
    elapsedRef.current = 0;
    fullTranscriptRef.current = '';
    recentChunkRef.current = '';
    isLocalModeRef.current = false;
    lastInterruptTimeRef.current = 0;
    previousQuestionsRef.current = [];
    interruptingRef.current = false;
    sessionStartTimeRef.current = 0;
    interruptionQuestionRef.current = '';
    interruptionReasonRef.current = '';

    audioStreamerRef.current?.stop();
    audioStreamerRef.current = null;

    videoCaptureRef.current?.stop();
    videoCaptureRef.current = null;

    ttsRef.current?.cancel();
    ttsRef.current = null;

    speechRecRef.current?.stop();
    speechRecRef.current = null;

    if (wsRef.current) {
      try { wsRef.current.close(1000); } catch {}
      wsRef.current = null;
    }

    setCameraError(null);
    setTtsSpeaking(false);
    setIsStarting(false);
  }

  // --- WebSocket message handling ---

  function handleWSMessage(msg: any) {
    switch (msg.type) {
      case 'session_ready':
        dispatch({
          type: 'START_SESSION',
          sessionId: msg.sessionId,
          maxDuration: msg.maxDuration || 120,
          minDuration: msg.minDuration || 60,
        });
        break;

      case 'transcript':
        handleTranscriptFromServer(msg.text, msg.isFinal, msg.timestamp);
        break;

      case 'emotion':
        dispatch({
          type: 'SET_EMOTION',
          emotion: {
            ...msg.emotions,
            primary: msg.primary || 'neutral',
            timestamp: msg.timestamp || Date.now(),
          },
        });
        break;

      case 'interrupt':
        triggerInterruption({
          question: msg.question,
          reason: msg.reason,
          severity: msg.severity,
          timestamp: msg.timestamp || Date.now(),
        });
        break;

      case 'finalizing':
        dispatch({ type: 'START_FINALIZING' });
        break;

      case 'evaluation':
        dispatch({
          type: 'SET_EVALUATION',
          evaluation: msg.evaluation,
          transcript: msg.transcript || '',
        });
        cleanupAll();
        break;

      case 'error':
        console.error('Court simulator server error:', msg.message);
        break;
    }
  }

  function handleTranscriptFromServer(text: string, isFinal: boolean, timestamp?: number) {
    dispatch({
      type: 'ADD_TRANSCRIPT',
      entry: { text, isFinal, timestamp: timestamp || Date.now() },
    });
    if (isFinal && text.trim()) {
      const updated = (fullTranscriptRef.current + ' ' + text).trim();
      fullTranscriptRef.current = updated;
      recentChunkRef.current = text;
      dispatch({ type: 'SET_FULL_TRANSCRIPT', text: updated });
    }
  }

  // --- Interruption logic ---

  async function triggerInterruption(interruption: any) {
    if (interruptingRef.current) return;
    interruptingRef.current = true;

    interruptionQuestionRef.current = interruption.question || '';
    interruptionReasonRef.current = interruption.reason || '';

    dispatch({ type: 'TRIGGER_INTERRUPT', interruption });

    audioStreamerRef.current?.pause();
    speechRecRef.current?.pause();

    if (!ttsRef.current) ttsRef.current = new TTSEngine();

    setTtsSpeaking(true);
    await ttsRef.current.speak(interruption.question);
    setTtsSpeaking(false);
  }

  async function repeatInterruptionAudio() {
    if (!interruptionQuestionRef.current || !ttsRef.current) return;
    setTtsSpeaking(true);
    await ttsRef.current.speak(interruptionQuestionRef.current);
    setTtsSpeaking(false);
  }

  function resumeAfterInterruption() {
    dispatch({ type: 'RESUME_RECORDING' });
    audioStreamerRef.current?.resume();
    speechRecRef.current?.resume();
    lastInterruptTimeRef.current = Date.now();
    interruptingRef.current = false;
    interruptionQuestionRef.current = '';
    interruptionReasonRef.current = '';
    setTimeout(() => {
      dispatch({ type: 'TO_RECORDING' });
    }, 500);
  }

  // --- Local analysis (calls REST /analyze endpoint) ---

  async function runLocalAnalysis() {
    if (interruptingRef.current) return;

    const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000;
    if (elapsed < MIN_SECONDS_BEFORE_INTERRUPT) return;

    const timeSinceLast = lastInterruptTimeRef.current > 0
      ? Date.now() - lastInterruptTimeRef.current
      : Infinity;
    if (timeSinceLast < INTERRUPT_COOLDOWN_MS) return;

    const chunk = recentChunkRef.current;
    const transcript = fullTranscriptRef.current;
    if (!chunk && !transcript) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/court-simulator/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullTranscript: transcript,
          recentChunk: chunk || transcript.split(' ').slice(-30).join(' '),
          emotionState: {},
          sessionElapsedSeconds: elapsed,
          previousQuestions: previousQuestionsRef.current,
        }),
      });

      if (!res.ok) return;

      const result = await res.json();
      recentChunkRef.current = '';

      if (result.interrupt && result.severity >= SEVERITY_THRESHOLD) {
        previousQuestionsRef.current.push(result.question);
        triggerInterruption({
          question: result.question,
          reason: result.reason,
          severity: result.severity,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Local analysis request failed:', err);
    }
  }

  // --- Session lifecycle ---

  function connectWebSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE}/ws/court-simulator`;
      console.log('Connecting to court simulator WebSocket:', url);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timed out'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        dispatch({ type: 'SET_CONNECTED', connected: true });
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleWSMessage(msg);
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        dispatch({ type: 'SET_CONNECTED', connected: false });
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket connection failed'));
      };
    });
  }

  async function handleBeginSession() {
    if (!mediaStream || isStarting) return;

    setIsStarting(true);
    dispatch({ type: 'SET_ERROR', error: '' });

    const sessionId = `cs_${Date.now()}`;
    const requestedDurationSeconds = Math.max(
      MIN_MANUAL_DURATION_MINUTES,
      Math.min(MAX_MANUAL_DURATION_MINUTES, Number(manualDurationMinutes) || DEFAULT_MANUAL_DURATION_MINUTES),
    ) * 60;
    sessionStartTimeRef.current = Date.now();
    let ws: WebSocket | null = null;

    // Try WebSocket connection first
    try {
      ws = await connectWebSocket();
      ws.send(JSON.stringify({
        type: 'session_start',
        userId: user?.id || 'anonymous',
        sessionId,
        maxDuration: requestedDurationSeconds,
      }));
    } catch (err) {
      console.warn('WebSocket unavailable, starting in local mode:', err);
      ws = null;
      isLocalModeRef.current = true;
      dispatch({
        type: 'START_SESSION',
        sessionId,
        maxDuration: requestedDurationSeconds,
        minDuration: 60,
      });
    }

    // Start audio level monitoring
    try {
      const audioStreamer = new AudioStreamer();
      audioStreamerRef.current = audioStreamer;
      await audioStreamer.start(mediaStream, ws, (level) => {
        dispatch({ type: 'SET_MIC_LEVEL', level });
      });
    } catch (err) {
      console.error('Audio streamer init error:', err);
    }

    // Start video frame capture (only sends to WebSocket if connected)
    try {
      const videoCapture = new VideoFrameCapture();
      videoCaptureRef.current = videoCapture;
      if (videoRef.current && ws) {
        const captureWs = ws;
        videoCapture.start(videoRef.current, 4000, (base64) => {
          if (captureWs.readyState === WebSocket.OPEN) {
            captureWs.send(JSON.stringify({ type: 'video_frame', data: base64 }));
          }
        });
      }
    } catch (err) {
      console.error('Video capture init error:', err);
    }

    // Start browser speech recognition (always active)
    try {
      const speechRec = new BrowserSpeechRecognition();
      speechRecRef.current = speechRec;
      if (speechRec.isAvailable()) {
        speechRec.start((text, isFinal) => {
          dispatch({
            type: 'ADD_TRANSCRIPT',
            entry: { text, isFinal, timestamp: Date.now() },
          });

          if (isFinal && text.trim()) {
            const updated = (fullTranscriptRef.current + ' ' + text).trim();
            fullTranscriptRef.current = updated;
            recentChunkRef.current = text;
            dispatch({ type: 'SET_FULL_TRANSCRIPT', text: updated });

            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'transcript_fallback', text, isFinal: true }));
            }
          }
        });
      }
    } catch (err) {
      console.error('Speech recognition init error:', err);
    }

    // Start local analysis timer (works in both modes as a safety net)
    analysisTimerRef.current = setInterval(() => {
      runLocalAnalysis();
    }, ANALYSIS_INTERVAL_MS);

    setIsStarting(false);
  }

  async function endSession() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }

    dispatch({ type: 'START_FINALIZING' });

    speechRecRef.current?.stop();
    audioStreamerRef.current?.stop();
    videoCaptureRef.current?.stop();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isLocalModeRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'session_end' }));
    } else {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/court-simulator/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullTranscript: fullTranscriptRef.current,
            emotionTimeline: [],
            interruptions: state.interruptions,
            durationSeconds: elapsedRef.current,
          }),
        });

        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();

        dispatch({
          type: 'SET_EVALUATION',
          evaluation: data.evaluation,
          transcript: fullTranscriptRef.current,
        });
      } catch (err) {
        console.error('Evaluation request failed:', err);
        dispatch({
          type: 'SET_EVALUATION',
          evaluation: {
            legal_reasoning: 50,
            clarity: 50,
            logical_consistency: 50,
            emotional_control: 50,
            credibility: 50,
            legal_accuracy: 50,
            overall_score: 50,
            strengths: ['Session completed'],
            weaknesses: ['Evaluation server was unreachable'],
            recommendations: ['Ensure the backend is running for full AI analysis'],
            legal_references: [],
            legal_quotes: [],
            credibility_assessment: 'Could not be assessed.',
            emotion_profile: 'Could not be assessed.',
            summary: 'Session captured but full evaluation could not be generated.',
          },
          transcript: fullTranscriptRef.current,
        });
      }
      cleanupAll();
    }
  }

  function handleClose() {
    cleanupAll();
    closeSimulator();
  }

  async function handleSwitchCamera() {
    if (!cameraSwitchAvailable || sessionState !== 'PREVIEW') return;

    const nextFacing = preferredCameraFacingModeRef.current === 'user' ? 'environment' : 'user';
    const previousFacing = preferredCameraFacingModeRef.current;
    preferredCameraFacingModeRef.current = nextFacing;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      dispatch({ type: 'SET_MEDIA_STREAM', stream: null });
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: nextFacing,
        },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      dispatch({ type: 'SET_MEDIA_STREAM', stream });
      setCameraError(null);
      detectCameraSwitchAvailability();
    } catch (err: any) {
      preferredCameraFacingModeRef.current = previousFacing;
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: previousFacing,
          },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        dispatch({ type: 'SET_MEDIA_STREAM', stream: fallbackStream });
      } catch {
        // Ignore fallback errors; the user will see the camera error below.
      }
      setCameraError('Could not switch camera. Please check your device camera permissions.');
    }
  }

  if (!isModalOpen) return null;

  const isActiveSession = ['RECORDING', 'ANALYZING', 'INTERRUPTING', 'RESUMING'].includes(sessionState);
  const canEnd = isActiveSession && state.elapsedSeconds >= state.minDuration;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-amber-700 text-sm font-bold">⚖</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Court Simulator</h2>
              <p className="text-[10px] text-gray-500">
                {sessionState === 'PREVIEW' && 'Prepare your testimony'}
                {sessionState === 'RECORDING' && 'Session in progress'}
                {sessionState === 'ANALYZING' && 'Analyzing...'}
                {sessionState === 'INTERRUPTING' && 'Judge is speaking'}
                {sessionState === 'RESUMING' && 'Resuming...'}
                {sessionState === 'FINALIZING' && 'Generating evaluation...'}
                {sessionState === 'COMPLETE' && 'Session complete'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActiveSession && (
              <>
                {isLocalModeRef.current && (
                  <div className="flex items-center gap-1 text-orange-500" title="Running via REST API">
                    <WifiOff className="h-3 w-3" />
                  </div>
                )}
                <div className="flex items-center gap-1 text-red-500">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium">REC</span>
                </div>
                <SessionTimer
                  elapsedSeconds={state.elapsedSeconds}
                  maxDuration={state.maxDuration}
                  minDuration={state.minDuration}
                />
              </>
            )}
            {sessionState !== 'FINALIZING' && (
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* PREVIEW State */}
          {sessionState === 'PREVIEW' && (
            <div className="p-6 space-y-6">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden max-w-lg mx-auto">
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                    <div>
                      <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-300 text-sm">{cameraError}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={setVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    {!mediaStream && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                    {cameraSwitchAvailable && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-800"
                        onClick={handleSwitchCamera}
                      >
                        <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                        Switch camera
                      </Button>
                    )}
                  </>
                )}
              </div>

              {mediaStream && !cameraError && (
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 text-green-600">
                    <Video className="h-4 w-4" />
                    <span className="text-sm">Camera ready</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Mic className="h-4 w-4" />
                    <span className="text-sm">Microphone ready</span>
                  </div>
                </div>
              )}

              {state.error && state.error.length > 0 && (
                <div className="max-w-md mx-auto flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm">{state.error}</p>
                </div>
              )}

              <div className="max-w-md mx-auto text-center space-y-3">
                <p className="text-gray-600 text-sm leading-relaxed">
                  You will deliver oral testimony before an AI judge. Speak clearly about
                  any legal matter. The judge may interrupt to seek clarification.
                  Session duration is manually set to at least <strong>5 minutes</strong>.
                </p>
                <div className="text-left bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <label htmlFor="session-minutes" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Session duration (minutes)
                  </label>
                  <input
                    id="session-minutes"
                    type="number"
                    min={MIN_MANUAL_DURATION_MINUTES}
                    max={MAX_MANUAL_DURATION_MINUTES}
                    value={manualDurationMinutes}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const clamped = Math.max(
                        MIN_MANUAL_DURATION_MINUTES,
                        Math.min(MAX_MANUAL_DURATION_MINUTES, Number.isFinite(raw) ? raw : DEFAULT_MANUAL_DURATION_MINUTES),
                      );
                      setManualDurationMinutes(clamped);
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Minimum 5 minutes, maximum 60 minutes.
                  </p>
                </div>
                <Button
                  onClick={handleBeginSession}
                  disabled={!mediaStream || !!cameraError || isStarting}
                  className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-3 text-base font-semibold rounded-xl shadow-lg disabled:opacity-50"
                  size="lg"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Begin Session
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ACTIVE SESSION States — single persistent video element */}
          {isActiveSession && (
            <div className="flex flex-col lg:flex-row h-full min-h-[400px]">
              {/* Video Panel */}
              <div className="lg:w-1/2 p-3 relative">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    ref={setVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    REC
                  </div>

                  {sessionState === 'INTERRUPTING' && state.currentInterruption && (
                    <JudgeInterruption
                      interruption={state.currentInterruption}
                      isSpeaking={ttsSpeaking}
                      onRepeat={repeatInterruptionAudio}
                      onContinue={resumeAfterInterruption}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <MicLevelIndicator level={state.micLevel} />
                  <EmotionIndicator emotion={state.currentEmotion} compact />
                </div>

                {canEnd && (
                  <div className="mt-3">
                    <Button
                      onClick={endSession}
                      variant="destructive"
                      className="w-full"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                )}
              </div>

              {/* Transcript Panel */}
              <div className="lg:w-1/2 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col min-h-[200px]">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Live Transcript</h3>
                  <EmotionIndicator emotion={state.currentEmotion} compact />
                </div>
                <TranscriptDisplay
                  entries={state.transcriptEntries}
                  interruptions={state.interruptions}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {/* FINALIZING State */}
          {sessionState === 'FINALIZING' && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto" />
                <h3 className="text-lg font-semibold text-gray-800">Generating Your Evaluation</h3>
                <p className="text-sm text-gray-500">
                  The AI judge is reviewing your testimony, analyzing emotions,
                  and scoring your performance...
                </p>
              </div>
            </div>
          )}

          {/* COMPLETE State */}
          {sessionState === 'COMPLETE' && state.evaluation && (
            <ScoreDashboard
              evaluation={state.evaluation}
              transcript={state.fullTranscript}
              interruptions={state.interruptions}
              emotionTimeline={state.emotionTimeline}
              durationSeconds={state.elapsedSeconds}
            />
          )}
        </div>

        {/* Footer for COMPLETE state */}
        {sessionState === 'COMPLETE' && (
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
            <Button onClick={handleClose} className="w-full" variant="outline">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
