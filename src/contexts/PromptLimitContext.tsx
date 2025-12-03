import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './FirebaseAuthContext';
import { useSubscription } from './SubscriptionContext';
import { getAnonymousUserId } from '@/lib/browser-fingerprint';

interface PromptLimitContextType {
  promptCount: number;
  maxPrompts: number;
  canSendPrompt: boolean;
  incrementPromptCount: () => Promise<boolean>;
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
  const maxDailyTokens = 5; // Authenticated user limit (free plan)

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
          } else {
            // If Firestore fails, try localStorage migration
            const promptCountKey = `promptCount_${anonymousId}`;
            const savedCount = localStorage.getItem(promptCountKey);

            if (savedCount) {
              const count = parseInt(savedCount, 10);
              setPromptCount(count);
              console.log(`🔄 Migrated ${count} tokens from localStorage`);
              // Token will be saved to Firestore on next use
            }
          }
        } catch (error) {
          console.error('Error loading tokens from Firestore:', error);
          // Fallback to localStorage
          const promptCountKey = `promptCount_${anonymousId}`;
          const savedCount = localStorage.getItem(promptCountKey);
          if (savedCount) {
            setPromptCount(parseInt(savedCount, 10));
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

  const incrementPromptCount = useCallback(async (): Promise<boolean> => {
    if (isAuthenticated) {
      // For authenticated users, always use subscription tokens (including free plan)
      if (userSubscription && userSubscription.isActive) {
        const tokenUsed = await useToken();
        if (tokenUsed) {
          console.log(`✅ Token used for authenticated user. Remaining: ${userSubscription.tokensRemaining - 1}`);
          // If it's a free plan, update the daily tokens used counter for display
          if (userSubscription.isFree) {
            setDailyTokensUsed(userSubscription.tokensUsed + 1);
          }
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

  // Check if user can send prompt based on their authentication status and subscription
  const canSendPrompt = isAuthenticated
    ? (!subscriptionLoading && userSubscription && userSubscription.isActive && canUseToken)  // Authenticated users with active subscription (including free plan) and available tokens
    : promptCount < maxPrompts;  // Anonymous users: 3 prompts total


  const value: PromptLimitContextType = {
    promptCount,
    maxPrompts,
    canSendPrompt,
    incrementPromptCount,
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
