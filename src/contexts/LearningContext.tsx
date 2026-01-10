import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useSubscription } from './SubscriptionContext';
import { useAuth } from './FirebaseAuthContext';
import { type Module, type Lesson, type QuizQuestion } from '@/lib/learningContent';
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
  deductXp: (amount: number) => void;
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
    return tier === 'free' ? 15 : Infinity;
  }

  // Free tier has 15 lessons per day limit
  if (tier === 'free') {
    return Math.max(0, 15 - state.dailyLimit.lessonsCompleted);
  }

  // Paid tiers have unlimited lessons
  return Infinity;
}

/**
 * Backend module types (from Firestore)
 */
interface GeneratedModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: GeneratedLesson[];
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[];
  tutorId: string;
  tutorName: string;
  published: boolean;
}

interface GeneratedLesson {
  id: string;
  title: string;
  content: string;
  xpReward: number;
  quiz: GeneratedQuiz[];
  hasAudio?: boolean;
  accessLevels?: ('free' | 'basic' | 'standard' | 'premium')[];
}

interface GeneratedQuiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  accessLevels?: ('free' | 'basic' | 'standard' | 'premium')[];
}

/**
 * Convert backend GeneratedModule to frontend Module format
 */
function convertGeneratedModuleToModule(
  generatedModule: GeneratedModule,
  userTier: Tier,
  moduleProgress?: ModuleProgress,
  totalAvailableLessons?: number
): Module {
  // Determine the minimum required tier for this module
  // If module has 'free' access, requiredTier is 'free', otherwise use the lowest tier in accessLevels
  const tierOrder: Tier[] = ['free', 'basic', 'standard', 'premium'];
  const moduleAccessLevels = Array.isArray(generatedModule.accessLevels) ? generatedModule.accessLevels : ['premium'];
  const requiredTier = moduleAccessLevels.includes('free')
    ? 'free'
    : moduleAccessLevels.reduce((min, tier) => {
        const minIndex = tierOrder.indexOf(min);
        const tierIndex = tierOrder.indexOf(tier);
        return tierIndex < minIndex ? tier : min;
      }, 'premium' as Tier);

  // Check if module is locked (user tier doesn't have access)
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  const isModuleLocked = userTierIndex < requiredTierIndex;

  // Convert lessons - ensure lessons is an array
  const moduleLessons = Array.isArray(generatedModule.lessons) ? generatedModule.lessons : [];
  const lessons: Lesson[] = moduleLessons.map((genLesson) => {
    // Determine lesson access levels (use lesson-specific or fall back to module)
    const lessonAccessLevels = Array.isArray(genLesson.accessLevels) 
      ? genLesson.accessLevels 
      : moduleAccessLevels;
    
    // Determine lesson required tier
    const lessonRequiredTier = lessonAccessLevels.includes('free')
      ? 'free'
      : lessonAccessLevels.reduce((min, tier) => {
          const minIndex = tierOrder.indexOf(min);
          const tierIndex = tierOrder.indexOf(tier);
          return tierIndex < minIndex ? tier : min;
        }, 'premium' as Tier);
    
    // Check if lesson is locked based on user tier
    const lessonRequiredTierIndex = tierOrder.indexOf(lessonRequiredTier);
    const isLessonLocked = userTierIndex < lessonRequiredTierIndex;

    // Check if lesson is completed
    // Only mark as completed if the lesson was actually completed (not just any lesson with this ID)
    // This prevents newly generated lessons from being marked as completed due to ID conflicts
    const lessonProgress = moduleProgress?.lessonsCompleted[genLesson.id];
    const isCompleted = lessonProgress?.completed === true && lessonProgress?.completedAt ? true : false;

    // Convert quiz questions with access control - ensure quiz is an array
    const lessonQuiz = Array.isArray(genLesson.quiz) ? genLesson.quiz : [];
    const quiz: QuizQuestion[] = lessonQuiz.map((q) => {
      // Determine quiz access levels (use quiz-specific, lesson-specific, or module)
      const quizAccessLevels = Array.isArray(q.accessLevels) ? q.accessLevels : lessonAccessLevels;
      
      // Check if quiz is accessible to user
      const quizRequiredTier = quizAccessLevels.includes('free')
        ? 'free'
        : quizAccessLevels.reduce((min, tier) => {
            const minIndex = tierOrder.indexOf(min);
            const tierIndex = tierOrder.indexOf(tier);
            return tierIndex < minIndex ? tier : min;
          }, 'premium' as Tier);
      
      const quizRequiredTierIndex = tierOrder.indexOf(quizRequiredTier);
      const isQuizLocked = userTierIndex < quizRequiredTierIndex;
      
      return {
        id: q.id,
        question: isQuizLocked ? '🔒 This quiz is locked. Upgrade to access.' : q.question,
        options: isQuizLocked ? ['Upgrade to unlock', '', '', ''] : q.options,
        correctAnswer: isQuizLocked ? 0 : q.correctAnswer,
        explanation: isQuizLocked ? 'Upgrade your subscription to access this quiz.' : q.explanation,
        locked: isQuizLocked,
      };
    });

    return {
      id: genLesson.id,
      title: genLesson.title,
      content: isLessonLocked 
        ? '<div class="text-center p-8"><h3>🔒 This lesson is locked</h3><p>Upgrade your subscription to access this content.</p></div>'
        : genLesson.content,
      xpReward: genLesson.xpReward,
      quiz,
      locked: isLessonLocked,
      completed: isCompleted,
      tier: lessonRequiredTier === 'free' ? 'basic' : lessonRequiredTier,
      hasAudio: genLesson.hasAudio,
      userGenerated: (genLesson as any).userGenerated || false, // Preserve user-generated flag
      generationBatchId: (genLesson as any).generationBatchId, // Preserve generation batch ID for grouping
      createdAt: (genLesson as any).createdAt, // Preserve creation timestamp
    };
  });

  return {
    id: generatedModule.id,
    title: generatedModule.title,
    description: generatedModule.description,
    icon: generatedModule.icon,
    lessons,
    locked: isModuleLocked,
    requiredTier,
  };
}

/**
 * Fetch user-specific lessons from backend
 */
async function fetchUserLessons(userId: string): Promise<Record<string, GeneratedLesson[]>> {
  try {
    const apiUrl = getApiUrl(`user-lessons/${userId}`);
    console.log(`📚 Fetching user lessons from: ${apiUrl}`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch user lessons for ${userId}:`, response.statusText);
      return {};
    }

    const data = await response.json();
    const modulesData = data.modules || {};

    // Normalize shape to: Record<moduleId, GeneratedLesson[]>
    const normalized: Record<string, GeneratedLesson[]> = {};
    Object.entries(modulesData).forEach(([moduleId, moduleValue]) => {
      const lessons = (moduleValue as any)?.lessons;
      normalized[moduleId] = Array.isArray(lessons) ? lessons : [];
      console.log(`📖 Module ${moduleId}: ${normalized[moduleId].length} user lessons`);
    });

    console.log(`✅ Total user lessons loaded for ${Object.keys(normalized).length} modules`);
    return normalized;
  } catch (error) {
    console.error('Error fetching user lessons:', error);
    return {};
  }
}

/**
 * Fetch published modules from backend API
 */
async function fetchModulesFromBackend(
  accessLevel: Tier,
  progress?: Record<string, ModuleProgress>,
  userId?: string,
  userLessons?: Record<string, GeneratedLesson[]>
): Promise<Module[]> {
  try {
    const apiUrl = getApiUrl(`tutor-admin/modules/level/${accessLevel}`);
    console.log(`📚 Fetching modules for tier: ${accessLevel} from ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch modules for tier ${accessLevel}:`, response.status, response.statusText);
      console.error(`Error details:`, errorText);
      return [];
    }

    const generatedModules: GeneratedModule[] = await response.json();
    console.log(`✅ Fetched ${generatedModules.length} module(s) for ${accessLevel} tier`);
    
    // Filter to only published modules (backend should do this, but double-check)
    const publishedModules = generatedModules.filter(m => m.published === true);
    
    // Convert to frontend format with progress and merge user-specific lessons
    return publishedModules.map(m => {
      const moduleProgress = progress?.[m.id];
      // Merge user-specific lessons with module lessons
      // Ensure both are arrays to prevent iteration errors
      const userModuleLessons = Array.isArray(userLessons?.[m.id]) ? userLessons[m.id] : [];
      const moduleLessons = Array.isArray(m.lessons) ? m.lessons : [];
      
      // Calculate completed count from progress
      const completedCount = moduleProgress ? Object.keys(moduleProgress.lessonsCompleted).length : 0;
      
      // Always show ALL lessons - no limiting
      // Combine base module lessons with user-generated lessons
      const allLessons = [
        ...moduleLessons, 
        ...userModuleLessons
      ];
      
      console.log(`📊 Module "${m.title}": ${moduleLessons.length} base + ${userModuleLessons.length} user-generated = ${allLessons.length} total lessons (${completedCount} completed in progress)`);
      
      const moduleWithLessons: GeneratedModule = {
        ...m,
        lessons: allLessons
      };
      return convertGeneratedModuleToModule(moduleWithLessons, accessLevel, moduleProgress, moduleLessons.length);
    });
  } catch (error) {
    console.error('Error fetching modules from backend:', error);
    return [];
  }
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const tier = normalizeTier(userSubscription?.planId);
  const [state, setState] = useState<LearningState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);

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
        state.streak,
        lessonsCompleted,
        user.picture
      ).catch(err => console.warn('Failed to update leaderboard', err));
    }
  }, [user?.id, user?.picture, state.xp, state.level, state.streak, state.modulesProgress]); // Update when progress changes

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

  // Fetch modules from backend when tier changes or progress updates
  useEffect(() => {
    const loadModules = async () => {
      setModulesLoading(true);
      try {
        // Fetch user-specific lessons if user is logged in
        let userLessons: Record<string, GeneratedLesson[]> = {};
        if (user?.id) {
          userLessons = await fetchUserLessons(user.id);
        }
        
        const fetchedModules = await fetchModulesFromBackend(tier, state.modulesProgress, user?.id, userLessons);
        setModules(fetchedModules);
      } catch (error) {
        console.error('Failed to load modules:', error);
        setModules([]);
      } finally {
        setModulesLoading(false);
      }
    };

    // Only fetch if we have user progress loaded (or if no user)
    if (!isLoading || !user?.id) {
      loadModules();
    }
  }, [tier, state.modulesProgress, isLoading, user?.id]);

  const gatedModules = useMemo(() => modules, [modules]);

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
    setState((prev) => ({ ...prev, xp: Math.max(0, prev.xp + amount) }));
  }, []);

  const deductXp = useCallback((amount: number) => {
    setState((prev) => {
      const newXp = Math.max(0, prev.xp - amount);
      const newLevel = computeLevel(newXp);
      
      // Update leaderboard with new XP
      if (user) {
        const lessonsCompleted = calculateLessonsCompleted(prev.modulesProgress);
        updateLeaderboardEntry(
          user.id,
          user.name || user.email?.split('@')[0] || 'User',
          newXp,
          newLevel,
          prev.streak,
          lessonsCompleted,
          user.picture
        ).catch(err => console.warn('Failed to update leaderboard', err));
      }
      
      return { ...prev, xp: newXp, level: newLevel };
    });
  }, [user]);

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
      // Only complete lesson if score is 75% or higher
      if (score < 75) {
        console.log(`Lesson not completed: Score ${score}% is below minimum requirement of 75%`);
        return; // Don't mark as complete if score is below 75%
      }

      touchActivity();

      // Find the lesson to get XP reward
      const module = modules.find(m => m.id === moduleId);
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
            prev.streak,
            lessonsCompleted,
            user.picture
          ).catch(err => console.warn('Failed to update leaderboard', err));
        }

        return newState;
      });
    },
    [awardXp, touchActivity, modules]
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
    deductXp,
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

