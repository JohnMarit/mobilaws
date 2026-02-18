import { createContext, useContext, useReducer, useCallback, ReactNode, useRef } from 'react';

export type SessionState =
  | 'IDLE'
  | 'PREVIEW'
  | 'RECORDING'
  | 'ANALYZING'
  | 'INTERRUPTING'
  | 'RESUMING'
  | 'FINALIZING'
  | 'COMPLETE';

export interface EmotionSnapshot {
  nervousness: number;
  stress: number;
  anger: number;
  confidence: number;
  hesitation: number;
  primary: string;
  timestamp: number;
}

export interface Interruption {
  question: string;
  reason: string;
  severity: number;
  timestamp: number;
}

export interface TranscriptEntry {
  text: string;
  isFinal: boolean;
  timestamp: number;
  interruptionFlag?: boolean;
}

export interface SessionEvaluation {
  legal_reasoning: number;
  clarity: number;
  logical_consistency: number;
  emotional_control: number;
  credibility: number;
  legal_accuracy: number;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  legal_references: string[];
  legal_quotes?: Array<{
    reference: string;
    quote: string;
    relevance: string;
  }>;
  credibility_assessment: string;
  emotion_profile: string;
  summary: string;
}

interface SimulatorState {
  sessionState: SessionState;
  sessionId: string | null;
  isModalOpen: boolean;
  mediaStream: MediaStream | null;
  elapsedSeconds: number;
  maxDuration: number;
  minDuration: number;
  transcriptEntries: TranscriptEntry[];
  fullTranscript: string;
  emotionTimeline: EmotionSnapshot[];
  currentEmotion: EmotionSnapshot | null;
  interruptions: Interruption[];
  currentInterruption: Interruption | null;
  evaluation: SessionEvaluation | null;
  micLevel: number;
  error: string | null;
  isConnected: boolean;
}

type SimulatorAction =
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_MEDIA_STREAM'; stream: MediaStream | null }
  | { type: 'START_SESSION'; sessionId: string; maxDuration: number; minDuration: number }
  | { type: 'SET_CONNECTED'; connected: boolean }
  | { type: 'ADD_TRANSCRIPT'; entry: TranscriptEntry }
  | { type: 'SET_FULL_TRANSCRIPT'; text: string }
  | { type: 'SET_EMOTION'; emotion: EmotionSnapshot }
  | { type: 'TRIGGER_INTERRUPT'; interruption: Interruption }
  | { type: 'RESUME_RECORDING' }
  | { type: 'START_FINALIZING' }
  | { type: 'SET_EVALUATION'; evaluation: SessionEvaluation; transcript: string }
  | { type: 'TICK'; seconds: number }
  | { type: 'SET_MIC_LEVEL'; level: number }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'TO_ANALYZING' }
  | { type: 'TO_RECORDING' };

const initialState: SimulatorState = {
  sessionState: 'IDLE',
  sessionId: null,
  isModalOpen: false,
  mediaStream: null,
  elapsedSeconds: 0,
  maxDuration: 120,
  minDuration: 60,
  transcriptEntries: [],
  fullTranscript: '',
  emotionTimeline: [],
  currentEmotion: null,
  interruptions: [],
  currentInterruption: null,
  evaluation: null,
  micLevel: 0,
  error: null,
  isConnected: false,
};

function simulatorReducer(state: SimulatorState, action: SimulatorAction): SimulatorState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, isModalOpen: true, sessionState: 'PREVIEW', error: null };

    case 'CLOSE_MODAL':
      return { ...initialState };

    case 'SET_MEDIA_STREAM':
      return { ...state, mediaStream: action.stream };

    case 'START_SESSION':
      return {
        ...state,
        sessionState: 'RECORDING',
        sessionId: action.sessionId,
        maxDuration: action.maxDuration,
        minDuration: action.minDuration,
        isConnected: true,
      };

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.connected };

    case 'ADD_TRANSCRIPT':
      return {
        ...state,
        transcriptEntries: [...state.transcriptEntries, action.entry],
      };

    case 'SET_FULL_TRANSCRIPT':
      return { ...state, fullTranscript: action.text };

    case 'SET_EMOTION':
      return {
        ...state,
        currentEmotion: action.emotion,
        emotionTimeline: [...state.emotionTimeline, action.emotion],
      };

    case 'TO_ANALYZING':
      if (state.sessionState === 'RECORDING') {
        return { ...state, sessionState: 'ANALYZING' };
      }
      return state;

    case 'TO_RECORDING':
      if (state.sessionState === 'ANALYZING' || state.sessionState === 'RESUMING') {
        return { ...state, sessionState: 'RECORDING' };
      }
      return state;

    case 'TRIGGER_INTERRUPT':
      return {
        ...state,
        sessionState: 'INTERRUPTING',
        currentInterruption: action.interruption,
        interruptions: [...state.interruptions, action.interruption],
      };

    case 'RESUME_RECORDING':
      return {
        ...state,
        sessionState: 'RESUMING',
        currentInterruption: null,
      };

    case 'START_FINALIZING':
      return { ...state, sessionState: 'FINALIZING' };

    case 'SET_EVALUATION':
      return {
        ...state,
        sessionState: 'COMPLETE',
        evaluation: action.evaluation,
        fullTranscript: action.transcript || state.fullTranscript,
      };

    case 'TICK':
      return { ...state, elapsedSeconds: action.seconds };

    case 'SET_MIC_LEVEL':
      return { ...state, micLevel: action.level };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

interface CourtSimulatorContextType {
  state: SimulatorState;
  dispatch: React.Dispatch<SimulatorAction>;
  openSimulator: () => void;
  closeSimulator: () => void;
}

const CourtSimulatorContext = createContext<CourtSimulatorContextType | undefined>(undefined);

export function useCourtSimulator() {
  const context = useContext(CourtSimulatorContext);
  if (!context) {
    throw new Error('useCourtSimulator must be used within a CourtSimulatorProvider');
  }
  return context;
}

export function CourtSimulatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);

  const openSimulator = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL' });
  }, []);

  const closeSimulator = useCallback(() => {
    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach(track => track.stop());
    }
    dispatch({ type: 'CLOSE_MODAL' });
  }, [state.mediaStream]);

  return (
    <CourtSimulatorContext.Provider value={{ state, dispatch, openSimulator, closeSimulator }}>
      {children}
    </CourtSimulatorContext.Provider>
  );
}
