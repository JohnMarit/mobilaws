import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './FirebaseAuthContext';
import { useSubscription } from './SubscriptionContext';
import { getAnonymousUserId } from '@/lib/browser-fingerprint';

interface PromptLimitContextType {
  promptCount: number;
  maxPrompts: number;
  canSendPrompt: boolean;
  incrementPromptCount: () => Promise<boolean>;
  /** Sidebar tasks (draft, research, etc.): 5 tokens per task, 7 per page when long. */
  useTokensForSidebarTask: (amount: number) => Promise<boolean>;
  /** True if user can afford at least `amount` tokens (premium or tokensRemaining >= amount). */
  canAffordTokens: (amount: number) => boolean;
  resetPromptCount: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
  dailyTokensUsed: number;
  maxDailyTokens: number;
  tokensResetDate: string;
}

const PromptLimitContext = createContext<PromptLimitContextType | undefined>(undefined);

export function usePromptLimit() {
  const context = useContext(PromptLimitContext);
  if (context === undefined) {
    throw new Error('usePromptLimit must be used within a PromptLimitProvider');
  }
  return context;
}

interface PromptLimitProviderProps {
  children: ReactNode;
}

export function PromptLimitProvider({ children }: PromptLimitProviderProps) {
  const [promptCount, setPromptCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [dailyTokensUsed, setDailyTokensUsed] = useState(0);
  const [tokensResetDate, setTokensResetDate] = useState('');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userSubscription, useToken, canUseToken, isLoading: subscriptionLoading } = useSubscription();
  const maxPrompts = 3; // Anonymous user limit
  const maxDailyTokens = 15; // Authenticated user limit (free plan)

  // Load token count from Firestore
  useEffect(() => {
    async function loadTokens() {
      const anonymousId = getAnonymousUserId();

      // For anonymous users
      if (!isAuthenticated) {
        try {
          const { getTokenUsage } = await import('@/lib/tokenService');
          const usage = await getTokenUsage(anonymousId, true);

          if (usage) {
            setPromptCount(usage.tokensUsed);

            if (usage.resetAfter) {
              const hoursUntilReset = (usage.resetAfter.toMillis() - Date.now()) / (1000 * 60 * 60);
              console.log(`✅ Loaded anonymous tokens from Firestore: ${usage.tokensUsed}/${usage.maxTokens} (${hoursUntilReset.toFixed(1)}h until reset)`);
            } else {
              console.log(`✅ Loaded anonymous tokens from Firestore: ${usage.tokensUsed}/${usage.maxTokens}`);
            }
          }
        } catch (error) {
          console.error('Error loading tokens from Firestore:', error);
        }
      }
    }

    loadTokens();
  }, [isAuthenticated]);

  // Reset prompt count and close modal when user authenticates
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) return;

    if (isAuthenticated) {
      setPromptCount(0);
      setShowLoginModal(false);
      console.log('✅ User authenticated - prompt count reset and modal closed');
    }
  }, [isAuthenticated, authLoading]);

  // Keep UI counters in sync with subscription state (especially free-plan tokens)
  useEffect(() => {
    if (isAuthenticated && userSubscription?.isFree) {
      setDailyTokensUsed(userSubscription.tokensUsed);
      setTokensResetDate(userSubscription.lastResetDate || '');
    }
  }, [isAuthenticated, userSubscription]);

  const incrementPromptCount = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) {
      if (userSubscription && userSubscription.isActive) {
        const tokenUsed = await useToken(1); // AI chat: 1 token per message
        if (tokenUsed && userSubscription.isFree) {
          setDailyTokensUsed(userSubscription.tokensUsed + 1);
        }
        return tokenUsed;
      }
      return false;
    } else {
      // For anonymous users, use Firestore token service
      try {
        const anonymousId = getAnonymousUserId();
        const { useToken: useFirestoreToken } = await import('@/lib/tokenService');
        const result = await useFirestoreToken(anonymousId, true);

        if (result.success) {
          setPromptCount(prev => prev + 1);
          console.log(`✅ Token used for anonymous user via Firestore: ${result.tokensRemaining} remaining`);

          if (result.hoursUntilReset) {
            console.log(`⏰ Tokens will reset in ${result.hoursUntilReset} hours`);
          }
        } else {
          console.log(`⚠️ Cannot use token: ${result.tokensRemaining} remaining`);
        }

        return result.success;
      } catch (error) {
        console.error('Error using Firestore token:', error);
        // Fallback to local increment (should rarely happen)
        setPromptCount(prev => prev + 1);
        return true;
      }
    }
  }, [isAuthenticated, userSubscription, useToken]);

  const resetPromptCount = useCallback(() => {
    setPromptCount(0);
  }, []);

  const useTokensForSidebarTask = useCallback(async (amount: number): Promise<boolean> => {
    if (!isAuthenticated) return false;
    if (!userSubscription || !userSubscription.isActive) return false;
    return useToken(amount);
  }, [isAuthenticated, userSubscription, useToken]);

  const canAffordTokens = useCallback((amount: number): boolean => {
    const n = Math.max(1, Math.floor(amount));
    if (!userSubscription?.isActive) return false;
    const isPremium = userSubscription.planId?.toLowerCase() === 'premium';
    return isPremium || userSubscription.tokensRemaining >= n;
  }, [userSubscription]);

  // Check if user can send prompt based on their authentication status and subscription
  // Authenticated users: allow sending if tokens are available OR while subscription is still loading
  // (token consumption will still be enforced inside incrementPromptCount/useToken).
  // Premium users should always have access if subscription is active
  const isPremium = userSubscription?.planId?.toLowerCase() === 'premium';
  const hasTokensAuthenticated = Boolean(
    userSubscription && 
    userSubscription.isActive && 
    (isPremium || canUseToken) // Premium users always allowed, others check canUseToken
  );
  const canSendPrompt = isAuthenticated
    ? (subscriptionLoading ? true : hasTokensAuthenticated)
    : promptCount < maxPrompts;  // Anonymous users: 3 prompts total


  const value: PromptLimitContextType = {
    promptCount,
    maxPrompts,
    canSendPrompt,
    incrementPromptCount,
    useTokensForSidebarTask,
    canAffordTokens,
    resetPromptCount,
    showLoginModal,
    setShowLoginModal,
    showSubscriptionModal,
    setShowSubscriptionModal,
    dailyTokensUsed,
    maxDailyTokens,
    tokensResetDate,
  };

  return (
    <PromptLimitContext.Provider value={value}>
      {children}
    </PromptLimitContext.Provider>
  );
}
