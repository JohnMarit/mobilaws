import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Video, VideoOff, Mic, Play, Square, Loader2,
  AlertCircle, WifiOff, RotateCw, Smartphone, Monitor,
  Scale, User, Shield, ScanFace, CheckCircle2, XCircle, Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourtSimulator, type UserRole } from '@/contexts/CourtSimulatorContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AudioStreamer } from '@/lib/court-simulator/audio-streamer';
import { VideoFrameCapture } from '@/lib/court-simulator/video-capture';
import { TTSEngine } from '@/lib/court-simulator/tts-engine';
import { BrowserSpeechRecognition } from '@/lib/court-simulator/speech-recognition';
import { saveCourtSession, scoreToGrade } from '@/lib/court-simulator/session-history';
import { detectFace, type FaceStatus } from '@/lib/court-simulator/face-detector';
import { canStartCourtSession, useMultipleTokens, getTokenUsage } from '@/lib/tokenService';
import { getAnonymousUserId } from '@/lib/browser-fingerprint';
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
  const { userSubscription, useToken: useSubscriptionToken } = useSubscription();

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
  const [sessionName,         setSessionName]         = useState('');
  // Face detection
  const [faceStatus,          setFaceStatus]          = useState<FaceStatus>('scanning');
  // Token checking
  const [tokenCheckStatus,    setTokenCheckStatus]    = useState<'checking' | 'ok' | 'insufficient' | null>(null);
  const [tokensAvailable,     setTokensAvailable]     = useState<number>(0);
  const [tokensNeeded,        setTokensNeeded]        = useState<number>(0);

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

  /* ── Check tokens when duration changes ── */
  useEffect(() => {
    if (sessionState !== 'PREVIEW' || !selectedRole) {
      setTokenCheckStatus(null);
      return;
    }

    async function checkTokens() {
      try {
        setTokenCheckStatus('checking');
        
        // Check subscription plan first (for authenticated users with paid plans)
        if (user?.id && userSubscription && userSubscription.planId !== 'free') {
          // User has a paid plan - check subscription tokens
          const tokensAvailable = userSubscription.tokensRemaining || 0;
          const tokensNeeded = manualDurationMin;
          
          setTokensAvailable(tokensAvailable);
          setTokensNeeded(tokensNeeded);
          
          if (tokensAvailable >= tokensNeeded) {
            setTokenCheckStatus('ok');
          } else {
            setTokenCheckStatus('insufficient');
          }
        } else {
          // Free user or anonymous - use tokenService
          const userId = user?.id || await getAnonymousUserId();
          const isAnonymous = !user?.id;
          
          const result = await canStartCourtSession(userId, isAnonymous, manualDurationMin);
          
          setTokensAvailable(result.tokensAvailable);
          setTokensNeeded(result.tokensNeeded);
          
          if (result.canStart) {
            setTokenCheckStatus('ok');
          } else {
            setTokenCheckStatus('insufficient');
          }
        }
      } catch (error) {
        console.error('Token check error:', error);
        setTokenCheckStatus('ok'); // Allow on error (graceful degradation)
      }
    }

    checkTokens();
  }, [sessionState, manualDurationMin, selectedRole, user, userSubscription]);

  /* ── Save session to localStorage when COMPLETE (REMOVED - now saves on End Session click) ── */
  // Removed auto-save - user clicks End Session to save

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
    setSessionName('');
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
    ttsRef.current.warmUp(); // user gesture (click) — re-unlock if needed
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

    // Check and deduct tokens
    try {
      // For paid plans, use subscription token system
      if (user?.id && userSubscription && userSubscription.planId !== 'free') {
        // Check if user has enough tokens
        if (userSubscription.tokensRemaining < manualDurationMin) {
          dispatch({ 
            type: 'SET_ERROR', 
            error: `Insufficient tokens. You need ${manualDurationMin} tokens for this session but only have ${userSubscription.tokensRemaining} available. Please upgrade your plan or wait for token renewal.` 
          });
          return;
        }
        
        // Deduct tokens via subscription system
        const success = await useSubscriptionToken(manualDurationMin);
        if (!success) {
          dispatch({ 
            type: 'SET_ERROR', 
            error: `Failed to deduct tokens. Please try again or contact support.` 
          });
          return;
        }
      } else {
        // For free users, use tokenService
        const userId = user?.id || await getAnonymousUserId();
        const isAnonymous = !user?.id;
        
        const tokenResult = await useMultipleTokens(userId, isAnonymous, manualDurationMin, user?.email);
        
        if (!tokenResult.success) {
          dispatch({ 
            type: 'SET_ERROR', 
            error: `Insufficient tokens. You need ${manualDurationMin} tokens for this session but only have ${tokenResult.tokensRemaining} available.${tokenResult.hoursUntilReset ? ` Tokens reset in ${tokenResult.hoursUntilReset} hours.` : ''}` 
          });
          return;
        }
      }
    } catch (error) {
      console.error('Token deduction error:', error);
      // Allow session to continue on error (graceful degradation)
    }

    setIsStarting(true);
    dispatch({ type: 'SET_ERROR', error: '' });
    dispatch({ type: 'SET_ROLE', role: selectedRole, name: participantName.trim() });

    const sessionId = `cs_${Date.now()}`;
    const maxDurationSecs = Math.max(MIN_MANUAL_DURATION_MINUTES, Math.min(MAX_MANUAL_DURATION_MINUTES, manualDurationMin)) * 60;
    sessionStartTimeRef.current = Date.now();
    let ws: WebSocket | null = null;

    // Pre-warm TTS — MUST happen inside this click handler (user gesture)
    // so that AudioContext + SpeechSynthesis are unlocked on mobile
    if (!ttsRef.current) ttsRef.current = new TTSEngine();
    ttsRef.current.warmUp();

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
        
        // Auto-save when session ends (e.g., timer expires)
        if (state.sessionId) {
          saveCourtSession({
            id: state.sessionId,
            sessionName: sessionName.trim() || undefined,
            date: Date.now(),
            durationSeconds: elapsedRef.current,
            overallScore: data.evaluation.overall_score,
            grade: scoreToGrade(data.evaluation.overall_score),
            summary: data.evaluation.summary,
            transcript: fullTranscriptRef.current,
            interruptionCount: state.interruptions.length,
            userRole: state.userRole ?? undefined,
            userName: state.userName || undefined,
            evaluation: data.evaluation,
            interruptions: state.interruptions,
            emotionTimeline: state.emotionTimeline,
          });
        }
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
        
        // Also auto-save even on error
        if (state.sessionId) {
          saveCourtSession({
            id: state.sessionId,
            sessionName: sessionName.trim() || undefined,
            date: Date.now(),
            durationSeconds: elapsedRef.current,
            overallScore: 50,
            grade: scoreToGrade(50),
            summary: 'Session captured but full evaluation could not be generated.',
            transcript: fullTranscriptRef.current,
            interruptionCount: state.interruptions.length,
            userRole: state.userRole ?? undefined,
            userName: state.userName || undefined,
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
            interruptions: state.interruptions,
            emotionTimeline: state.emotionTimeline,
          });
        }
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

  const modalSizeClass = isPortrait
    ? 'max-w-4xl max-h-[95vh]'
    : 'max-w-[98vw] max-h-[96vh] w-full';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-2 sm:p-4">
      <div className={`bg-white rounded-2xl w-full ${modalSizeClass} overflow-hidden shadow-2xl flex flex-col transition-all duration-300`}>

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
                  variant="outline" size="sm"
                  className="h-7 gap-1 px-2 text-[11px] text-gray-600 hover:text-amber-700 border-gray-200"
                  title={isPortrait ? 'Switch to landscape (wider)' : 'Switch to portrait (stacked)'}
                  onClick={() => setIsPortrait(p => !p)}
                >
                  {isPortrait ? <><Monitor className="h-3.5 w-3.5" /> Landscape</> : <><Smartphone className="h-3.5 w-3.5" /> Portrait</>}
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

          {/* PREVIEW — video sticky, controls scrollable */}
          {sessionState === 'PREVIEW' && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* ── Large Video Preview (STICKY at top) ── */}
              <div className="flex-shrink-0 bg-gradient-to-br from-gray-900 to-gray-800 p-4 flex items-center justify-center">
                <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                  {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                      <div>
                        <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-300 text-sm leading-relaxed">{cameraError}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video ref={setVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
                      {!mediaStream && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="h-10 w-10 text-white animate-spin" />
                        </div>
                      )}
                      {/* Face detection badge */}
                      {mediaStream && (
                        <div className={[
                          'absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md shadow-lg',
                          faceStatus === 'detected'      ? 'bg-green-600/95 text-white'
                          : faceStatus === 'not-detected' ? 'bg-red-600/95 text-white'
                          : faceStatus === 'unsupported'  ? 'bg-gray-700/90 text-gray-200'
                          :                                  'bg-black/70 text-gray-200',
                        ].join(' ')}>
                          {faceStatus === 'detected' && <><CheckCircle2 className="h-4 w-4" /> Face detected</>}
                          {faceStatus === 'not-detected' && <><XCircle className="h-4 w-4" /> No face detected</>}
                          {faceStatus === 'scanning' && <><ScanFace className="h-4 w-4 animate-pulse" /> Scanning…</>}
                          {faceStatus === 'unsupported' && <><ScanFace className="h-4 w-4" /> Position your face</>}
                        </div>
                      )}
                      {/* Camera status pills */}
                      {mediaStream && !cameraError && (
                        <div className="absolute top-3 left-3 flex gap-2">
                          <div className="flex items-center gap-1.5 bg-green-600/90 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-full">
                            <Video className="h-3 w-3" />Camera
                          </div>
                          <div className="flex items-center gap-1.5 bg-green-600/90 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-full">
                            <Mic className="h-3 w-3" />Mic
                          </div>
                        </div>
                      )}
                      {/* Camera switch button */}
                      {cameraSwitchAvail && (
                        <Button
                          type="button" variant="secondary" size="sm"
                          className="absolute top-3 right-3 bg-white/95 hover:bg-white text-gray-800 text-xs px-3 py-1.5 h-auto shadow-md"
                          onClick={handleSwitchCamera}
                        >
                          <RotateCw className="h-3.5 w-3.5 mr-1.5" />Flip Camera
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── Compact Setup Controls Below Video (SCROLLABLE) ── */}
              <div className="flex-1 overflow-y-auto bg-white border-t border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
                  
                  {/* Role Selection — 3 horizontal cards */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2.5">
                      1. Select Your Role
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {ROLE_OPTIONS.map(({ id, label, Icon }) => {
                        const active = selectedRole === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedRole(id)}
                            className={[
                              'relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400',
                              active
                                ? 'border-amber-600 bg-amber-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm',
                            ].join(' ')}
                          >
                            <div className={[
                              'flex h-9 w-9 items-center justify-center rounded-full',
                              active ? 'bg-amber-600' : 'bg-gray-100',
                            ].join(' ')}>
                              <Icon className={`h-4.5 w-4.5 ${active ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <p className={`text-sm font-semibold leading-tight ${active ? 'text-amber-900' : 'text-gray-700'}`}>
                              {label}
                            </p>
                            {active && (
                              <CheckCircle2 className="absolute -top-1.5 -right-1.5 h-5 w-5 text-amber-600 bg-white rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name + Duration — side by side on larger screens, stacked on mobile */}
                  {selectedRole && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="participant-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                          2. Your Name <span className="normal-case text-gray-400 font-normal text-[11px]">(optional)</span>
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
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="session-minutes" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                          3. Session Duration <span className="normal-case text-gray-400 font-normal text-[11px]">(minutes)</span>
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
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Min {MIN_MANUAL_DURATION_MINUTES} · Max {MAX_MANUAL_DURATION_MINUTES} minutes</p>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {tokenCheckStatus === 'insufficient' && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Coins className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-red-700 text-sm font-semibold">Insufficient Tokens</p>
                        <p className="text-red-600 text-xs leading-relaxed mt-1">
                          This session requires {tokensNeeded} token{tokensNeeded !== 1 ? 's' : ''} ({tokensNeeded} minute{tokensNeeded !== 1 ? 's' : ''}), 
                          but you only have {tokensAvailable} token{tokensAvailable !== 1 ? 's' : ''} available.
                          {userSubscription && userSubscription.planId !== 'free' ? (
                            <span> Please upgrade your plan for more tokens.</span>
                          ) : (
                            <span> Reduce the session duration or wait for your daily token reset.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {tokenCheckStatus === 'ok' && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Coins className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-green-700 text-xs leading-relaxed">
                        This session will use {tokensNeeded} token{tokensNeeded !== 1 ? 's' : ''} (1 token = 1 minute).
                        {userSubscription && userSubscription.planId !== 'free' && (
                          <span className="font-semibold"> {userSubscription.planId.charAt(0).toUpperCase() + userSubscription.planId.slice(1)} Plan: </span>
                        )}
                        You have {tokensAvailable} token{tokensAvailable !== 1 ? 's' : ''} available.
                      </p>
                    </div>
                  )}
                  {faceStatus === 'not-detected' && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-red-700 text-xs leading-relaxed">
                        No face detected. Please position yourself in front of the camera with good lighting.
                      </p>
                    </div>
                  )}
                  {faceStatus === 'unsupported' && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-amber-800 text-xs leading-relaxed">
                        Automatic face detection unavailable. Ensure your face is visible before starting.
                      </p>
                    </div>
                  )}
                  {state.error && state.error.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-red-700 text-sm">{state.error}</p>
                    </div>
                  )}

                  {/* Begin Button */}
                  {selectedRole && (() => {
                    const faceOk = faceStatus === 'detected' || faceStatus === 'unsupported';
                    const tokensOk = tokenCheckStatus === 'ok' || tokenCheckStatus === null; // Allow if not checked yet
                    const canStart = !!mediaStream && !cameraError && faceOk && tokensOk && !!selectedRole && !isStarting;
                    return (
                      <Button
                        onClick={handleBeginSession}
                        disabled={!canStart}
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3.5 text-base font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        size="lg"
                      >
                        {isStarting ? (
                          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Connecting…</>
                        ) : tokenCheckStatus === 'checking' ? (
                          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Checking Tokens…</>
                        ) : tokenCheckStatus === 'insufficient' ? (
                          <><Coins className="h-5 w-5 mr-2" />Insufficient Tokens</>
                        ) : faceStatus === 'scanning' ? (
                          <><ScanFace className="h-5 w-5 mr-2 animate-pulse" />Verifying Face…</>
                        ) : faceStatus === 'not-detected' ? (
                          <><XCircle className="h-5 w-5 mr-2" />Face Required to Start</>
                        ) : (
                          <><Play className="h-5 w-5 mr-2" />Begin Court Session</>
                        )}
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE SESSION — portrait = stacked, landscape = side-by-side */}
          {isActiveSession && (
            <div className={`relative flex ${isPortrait ? 'flex-col' : 'flex-row'} h-full ${isPortrait ? 'min-h-[400px]' : 'min-h-[360px]'}`}>
              {/* Video Panel — STICKY in portrait mode */}
              <div className={`${isPortrait ? 'w-full sticky top-0 z-10 bg-white' : 'w-1/2'} p-3 relative flex flex-col flex-shrink-0`}>
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <video ref={setVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <MicLevelIndicator level={state.micLevel} />
                  <EmotionIndicator emotion={state.currentEmotion} compact />
                </div>

                {canEnd && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Session name (optional)"
                      value={sessionName}
                      onChange={e => setSessionName(e.target.value)}
                      maxLength={80}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                    <Button 
                      onClick={endSession} 
                      variant="destructive" 
                      className="w-full"
                    >
                      <Square className="h-4 w-4 mr-2" />End & Save Session
                    </Button>
                  </div>
                )}
              </div>

              {/* Transcript Panel — SCROLLABLE */}
              <div className={`${isPortrait ? 'w-full border-t' : 'w-1/2 border-l'} border-gray-100 flex flex-col ${isPortrait ? 'flex-1 overflow-y-auto' : 'min-h-[200px]'}`}>
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0 sticky top-0 z-5">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Live Transcript</h3>
                  <EmotionIndicator emotion={state.currentEmotion} compact />
                </div>
                <TranscriptDisplay entries={state.transcriptEntries} interruptions={state.interruptions} className="flex-1" />
              </div>

              {/* Judge Interruption Overlay — covers entire active session area, NOT inside overflow-hidden video */}
              {sessionState === 'INTERRUPTING' && state.currentInterruption && (
                <JudgeInterruption
                  interruption={state.currentInterruption}
                  isSpeaking={ttsSpeaking}
                  onRepeat={repeatInterruptionAudio}
                  onContinue={resumeAfterInterruption}
                />
              )}
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
              userName={state.userName}
              userRole={state.userRole ?? undefined}
              sessionName={sessionName.trim() || undefined}
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
