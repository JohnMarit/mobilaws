import { type SessionEvaluation, type Interruption, type EmotionSnapshot } from '@/contexts/CourtSimulatorContext';

export interface CourtSessionRecord {
  id: string;
  date: number;            // Unix timestamp ms
  durationSeconds: number;
  overallScore: number;
  grade: string;
  summary: string;
  transcript: string;
  interruptionCount: number;
  userRole?: string;
  userName?: string;
  // Full evaluation data for viewing the report later
  evaluation?: SessionEvaluation;
  interruptions?: Interruption[];
  emotionTimeline?: EmotionSnapshot[];
}

const STORAGE_KEY = 'mobilaws_court_sessions';
const MAX_SAVED   = 30;

export function saveCourtSession(record: CourtSessionRecord): void {
  try {
    const existing = loadCourtSessions();
    const updated  = [record, ...existing.filter(s => s.id !== record.id)].slice(0, MAX_SAVED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Notify listeners (e.g. Sidebar) without any React dependency
    window.dispatchEvent(new Event('court_session_saved'));
  } catch (e) {
    console.warn('Failed to save court session to localStorage:', e);
  }
}

export function loadCourtSessions(): CourtSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CourtSessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function deleteCourtSession(id: string): void {
  try {
    const updated = loadCourtSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('court_session_saved'));
  } catch (e) {
    console.warn('Failed to delete court session:', e);
  }
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
