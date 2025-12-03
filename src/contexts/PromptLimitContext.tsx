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
  const maxPrompts = 3; // Daily limit for all users (anonymous and signed-up without subscription)
  const maxDailyTokens = 5; // Free plan users limit

  // Load prompt count and check for 24-hour reset
  useEffect(() => {
    // Get anonymous user ID for consistent storage
    const anonymousId = getAnonymousUserId();
    const promptCountKey = `promptCount_${anonymousId}`;
    const firstPromptTimeKey = `firstPromptTime_${anonymousId}`;

    const savedCount = localStorage.getItem(promptCountKey);
    const savedFirstPromptTime = localStorage.getItem(firstPromptTimeKey);

    if (savedCount && savedFirstPromptTime) {
      try {
        const count = parseInt(savedCount, 10);
        const firstPromptTime = parseInt(savedFirstPromptTime, 10);
        const now = Date.now();
        const hoursElapsed = (now - firstPromptTime) / (1000 * 60 * 60);

        // Check if 24 hours have passed since FIRST prompt
        if (hoursElapsed >= 24) {
          // Reset after 24 hours
          console.log('🔄 24 hours elapsed since first prompt, resetting count to 0');
          setPromptCount(0);
          localStorage.setItem(promptCountKey, '0');
          localStorage.removeItem(firstPromptTimeKey); // Clear first prompt time
        } else {
          // Still within 24-hour window
          setPromptCount(count);
          console.log(`✅ Loaded prompt count: ${count}/${maxPrompts} (${(24 - hoursElapsed).toFixed(1)} hours until reset)`);
        }
      } catch (error) {
        console.error('Error parsing saved prompt data:', error);
        setPromptCount(0);
        localStorage.removeItem(firstPromptTimeKey);
      }
    } else {
      // No saved data - initialize
      setPromptCount(0);
    }

    // Load daily tokens data for signed-up users
    const savedTokens = localStorage.getItem('dailyTokens');
    const savedTokensFirstTime = localStorage.getItem('tokensFirstTime');

    if (savedTokens && savedTokensFirstTime) {
      try {
        const tokensData = JSON.parse(savedTokens);
        const firstTokenTime = parseInt(savedTokensFirstTime, 10);
        const now = Date.now();
        const hoursElapsed = (now - firstTokenTime) / (1000 * 60 * 60);

        // Check if 24 hours have passed since FIRST token use
        if (hoursElapsed >= 24) {
          console.log('🔄 24 hours elapsed since first token use, resetting to 0');
          setDailyTokensUsed(0);
          setTokensResetDate(new Date().toISOString());
          localStorage.setItem('dailyTokens', JSON.stringify({ used: 0 }));
          localStorage.removeItem('tokensFirstTime');
        } else {
          setDailyTokensUsed(tokensData.used || 0);
          setTokensResetDate(new Date(firstTokenTime).toISOString());
          console.log(`✅ Loaded tokens: ${tokensData.used}/${maxDailyTokens} (${(24 - hoursElapsed).toFixed(1)} hours until reset)`);
        }
      } catch (error) {
        console.error('Error parsing saved tokens:', error);
        setDailyTokensUsed(0);
        setTokensResetDate(new Date().toISOString());
      }
    } else {
      // Initialize
      setDailyTokensUsed(0);
      setTokensResetDate(new Date().toISOString());
    }
  }, []);

  // Save prompt count to localStorage whenever it changes
  useEffect(() => {
    const anonymousId = getAnonymousUserId();
    const promptCountKey = `promptCount_${anonymousId}`;

    // Only save if promptCount is valid (not negative or NaN)
    if (typeof promptCount === 'number' && promptCount >= 0 && !isNaN(promptCount)) {
      localStorage.setItem(promptCountKey, promptCount.toString());
      console.log(`📊 Token count saved: ${promptCount}/${maxPrompts}`);
    } else {
      console.error('⚠️ Invalid promptCount detected, not saving:', promptCount);
    }
  }, [promptCount, maxPrompts]);

  // Save daily tokens to localStorage whenever it changes
  useEffect(() => {
    if (tokensResetDate) {
      localStorage.setItem('dailyTokens', JSON.stringify({ used: dailyTokensUsed, date: tokensResetDate }));
      localStorage.setItem('tokensResetDate', tokensResetDate);
    }
  }, [dailyTokensUsed, tokensResetDate]);

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

            // Track first token time for 24-hour reset
            const tokensFirstTime = localStorage.getItem('tokensFirstTime');
            if (!tokensFirstTime) {
              const now = Date.now();
              localStorage.setItem('tokensFirstTime', now.toString());
              console.log('🕐 First token used - 24-hour countdown started');
            }
          }
        }
        return tokenUsed;
      }
      return false;
    } else {
      // For anonymous users, increment prompt count
      setPromptCount(prev => {
        const newCount = prev + 1;

        // Track first prompt time for 24-hour reset
        const anonymousId = getAnonymousUserId();
        const firstPromptTimeKey = `firstPromptTime_${anonymousId}`;
        const firstPromptTime = localStorage.getItem(firstPromptTimeKey);

        if (!firstPromptTime && newCount === 1) {
          const now = Date.now();
          localStorage.setItem(firstPromptTimeKey, now.toString());
          console.log('🕐 First prompt used - 24-hour countdown started');
        }

        console.log(`✅ Token used for anonymous user: ${newCount}/${maxPrompts}`);
        return newCount;
      });
      return true;
    }
  }, [isAuthenticated, userSubscription, useToken, maxPrompts]);

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
