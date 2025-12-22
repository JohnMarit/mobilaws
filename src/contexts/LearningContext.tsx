import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useSubscription } from './SubscriptionContext';
import { useAuth } from './FirebaseAuthContext';
import { getLearningModules, type Module, type Lesson, type QuizQuestion } from '@/lib/learningContent';
import { updateLeaderboardEntry, initLeaderboardEntry, calculateLessonsCompleted } from '@/lib/leaderboard';
import { getApiUrl } from '@/lib/api';

type Tier = 'free' | 'basic' | 'standard' | 'premium';

interface LessonProgress {
  completed: boolean;
  score: number;
  completedAt?: string;
}

interface DailyLimitTracking {
  date: string; // YYYY-MM-DD format
  lessonsCompleted: number;
}

interface ModuleProgress {
  lessonsCompleted: Record<string, LessonProgress>;
  xpEarned: number;
  lastCompletedAt?: string;
}

interface LearningState {
  xp: number;
  streak: number;
  level: number;
  lastActiveDate?: string;
  dailyGoal: number;
  modulesProgress: Record<string, ModuleProgress>;
  dailyLimit: DailyLimitTracking;
}

interface LearningContextValue {
  tier: Tier;
  modules: Module[];
  progress: LearningState;
  dailyLessonsRemaining: number;
  canTakeLesson: boolean;
  startLesson: (moduleId: string, lessonId: string) => void;
  completeLesson: (moduleId: string, lessonId: string, score: number) => void;
  getModuleProgress: (moduleId: string) => ModuleProgress | undefined;
  getLessonProgress: (moduleId: string, lessonId: string) => LessonProgress | undefined;
}

const LearningContext = createContext<LearningContextValue | undefined>(undefined);

function normalizeTier(planId?: string | null): Tier {
  if (!planId) return 'free';
  const normalized = planId.toLowerCase();
  if (normalized === 'premium') return 'premium';
  if (normalized === 'standard') return 'standard';
  if (normalized === 'basic') return 'basic';
  return 'free'; // treat free/admin_granted as free
}

function computeLevel(xp: number): number {
  // Simple curve: every 120 XP is a level; start at level 1
  return Math.max(1, Math.floor(xp / 120) + 1);
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = b.getTime() - a.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Load learning state from Firebase
 */
async function loadStateFromFirebase(userId: string): Promise<LearningState | null> {
  try {
    const apiUrl = getApiUrl(`learning/progress/${userId}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.warn('Failed to fetch learning progress from Firebase');
      return null;
    }
    const data = await response.json();
    return data as LearningState;
  } catch (err) {
    console.warn('Failed to load learning state from Firebase', err);
    return null;
  }
}

/**
 * Save learning state to Firebase
 */
async function saveStateToFirebase(userId: string, state: LearningState): Promise<void> {
  try {
    const apiUrl = getApiUrl('learning/progress');
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...state
      }),
    });
  } catch (err) {
    console.warn('Failed to save learning state to Firebase', err);
  }
}

/**
 * Load state from localStorage (fallback/cache)
 */
function loadStateFromLocal(userId: string): LearningState | null {
  try {
    const key = `learning-progress:${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LearningState;
  } catch (err) {
    console.warn('Failed to load learning state from localStorage', err);
    return null;
  }
}

/**
 * Save state to localStorage (fallback/cache)
 */
function saveStateToLocal(userId: string, state: LearningState): void {
  try {
    const key = `learning-progress:${userId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save learning state to localStorage', err);
  }
}

const defaultState: LearningState = {
  xp: 0,
  streak: 0,
  level: 1,
  dailyGoal: 40, // XP goal for a day
  modulesProgress: {},
  dailyLimit: {
    date: new Date().toISOString().split('T')[0],
    lessonsCompleted: 0
  }
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyLessonsRemaining(state: LearningState, tier: Tier): number {
  const today = getTodayString();
  
  // Reset if it's a new day
  if (state.dailyLimit.date !== today) {
    return tier === 'free' ? 2 : Infinity;
  }
  
  // Free tier has 2 lessons per day limit
  if (tier === 'free') {
    return Math.max(0, 2 - state.dailyLimit.lessonsCompleted);
  }
  
  // Paid tiers have unlimited lessons
  return Infinity;
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const tier = normalizeTier(userSubscription?.planId);
  const [state, setState] = useState<LearningState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  // Load state when user changes
  useEffect(() => {
    if (!user?.id) {
      setState(defaultState);
      setIsLoading(false);
      return;
    }

    const loadUserProgress = async () => {
      setIsLoading(true);
      
      // Try loading from localStorage first (instant)
      const localState = loadStateFromLocal(user.id);
      if (localState) {
        setState({ ...defaultState, ...localState });
      }

      // Then load from Firebase (authoritative)
      const firebaseState = await loadStateFromFirebase(user.id);
      if (firebaseState) {
        setState({ ...defaultState, ...firebaseState });
        // Update localStorage cache
        saveStateToLocal(user.id, firebaseState);
      } else if (!localState) {
        // No data anywhere, use defaults
        setState(defaultState);
      }

      setIsLoading(false);
    };

    loadUserProgress();
  }, [user?.id]);

  // Initialize user in leaderboard when they log in
  useEffect(() => {
    if (user) {
      initLeaderboardEntry(
        user.id,
        user.name || user.email?.split('@')[0] || 'User',
        user.picture
      ).catch(err => console.warn('Failed to initialize leaderboard entry', err));
    }
  }, [user?.id]); // Only run when user ID changes (on login)

  // Update leaderboard entry when user progress changes
  useEffect(() => {
    if (user) {
      const lessonsCompleted = calculateLessonsCompleted(state.modulesProgress);
      updateLeaderboardEntry(
        user.id,
        user.name || user.email?.split('@')[0] || 'User',
        state.xp,
        state.level,
        lessonsCompleted,
        user.picture
      ).catch(err => console.warn('Failed to update leaderboard', err));
    }
  }, [user?.id, user?.picture, state.xp, state.level, state.modulesProgress]); // Update when progress changes

  // Persist state changes to both localStorage and Firebase
  useEffect(() => {
    if (!user?.id || isLoading) return;

    // Save to localStorage immediately (fast)
    saveStateToLocal(user.id, state);

    // Debounce Firebase saves (slower, more expensive)
    const timeoutId = setTimeout(() => {
      saveStateToFirebase(user.id, state);
    }, 2000); // Save to Firebase 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [user?.id, state, isLoading]);

  // Update level when XP changes
  useEffect(() => {
    setState((prev) => ({ ...prev, level: computeLevel(prev.xp) }));
  }, [state.xp]);

  const gatedModules = useMemo(() => getLearningModules(tier), [tier]);

  const dailyLessonsRemaining = useMemo(() => getDailyLessonsRemaining(state, tier), [state, tier]);
  const canTakeLesson = dailyLessonsRemaining > 0;

  const touchActivity = useCallback(() => {
    setState((prev) => {
      const today = new Date().toDateString();
      if (!prev.lastActiveDate) {
        return { ...prev, streak: 1, lastActiveDate: today };
      }
      const diff = daysBetween(prev.lastActiveDate, today);
      if (diff === 0) return prev; // already active today
      if (diff === 1) {
        return { ...prev, streak: prev.streak + 1, lastActiveDate: today };
      }
      // missed a day - reset streak but mark active
      return { ...prev, streak: 1, lastActiveDate: today };
    });
  }, []);

  const awardXp = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, xp: prev.xp + amount }));
  }, []);

  const updateModuleProgress = useCallback(
    (moduleId: string, updater: (prev: ModuleProgress) => ModuleProgress) => {
      setState((prev) => {
        const existing = prev.modulesProgress[moduleId] || {
          lessonsCompleted: {},
          xpEarned: 0,
        };
        const nextModule = updater(existing);
        return {
          ...prev,
          modulesProgress: {
            ...prev.modulesProgress,
            [moduleId]: nextModule,
          },
        };
      });
    },
    []
  );

  const startLesson = useCallback(
    (moduleId: string, lessonId: string) => {
      // Touch activity when starting a lesson
      touchActivity();
    },
    [touchActivity]
  );

  const completeLesson = useCallback(
    (moduleId: string, lessonId: string, score: number) => {
      // Only complete lesson if score is 70% or higher
      if (score < 70) {
        console.log(`Lesson not completed: Score ${score}% is below minimum requirement of 70%`);
        return; // Don't mark as complete if score is below 70%
      }

      touchActivity();
      
      // Find the lesson to get XP reward
      const module = gatedModules.find(m => m.id === moduleId);
      const lesson = module?.lessons.find(l => l.id === lessonId);
      const earnedXp = lesson?.xpReward || 0;

      awardXp(earnedXp);

      setState((prev) => {
        const today = getTodayString();
        
        // Check if lesson was already completed today
        const moduleProg = prev.modulesProgress[moduleId];
        const existingProgress = moduleProg?.lessonsCompleted[lessonId];
        const isNewCompletion = !existingProgress || existingProgress.completedAt?.split('T')[0] !== today;

        // Update daily limit only for new completions
        const newDailyLimit = prev.dailyLimit.date === today
          ? {
              date: today,
              lessonsCompleted: isNewCompletion 
                ? prev.dailyLimit.lessonsCompleted + 1 
                : prev.dailyLimit.lessonsCompleted
            }
          : {
              date: today,
              lessonsCompleted: 1
            };

        const newState = {
          ...prev,
          dailyLimit: newDailyLimit,
          modulesProgress: {
            ...prev.modulesProgress,
            [moduleId]: {
              ...(moduleProg || { lessonsCompleted: {}, xpEarned: 0 }),
              lessonsCompleted: {
                ...(moduleProg?.lessonsCompleted || {}),
                [lessonId]: {
                  completed: true,
                  score,
                  completedAt: new Date().toISOString()
                }
              },
              xpEarned: (moduleProg?.xpEarned || 0) + earnedXp,
              lastCompletedAt: new Date().toISOString()
            }
          }
        };

        // Update leaderboard with new XP and lessons completed
        if (user) {
          const newXp = prev.xp + earnedXp;
          const newLevel = computeLevel(newXp);
          const lessonsCompleted = calculateLessonsCompleted(newState.modulesProgress);
          updateLeaderboardEntry(
            user.id,
            user.name || user.email?.split('@')[0] || 'User',
            newXp,
            newLevel,
            lessonsCompleted,
            user.picture
          ).catch(err => console.warn('Failed to update leaderboard', err));
        }

        return newState;
      });
    },
    [awardXp, touchActivity, gatedModules]
  );

  const getModuleProgress = useCallback(
    (moduleId: string): ModuleProgress | undefined => {
      return state.modulesProgress[moduleId];
    },
    [state.modulesProgress]
  );

  const getLessonProgress = useCallback(
    (moduleId: string, lessonId: string): LessonProgress | undefined => {
      const moduleProg = state.modulesProgress[moduleId];
      if (!moduleProg) return undefined;
      return moduleProg.lessonsCompleted[lessonId];
    },
    [state.modulesProgress]
  );

  const value: LearningContextValue = {
    tier,
    modules: gatedModules,
    progress: state,
    dailyLessonsRemaining,
    canTakeLesson,
    startLesson,
    completeLesson,
    getModuleProgress,
    getLessonProgress,
  };

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used within LearningProvider');
  return ctx;
}

