import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './FirebaseAuthContext';
import { useSubscription } from './SubscriptionContext';

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
  const maxPrompts = 3; // Anonymous users limit
  const maxDailyTokens = 5; // Free plan users limit

  // Load prompt count and daily tokens from localStorage on mount
  useEffect(() => {
    const savedCount = localStorage.getItem('promptCount');
    if (savedCount) {
      try {
        setPromptCount(parseInt(savedCount, 10));
      } catch (error) {
        console.error('Error parsing saved prompt count:', error);
        setPromptCount(0);
      }
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
    localStorage.setItem('promptCount', promptCount.toString());
  }, [promptCount]);

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
      setPromptCount(prev => prev + 1);
      return true;
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
