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

  // Load prompt count and daily tokens from localStorage on mount
  // Check if 24 hours have passed and reset if needed
  useEffect(() => {
    // Get anonymous user ID for consistent storage
    const anonymousId = getAnonymousUserId();
    const promptCountKey = `promptCount_${anonymousId}`;
    const promptDateKey = `promptCountDate_${anonymousId}`;

    const savedCount = localStorage.getItem(promptCountKey);
    const savedDate = localStorage.getItem(promptDateKey);
    const today = new Date().toDateString();

    if (savedCount && savedDate) {
      try {
        // Check if 24 hours have passed (new day)
        if (savedDate !== today) {
          // Reset prompts for new day
          console.log('🔄 New day detected, resetting prompt count to 0');
          setPromptCount(0);
          localStorage.setItem(promptCountKey, '0');
          localStorage.setItem(promptDateKey, today);
        } else {
          // Same day, load saved count
          setPromptCount(parseInt(savedCount, 10));
        }
      } catch (error) {
        console.error('Error parsing saved prompt count:', error);
        setPromptCount(0);
        localStorage.setItem(promptDateKey, today);
      }
    } else {
      // First time, initialize
      setPromptCount(0);
      localStorage.setItem(promptDateKey, today);
    }

    // Load daily tokens data
    const savedTokens = localStorage.getItem('dailyTokens');
    const savedResetDate = localStorage.getItem('tokensResetDate');

    if (savedTokens && savedResetDate) {
      try {
        const tokensData = JSON.parse(savedTokens);
        const resetDate = savedResetDate;
        const today = new Date().toDateString();

        // Check if we need to reset tokens (new day)
        if (resetDate !== today) {
          setDailyTokensUsed(0);
          setTokensResetDate(today);
          localStorage.setItem('dailyTokens', JSON.stringify({ used: 0, date: today }));
          localStorage.setItem('tokensResetDate', today);
        } else {
          setDailyTokensUsed(tokensData.used || 0);
          setTokensResetDate(resetDate);
        }
      } catch (error) {
        console.error('Error parsing saved tokens:', error);
        setDailyTokensUsed(0);
        setTokensResetDate(new Date().toDateString());
      }
    } else {
      // Initialize for first time
      const today = new Date().toDateString();
      setDailyTokensUsed(0);
      setTokensResetDate(today);
      localStorage.setItem('dailyTokens', JSON.stringify({ used: 0, date: today }));
      localStorage.setItem('tokensResetDate', today);
    }
  }, []);

  // Save prompt count to localStorage whenever it changes
  useEffect(() => {
    const anonymousId = getAnonymousUserId();
    const promptCountKey = `promptCount_${anonymousId}`;
    const promptDateKey = `promptCountDate_${anonymousId}`;

    // Only save if promptCount is valid (not negative or NaN)
    if (typeof promptCount === 'number' && promptCount >= 0 && !isNaN(promptCount)) {
      localStorage.setItem(promptCountKey, promptCount.toString());
      localStorage.setItem(promptDateKey, new Date().toDateString());
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
          }
        }
        return tokenUsed;
      }
      return false;
    } else {
      // For anonymous users, increment prompt count
      setPromptCount(prev => {
        const newCount = prev + 1;
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
