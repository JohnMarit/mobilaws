import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Video, VideoOff, Mic, Play, Square, Loader2,
  AlertCircle, WifiOff, RotateCw, Smartphone, Monitor,
  Scale, User, Shield, ScanFace, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourtSimulator, type UserRole } from '@/contexts/CourtSimulatorContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { AudioStreamer } from '@/lib/court-simulator/audio-streamer';
import { VideoFrameCapture } from '@/lib/court-simulator/video-capture';
import { TTSEngine } from '@/lib/court-simulator/tts-engine';
import { BrowserSpeechRecognition } from '@/lib/court-simulator/speech-recognition';
import { saveCourtSession, scoreToGrade } from '@/lib/court-simulator/session-history';
import { detectFace, type FaceStatus } from '@/lib/court-simulator/face-detector';
import MicLevelIndicator from './MicLevelIndicator';
import SessionTimer from './SessionTimer';
import EmotionIndicator from './EmotionIndicator';
import TranscriptDisplay from './TranscriptDisplay';
import JudgeInterruption from './JudgeInterruption';
import ScoreDashboard from './ScoreDashboard';

const ROLE_OPTIONS: Array<{
  id: UserRole;
  label: string;
  subtitle: string;
  Icon: React.FC<{ className?: string }>;
  description: string;
}> = [
  {
    id: 'counsellor',
    label: 'Counsellor',
    subtitle: 'Legal Representative',
    Icon: Scale,
    description: 'Advocate or lawyer presenting on behalf of a client. Held to the highest legal standard.',
  },
  {
    id: 'claimant',
    label: 'Claimant',
    subtitle: 'Petitioner / Complainant',
    Icon: User,
    description: 'Civilian raising a concern or seeking justice for a wrong done to them.',
  },
  {
    id: 'accused',
    label: 'Accused',
    subtitle: 'Defendant',
    Icon: Shield,
    description: 'Person being tried or answering charges. Presumption of innocence applies.',
  },
];

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/\/api\/?$/, '');

const WS_BASE = BACKEND_BASE
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

const ANALYSIS_INTERVAL_MS        = 7000;
const SEVERITY_THRESHOLD           = 0.45;
const MIN_SECONDS_BEFORE_INTERRUPT = 12;
const INTERRUPT_COOLDOWN_MS        = 12000;
const MIN_MANUAL_DURATION_MINUTES  = 5;
const DEFAULT_MANUAL_DURATION_MINUTES = 5;
const MAX_MANUAL_DURATION_MINUTES  = 60;
const INTERRUPTION_TTS_TIMEOUT_MS  = 20000;
const PAUSE_TRIGGER_MS             = 3000; // silence → judge comment

export default function CourtSimulatorModal() {
  const { state, dispatch, closeSimulator } = useCourtSimulator();
  const { user } = useAuth();

  /* ── Refs ── */
  const videoRef          = useRef<HTMLVideoElement | null>(null);
  const wsRef             = useRef<WebSocket | null>(null);
  const audioStreamerRef  = useRef<AudioStreamer | null>(null);
  const videoCaptureRef   = useRef<VideoFrameCapture | null>(null);
  const ttsRef            = useRef<TTSEngine | null>(null);
  const speechRecRef      = useRef<BrowserSpeechRecognition | null>(null);
  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const analysisTimerRef  = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef     = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef        = useRef(0);
  const fullTranscriptRef = useRef('');
  const recentChunkRef    = useRef('');
  const isLocalModeRef    = useRef(false);
  const lastInterruptTimeRef  = useRef(0);
  const previousQuestionsRef  = useRef<string[]>([]);
  const interruptingRef       = useRef(false);
  const sessionStartTimeRef   = useRef(0);
  const mediaStreamRef        = useRef<MediaStream | null>(null);
  const interruptionQuestionRef = useRef('');
  const preferredFacingRef    = useRef<'user' | 'environment'>('user');

  const faceCheckTimerRef     = useRef<NodeJS.Timeout | null>(null);

  /* ── State ── */
  const [ttsSpeaking,         setTtsSpeaking]         = useState(false);
  const [cameraError,         setCameraError]         = useState<string | null>(null);
  const [isStarting,          setIsStarting]          = useState(false);
  const [cameraSwitchAvail,   setCameraSwitchAvail]   = useState(false);
  const [manualDurationMin,   setManualDurationMin]   = useState(DEFAULT_MANUAL_DURATION_MINUTES);
  const [isPortrait,          setIsPortrait]          = useState(true);
  // Role selection
  const [selectedRole,        setSelectedRole]        = useState<UserRole | null>(null);
  const [participantName,     setParticipantName]     = useState('');
  // Face detection
  const [faceStatus,          setFaceStatus]          = useState<FaceStatus>('scanning');

  const { isModalOpen, sessionState, mediaStream } = state;

  /* ── keep refs in sync ── */
  useEffect(() => { fullTranscriptRef.current = state.fullTranscript; }, [state.fullTranscript]);
  useEffect(() => { mediaStreamRef.current = mediaStream; },            [mediaStream]);

  /* Callback ref for <video> elements */
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && mediaStreamRef.current) el.srcObject = mediaStreamRef.current;
  }, []);

  useEffect(() => {
    if (videoRef.current && mediaStream) videoRef.current.srcObject = mediaStream;
  }, [mediaStream]);

  /* ── Init camera on PREVIEW ── */
  useEffect(() => {
    if (sessionState !== 'PREVIEW') return;
    let cancelled = false;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: preferredFacingRef.current },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        dispatch({ type: 'SET_MEDIA_STREAM', stream });
        setCameraError(null);
        detectCameraSwitch();
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

  /* ── Face detection loop during PREVIEW ── */
  useEffect(() => {
    if (sessionState !== 'PREVIEW' || !mediaStream) {
      setFaceStatus('scanning');
      if (faceCheckTimerRef.current) { clearInterval(faceCheckTimerRef.current); faceCheckTimerRef.current = null; }
      return;
    }

    async function runCheck() {
      if (!videoRef.current) return;
      const result = await detectFace(videoRef.current);
      setFaceStatus(result);
    }

    // Small delay so the video element has had time to populate
    const boot = setTimeout(runCheck, 1200);
    faceCheckTimerRef.current = setInterval(runCheck, 4000);

    return () => {
      clearTimeout(boot);
      if (faceCheckTimerRef.current) { clearInterval(faceCheckTimerRef.current); faceCheckTimerRef.current = null; }
    };
  }, [sessionState, mediaStream]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Save session to localStorage when COMPLETE ── */
  useEffect(() => {
    if (state.sessionState === 'COMPLETE' && state.evaluation && state.sessionId) {
      saveCourtSession({
        id: state.sessionId,
        date: Date.now(),
        durationSeconds: state.elapsedSeconds,
        overallScore: state.evaluation.overall_score,
        grade: scoreToGrade(state.evaluation.overall_score),
        summary: state.evaluation.summary,
        transcript: state.fullTranscript,
        interruptionCount: state.interruptions.length,
        userRole: state.userRole ?? undefined,
        userName: state.userName || undefined,
      });
    }
  }, [state.sessionState]); // eslint-disable-line react-hooks/exhaustive-deps

  async function detectCameraSwitch() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameraSwitchAvail(devices.filter(d => d.kind === 'videoinput').length > 1);
    } catch {
      setCameraSwitchAvail(false);
    }
  }

  /* ── Session tick ── */
  useEffect(() => {
    const active = ['RECORDING', 'ANALYZING', 'INTERRUPTING', 'RESUMING'];
    if (active.includes(sessionState) && !timerRef.current) {
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        dispatch({ type: 'TICK', seconds: elapsedRef.current });
        if (elapsedRef.current >= state.maxDuration) endSession();
      }, 1000);
    }
  }, [sessionState]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Cleanup on modal close ── */
  useEffect(() => { if (!isModalOpen) cleanupAll(); }, [isModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function cleanupAll() {
    if (timerRef.current)         { clearInterval(timerRef.current);        timerRef.current         = null; }
    if (analysisTimerRef.current) { clearInterval(analysisTimerRef.current); analysisTimerRef.current = null; }
    if (pauseTimerRef.current)    { clearTimeout(pauseTimerRef.current);     pauseTimerRef.current    = null; }
    if (faceCheckTimerRef.current){ clearInterval(faceCheckTimerRef.current);faceCheckTimerRef.current= null; }

    elapsedRef.current              = 0;
    fullTranscriptRef.current       = '';
    recentChunkRef.current          = '';
    isLocalModeRef.current          = false;
    lastInterruptTimeRef.current    = 0;
    previousQuestionsRef.current    = [];
    interruptingRef.current         = false;
    sessionStartTimeRef.current     = 0;
    interruptionQuestionRef.current = '';

    audioStreamerRef.current?.stop();  audioStreamerRef.current = null;
    videoCaptureRef.current?.stop();   videoCaptureRef.current  = null;
    ttsRef.current?.cancel();          ttsRef.current           = null;
    speechRecRef.current?.stop();      speechRecRef.current     = null;

    if (wsRef.current) { try { wsRef.current.close(1000); } catch {} wsRef.current = null; }

    setCameraError(null);
    setTtsSpeaking(false);
    setIsStarting(false);
    setFaceStatus('scanning');
    setSelectedRole(null);
    setParticipantName('');
  }

  /* ════════ WebSocket handling ════════ */
  function handleWSMessage(msg: any) {
    switch (msg.type) {
      case 'session_ready':
        dispatch({ type: 'START_SESSION', sessionId: msg.sessionId, maxDuration: msg.maxDuration || 300, minDuration: msg.minDuration || 60 });
        break;
      case 'transcript':
        handleTranscriptFromServer(msg.text, msg.isFinal, msg.timestamp);
        break;
      case 'emotion':
        dispatch({ type: 'SET_EMOTION', emotion: { ...msg.emotions, primary: msg.primary || 'neutral', timestamp: msg.timestamp || Date.now() } });
        break;
      case 'interrupt':
        triggerInterruption({ question: msg.question, reason: msg.reason, severity: msg.severity, timestamp: msg.timestamp || Date.now() });
        break;
      case 'finalizing':
        dispatch({ type: 'START_FINALIZING' });
        break;
      case 'evaluation':
        dispatch({ type: 'SET_EVALUATION', evaluation: msg.evaluation, transcript: msg.transcript || '' });
        cleanupAll();
        break;
      case 'error':
        console.error('Court simulator WS error:', msg.message);
        break;
    }
  }

  function handleTranscriptFromServer(text: string, isFinal: boolean, timestamp?: number) {
    dispatch({ type: 'ADD_TRANSCRIPT', entry: { text, isFinal, timestamp: timestamp || Date.now() } });
    if (isFinal && text.trim()) {
      const updated = (fullTranscriptRef.current + ' ' + text).trim();
      fullTranscriptRef.current = updated;
      recentChunkRef.current    = text;
      dispatch({ type: 'SET_FULL_TRANSCRIPT', text: updated });
    }
  }

  /* ════════ Interruption logic ════════ */
  async function triggerInterruption(interruption: any) {
    if (interruptingRef.current) return;
    interruptingRef.current = true;

    interruptionQuestionRef.current = interruption.question || '';

    dispatch({ type: 'TRIGGER_INTERRUPT', interruption });

    audioStreamerRef.current?.pause();
    speechRecRef.current?.pause();
    if (pauseTimerRef.current) { clearTimeout(pauseTimerRef.current); pauseTimerRef.current = null; }

    if (!ttsRef.current) ttsRef.current = new TTSEngine();

    setTtsSpeaking(true);
    await speakWithTimeout(interruption.question);
    setTtsSpeaking(false);
    // Controls (Repeat / Continue) appear because isSpeaking → false
  }

  async function repeatInterruptionAudio() {
    if (!interruptionQuestionRef.current) return;
    if (!ttsRef.current) ttsRef.current = new TTSEngine();
    setTtsSpeaking(true);
    await speakWithTimeout(interruptionQuestionRef.current);
    setTtsSpeaking(false);
  }

  function resumeAfterInterruption() {
    dispatch({ type: 'RESUME_RECORDING' });
    audioStreamerRef.current?.resume();
    speechRecRef.current?.resume();
    lastInterruptTimeRef.current    = Date.now();
    interruptingRef.current         = false;
    interruptionQuestionRef.current = '';
    setTimeout(() => dispatch({ type: 'TO_RECORDING' }), 500);
  }

  async function speakWithTimeout(text: string) {
    if (!text || !ttsRef.current) return;
    await Promise.race([
      ttsRef.current.speak(text),
      new Promise<void>(r => setTimeout(r, INTERRUPTION_TTS_TIMEOUT_MS)),
    ]);
  }

  /* ════════ Pause detection ════════ */
  function resetPauseTimer() {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (interruptingRef.current || sessionState !== 'RECORDING') return;
    pauseTimerRef.current = setTimeout(() => {
      runPauseAnalysis();
    }, PAUSE_TRIGGER_MS);
  }

  async function runPauseAnalysis() {
    if (interruptingRef.current) return;
    const transcript = fullTranscriptRef.current;
    const chunk      = recentChunkRef.current;
    if (!transcript && !chunk) return;

    const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000;
    if (elapsed < MIN_SECONDS_BEFORE_INTERRUPT) return;

    const timeSinceLast = lastInterruptTimeRef.current > 0
      ? Date.now() - lastInterruptTimeRef.current : Infinity;
    if (timeSinceLast < INTERRUPT_COOLDOWN_MS) return;

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
          triggerReason: 'pause',
          userRole: state.userRole ?? selectedRole,
          userName: state.userName || participantName.trim(),
        }),
      });
      if (!res.ok) return;
      const result = await res.json();
      recentChunkRef.current = '';
      if (result.interrupt && result.severity >= SEVERITY_THRESHOLD) {
        previousQuestionsRef.current.push(result.question);
        triggerInterruption({ question: result.question, reason: result.reason, severity: result.severity, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Pause analysis failed:', err);
    }
  }

  /* ════════ Periodic analysis ════════ */
  async function runLocalAnalysis() {
    if (interruptingRef.current) return;
    const elapsed = (Date.now() - sessionStartTimeRef.current) / 1000;
    if (elapsed < MIN_SECONDS_BEFORE_INTERRUPT) return;
    const timeSinceLast = lastInterruptTimeRef.current > 0
      ? Date.now() - lastInterruptTimeRef.current : Infinity;
    if (timeSinceLast < INTERRUPT_COOLDOWN_MS) return;
    const chunk      = recentChunkRef.current;
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
          userRole: state.userRole ?? selectedRole,
          userName: state.userName || participantName.trim(),
        }),
      });
      if (!res.ok) return;
      const result = await res.json();
      recentChunkRef.current = '';
      if (result.interrupt && result.severity >= SEVERITY_THRESHOLD) {
        previousQuestionsRef.current.push(result.question);
        triggerInterruption({ question: result.question, reason: result.reason, severity: result.severity, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Local analysis failed:', err);
    }
  }

  /* ════════ Session lifecycle ════════ */
  function connectWebSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_BASE}/ws/court-simulator`);
      wsRef.current = ws;
      const timeout = setTimeout(() => { ws.close(); reject(new Error('WS timeout')); }, 5000);
      ws.onopen = () => { clearTimeout(timeout); dispatch({ type: 'SET_CONNECTED', connected: true }); resolve(ws); };
      ws.onmessage = ev => { try { handleWSMessage(JSON.parse(ev.data)); } catch {} };
      ws.onclose   = () => dispatch({ type: 'SET_CONNECTED', connected: false });
      ws.onerror   = () => { clearTimeout(timeout); reject(new Error('WS failed')); };
    });
  }

  async function handleBeginSession() {
    if (!mediaStream || isStarting || !selectedRole) return;
    if (faceStatus === 'not-detected') return; // hard block when face confirmed absent

    setIsStarting(true);
    dispatch({ type: 'SET_ERROR', error: '' });
    dispatch({ type: 'SET_ROLE', role: selectedRole, name: participantName.trim() });

    const sessionId = `cs_${Date.now()}`;
    const maxDurationSecs = Math.max(MIN_MANUAL_DURATION_MINUTES, Math.min(MAX_MANUAL_DURATION_MINUTES, manualDurationMin)) * 60;
    sessionStartTimeRef.current = Date.now();
    let ws: WebSocket | null = null;

    // Pre-warm TTS so voice list is loaded before first interruption
    if (!ttsRef.current) ttsRef.current = new TTSEngine();

    try {
      ws = await connectWebSocket();
      ws.send(JSON.stringify({
        type: 'session_start',
        userId: user?.id || 'anonymous',
        sessionId,
        maxDuration: maxDurationSecs,
        userRole: selectedRole,
        userName: participantName.trim(),
      }));
    } catch {
      ws = null;
      isLocalModeRef.current = true;
      dispatch({ type: 'START_SESSION', sessionId, maxDuration: maxDurationSecs, minDuration: 60 });
    }

    try {
      const streamer = new AudioStreamer();
      audioStreamerRef.current = streamer;
      await streamer.start(mediaStream, ws, level => dispatch({ type: 'SET_MIC_LEVEL', level }));
    } catch (e) { console.error('AudioStreamer init:', e); }

    try {
      if (videoRef.current && ws) {
        const capture = new VideoFrameCapture();
        videoCaptureRef.current = capture;
        capture.start(videoRef.current, 4000, b64 => {
          if (ws!.readyState === WebSocket.OPEN)
            ws!.send(JSON.stringify({ type: 'video_frame', data: b64 }));
        });
      }
    } catch (e) { console.error('VideoCapture init:', e); }

    try {
      const speechRec = new BrowserSpeechRecognition();
      speechRecRef.current = speechRec;
      if (speechRec.isAvailable()) {
        speechRec.start((text, isFinal) => {
          dispatch({ type: 'ADD_TRANSCRIPT', entry: { text, isFinal, timestamp: Date.now() } });
          if (isFinal && text.trim()) {
            const updated = (fullTranscriptRef.current + ' ' + text).trim();
            fullTranscriptRef.current = updated;
            recentChunkRef.current    = text;
            dispatch({ type: 'SET_FULL_TRANSCRIPT', text: updated });
            if (ws && ws.readyState === WebSocket.OPEN)
              ws.send(JSON.stringify({ type: 'transcript_fallback', text, isFinal: true }));
            // Reset the silence-pause timer every time we get speech
            resetPauseTimer();
          }
        });
      }
    } catch (e) { console.error('SpeechRec init:', e); }

    analysisTimerRef.current = setInterval(runLocalAnalysis, ANALYSIS_INTERVAL_MS);
    setIsStarting(false);
  }

  async function endSession() {
    if (timerRef.current)       { clearInterval(timerRef.current);       timerRef.current = null; }
    if (analysisTimerRef.current){ clearInterval(analysisTimerRef.current); analysisTimerRef.current = null; }
    if (pauseTimerRef.current)  { clearTimeout(pauseTimerRef.current);   pauseTimerRef.current = null; }

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
        dispatch({ type: 'SET_EVALUATION', evaluation: data.evaluation, transcript: fullTranscriptRef.current });
      } catch {
        dispatch({
          type: 'SET_EVALUATION',
          evaluation: {
            legal_reasoning: 50, clarity: 50, logical_consistency: 50,
            emotional_control: 50, credibility: 50, legal_accuracy: 50,
            overall_score: 50,
            strengths: ['Session completed'],
            weaknesses: ['Evaluation server was unreachable'],
            recommendations: ['Ensure the backend is running for full AI analysis'],
            legal_references: [], legal_quotes: [],
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

  function handleClose() { cleanupAll(); closeSimulator(); }

  /* ════════ Camera switch (preview only) ════════ */
  async function handleSwitchCamera() {
    if (!cameraSwitchAvail || sessionState !== 'PREVIEW') return;
    const next = preferredFacingRef.current === 'user' ? 'environment' : 'user';
    const prev = preferredFacingRef.current;
    preferredFacingRef.current = next;
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    dispatch({ type: 'SET_MEDIA_STREAM', stream: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next }, audio: { echoCancellation: true, noiseSuppression: true },
      });
      dispatch({ type: 'SET_MEDIA_STREAM', stream });
      setCameraError(null);
    } catch {
      preferredFacingRef.current = prev;
      try {
        const fb = await navigator.mediaDevices.getUserMedia({ video: { facingMode: prev }, audio: true });
        dispatch({ type: 'SET_MEDIA_STREAM', stream: fb });
      } catch {}
      setCameraError('Could not switch camera.');
    }
  }

  /* ════════ Render ════════ */
  if (!isModalOpen) return null;

  const isActiveSession = ['RECORDING', 'ANALYZING', 'INTERRUPTING', 'RESUMING'].includes(sessionState);
  const canEnd          = isActiveSession && state.elapsedSeconds >= state.minDuration;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-amber-700 text-sm font-bold">⚖</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Court Simulator</h2>
              <p className="text-[10px] text-gray-500">
                {sessionState === 'PREVIEW'      && 'Prepare your testimony'}
                {sessionState === 'RECORDING'    && 'Session in progress'}
                {sessionState === 'ANALYZING'    && 'Analyzing...'}
                {sessionState === 'INTERRUPTING' && 'Judge is speaking'}
                {sessionState === 'RESUMING'     && 'Resuming...'}
                {sessionState === 'FINALIZING'   && 'Generating evaluation...'}
                {sessionState === 'COMPLETE'     && 'Session complete'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActiveSession && (
              <>
                {isLocalModeRef.current && (
                  <div className="flex items-center gap-1 text-orange-500" title="REST mode">
                    <WifiOff className="h-3 w-3" />
                  </div>
                )}
                <div className="flex items-center gap-1 text-red-500">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium">REC</span>
                </div>
                <SessionTimer elapsedSeconds={state.elapsedSeconds} maxDuration={state.maxDuration} minDuration={state.minDuration} />
                {/* Portrait / Landscape toggle */}
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-gray-500 hover:text-amber-700"
                  title={isPortrait ? 'Switch to landscape' : 'Switch to portrait'}
                  onClick={() => setIsPortrait(p => !p)}
                >
                  {isPortrait ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                </Button>
              </>
            )}
            {sessionState !== 'FINALIZING' && (
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* PREVIEW */}
          {sessionState === 'PREVIEW' && (
            <div className="p-5 space-y-5 max-w-2xl mx-auto w-full">

              {/* ── Step 1: Role selection ── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Step 1 — Select your role
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {ROLE_OPTIONS.map(({ id, label, subtitle, Icon, description }) => {
                    const active = selectedRole === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedRole(id)}
                        className={[
                          'relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-400',
                          active
                            ? 'border-amber-700 bg-amber-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/40',
                        ].join(' ')}
                        title={description}
                      >
                        <div className={[
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          active ? 'bg-amber-100' : 'bg-gray-100',
                        ].join(' ')}>
                          <Icon className={`h-5 w-5 ${active ? 'text-amber-700' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${active ? 'text-amber-800' : 'text-gray-800'}`}>{label}</p>
                          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{subtitle}</p>
                        </div>
                        {active && (
                          <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-amber-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedRole && (
                  <p className="mt-2 text-xs text-gray-500 text-center leading-relaxed">
                    {ROLE_OPTIONS.find(r => r.id === selectedRole)?.description}
                  </p>
                )}
              </div>

              {/* ── Step 2: Name (optional) ── */}
              {selectedRole && (
                <div>
                  <label htmlFor="participant-name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Step 2 — Your name{' '}
                    <span className="normal-case font-normal text-gray-400">(optional — the judge will address you by name)</span>
                  </label>
                  <input
                    id="participant-name"
                    type="text"
                    placeholder={
                      selectedRole === 'counsellor' ? 'e.g. Amara Deng'
                      : selectedRole === 'claimant' ? 'e.g. John Okello'
                      : 'e.g. Samuel Lado'
                    }
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    maxLength={60}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              )}

              {/* ── Step 3: Camera + face detection ── */}
              {selectedRole && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Step 3 — Camera &amp; face verification
                  </p>

                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden max-w-sm mx-auto">
                    {cameraError ? (
                      <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                        <div>
                          <VideoOff className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-300 text-sm">{cameraError}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video ref={setVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
                        {!mediaStream && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                          </div>
                        )}
                        {/* Face detection badge */}
                        {mediaStream && (
                          <div className={[
                            'absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm',
                            faceStatus === 'detected'      ? 'bg-green-600/90 text-white'
                            : faceStatus === 'not-detected' ? 'bg-red-600/90 text-white'
                            : faceStatus === 'unsupported'  ? 'bg-gray-700/80 text-gray-200'
                            :                                  'bg-black/60 text-gray-200',
                          ].join(' ')}>
                            {faceStatus === 'detected' && <><CheckCircle2 className="h-3.5 w-3.5" /> Face detected</>}
                            {faceStatus === 'not-detected' && <><XCircle className="h-3.5 w-3.5" /> No face detected</>}
                            {faceStatus === 'scanning' && <><ScanFace className="h-3.5 w-3.5 animate-pulse" /> Scanning…</>}
                            {faceStatus === 'unsupported' && <><ScanFace className="h-3.5 w-3.5" /> Position face in frame</>}
                          </div>
                        )}
                        {cameraSwitchAvail && (
                          <Button
                            type="button" variant="secondary" size="sm"
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-800 text-xs px-2 py-1 h-auto"
                            onClick={handleSwitchCamera}
                          >
                            <RotateCw className="h-3 w-3 mr-1" />Flip
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Status row */}
                  {mediaStream && !cameraError && (
                    <div className="flex items-center justify-center gap-5 mt-2">
                      <div className="flex items-center gap-1.5 text-green-600 text-xs"><Video className="h-3.5 w-3.5" />Camera ready</div>
                      <div className="flex items-center gap-1.5 text-green-600 text-xs"><Mic className="h-3.5 w-3.5" />Microphone ready</div>
                    </div>
                  )}

                  {/* Hard block: face not detected */}
                  {faceStatus === 'not-detected' && (
                    <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-red-700 text-sm">
                        No face was detected in the camera feed. Please position yourself directly in front of the camera and ensure the lighting is adequate, then wait for the scan to retry.
                      </p>
                    </div>
                  )}

                  {/* Unsupported notice */}
                  {faceStatus === 'unsupported' && (
                    <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-amber-800 text-xs leading-relaxed">
                        Automatic face detection is unavailable in this browser. Please ensure your face is clearly visible in the camera frame before starting.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {state.error && state.error.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-sm">{state.error}</p>
                </div>
              )}

              {/* ── Step 4: Duration + begin ── */}
              {selectedRole && (
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <label htmlFor="session-minutes" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Session duration (minutes)
                    </label>
                    <input
                      id="session-minutes"
                      type="number"
                      min={MIN_MANUAL_DURATION_MINUTES}
                      max={MAX_MANUAL_DURATION_MINUTES}
                      value={manualDurationMin}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setManualDurationMin(Math.max(MIN_MANUAL_DURATION_MINUTES, Math.min(MAX_MANUAL_DURATION_MINUTES, Number.isFinite(v) ? v : DEFAULT_MANUAL_DURATION_MINUTES)));
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Min 5 min · Max 60 min</p>
                  </div>

                  {(() => {
                    const faceOk = faceStatus === 'detected' || faceStatus === 'unsupported';
                    const canStart = !!mediaStream && !cameraError && faceOk && !!selectedRole && !isStarting;
                    return (
                      <Button
                        onClick={handleBeginSession}
                        disabled={!canStart}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 text-base font-semibold rounded-xl shadow-lg disabled:opacity-50"
                        size="lg"
                      >
                        {isStarting ? (
                          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Connecting…</>
                        ) : faceStatus === 'scanning' ? (
                          <><ScanFace className="h-5 w-5 mr-2 animate-pulse" />Verifying face…</>
                        ) : faceStatus === 'not-detected' ? (
                          <><XCircle className="h-5 w-5 mr-2" />Face required to start</>
                        ) : (
                          <><Play className="h-5 w-5 mr-2" />Begin Session</>
                        )}
                      </Button>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE SESSION — portrait = stacked, landscape = side-by-side */}
          {isActiveSession && (
            <div className={`flex ${isPortrait ? 'flex-col' : 'flex-row'} h-full min-h-[400px]`}>
              {/* Video Panel */}
              <div className={`${isPortrait ? 'w-full' : 'w-1/2'} p-3 relative`}>
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <video ref={setVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
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
                    <Button onClick={endSession} variant="destructive" className="w-full">
                      <Square className="h-4 w-4 mr-2" />End Session
                    </Button>
                  </div>
                )}
              </div>

              {/* Transcript Panel */}
              <div className={`${isPortrait ? 'w-full border-t' : 'w-1/2 border-l'} border-gray-100 flex flex-col min-h-[200px]`}>
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Live Transcript</h3>
                  <EmotionIndicator emotion={state.currentEmotion} compact />
                </div>
                <TranscriptDisplay entries={state.transcriptEntries} interruptions={state.interruptions} className="flex-1" />
              </div>
            </div>
          )}

          {/* FINALIZING */}
          {sessionState === 'FINALIZING' && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto" />
                <h3 className="text-lg font-semibold text-gray-800">Generating Your Evaluation</h3>
                <p className="text-sm text-gray-500">The AI judge is reviewing your testimony and scoring your performance...</p>
              </div>
            </div>
          )}

          {/* COMPLETE */}
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

        {/* Footer */}
        {sessionState === 'COMPLETE' && (
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
            <Button onClick={handleClose} className="w-full" variant="outline">Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}
