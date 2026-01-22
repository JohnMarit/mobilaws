import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './FirebaseAuthContext';
import { getApiUrl } from '@/lib/api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  tokens: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface UserSubscription {
  planId: string;
  tokensRemaining: number;
  tokensUsed: number;
  totalTokens: number;
  purchaseDate: string;
  expiryDate?: string;
  isActive: boolean;
  isFree?: boolean;
  lastResetDate?: string;
}

interface SubscriptionContextType {
  plans: SubscriptionPlan[];
  userSubscription: UserSubscription | null;
  isLoading: boolean;
  purchasePlan: (planId: string) => Promise<boolean>;
  initiatePayment: (planId: string) => Promise<{ success: boolean; paymentLink?: string; paymentId?: string; error?: string }>;
  verifyPayment: (paymentId: string) => Promise<boolean>;
  useToken: (amount?: number) => Promise<boolean>;
  canUseToken: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Define subscription plans (prices shown in USD, converted to KES for Paystack)
  // Exchange rate: $1 ≈ KSh 120-135 (using ~120 for Basic, ~135 for Standard/Premium)
  const plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 5, // Shown as $5 to user
      tokens: 50,
      description: 'Perfect for occasional legal queries',
      features: [
        '50 AI tokens',
        'Basic legal document search',
        'Email support',
        'Valid for 30 days'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 10, // Shown as $10 to user
      tokens: 120,
      description: 'Great for regular legal assistance',
      features: [
        '120 AI tokens',
        'Advanced legal document search',
        'Priority support',
        'Valid for 30 days',
        '20% more tokens than Basic'
      ],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 30, // Shown as $30 to user
      tokens: 500,
      description: 'Best value for heavy legal research',
      features: [
        '500 AI tokens',
        'Full legal document access',
        'Priority support',
        'Valid for 30 days',
        'Best value per token'
      ]
    }
  ];

  // Keep free-plan tokens in Firestore so refreshes/browser actions cannot reset them
  const syncFreePlanFromFirestore = useCallback(async (): Promise<UserSubscription | null> => {
    if (!user) return null;

    try {
      const { getTokenUsage } = await import('@/lib/tokenService');
      const usage = await getTokenUsage(user.id, false);

      if (!usage) return null;

      const tokensRemaining = Math.max(0, usage.maxTokens - usage.tokensUsed);

      const freePlan: UserSubscription = {
        planId: 'free',
        tokensRemaining,
        tokensUsed: usage.tokensUsed,
        totalTokens: usage.maxTokens,
        purchaseDate: usage.createdAt && 'toDate' in usage.createdAt ? usage.createdAt.toDate().toISOString() : new Date().toISOString(),
        lastResetDate: usage.resetAfter && 'toDate' in usage.resetAfter ? usage.resetAfter.toDate().toISOString() : undefined,
        isActive: true,
        isFree: true
      };

      return freePlan;
    } catch (error) {
      console.error('Error syncing free tokens from Firestore:', error);
      return null;
    }
  }, [user]);

  // Load user subscription and initialize free plan if needed (no localStorage fallback)
  useEffect(() => {
    const initializeSubscription = async () => {
      if (isAuthenticated && user) {
        console.log(`🔄 Initializing subscription for user: ${user.id}`);
        setIsLoading(true);
        try {
          // Fetch from backend API (this will auto-create free plan if needed)
          const response = await fetch(getApiUrl(`subscription/${user.id}`));

          if (response.ok) {
            const result = await response.json();
            if (result.subscription) {
              if (result.subscription.planId === 'free') {
                const freePlan = await syncFreePlanFromFirestore();
                if (freePlan) {
                  setUserSubscription(freePlan);
                  console.log(`✅ Free subscription loaded from Firestore: ${freePlan.tokensRemaining} tokens`);
                } else {
                  setUserSubscription(result.subscription);
                  console.log(`✅ Subscription loaded for user: ${result.subscription.planId} plan with ${result.subscription.tokensRemaining} tokens`);
                }
              } else {
                setUserSubscription(result.subscription);
                console.log(`✅ Subscription loaded for user: ${result.subscription.planId} plan with ${result.subscription.tokensRemaining} tokens`);
              }
            } else {
              // No subscription returned - attempt to sync free plan from Firestore
              const freePlan = await syncFreePlanFromFirestore();
              if (freePlan) {
                setUserSubscription(freePlan);
                console.log(`✅ Free plan initialized via Firestore`);
              } else {
                setUserSubscription(null);
              }
            }
          } else {
            console.warn(`⚠️ Backend returned error: ${response.status}`);
            const freePlan = await syncFreePlanFromFirestore();
            if (freePlan) {
              setUserSubscription(freePlan);
              console.log(`✅ Fallback to Firestore free plan`);
            } else {
              setUserSubscription(null);
            }
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
          const freePlan = await syncFreePlanFromFirestore();
          if (freePlan) {
            setUserSubscription(freePlan);
            console.log(`✅ Fallback to Firestore free plan`);
          } else {
            setUserSubscription(null);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setUserSubscription(null);
      }
    };

    initializeSubscription();
    
    // Set up polling interval to check for token updates every 10 seconds
    // This allows users to see tokens granted by admin without manual refresh
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isAuthenticated && user) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(getApiUrl(`subscription/${user.id}`));
          if (response.ok) {
            const result = await response.json();
            if (result.subscription) {
              // Only update if there's a meaningful change (avoid unnecessary re-renders)
              setUserSubscription(prev => {
                if (!prev || 
                    prev.tokensRemaining !== result.subscription.tokensRemaining ||
                    prev.totalTokens !== result.subscription.totalTokens ||
                    prev.planId !== result.subscription.planId) {
                  console.log(`🔄 Token update detected: ${result.subscription.tokensRemaining} remaining`);
                  return result.subscription;
                }
                return prev;
              });
            }
          }
        } catch (error) {
          // Silently fail - polling is best-effort
          console.debug('Token polling check failed:', error);
        }
      }, 10000); // Poll every 10 seconds
    }
    
    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, user, syncFreePlanFromFirestore]);

  // Keep free-tier token state in sync with Firestore (midnight resets)
  useEffect(() => {
    const syncFreeTokens = async () => {
      if (!isAuthenticated || !user) return;

      // Do not overwrite paid subscriptions
      if (userSubscription && userSubscription.isActive && !userSubscription.isFree && userSubscription.planId !== 'free') {
        return;
      }

      const freePlan = await syncFreePlanFromFirestore();
      if (freePlan) {
        setUserSubscription(prev => {
          if (prev && !prev.isFree && prev.planId !== 'free') {
            return prev;
          }
          return freePlan;
        });
        localStorage.setItem(`subscription_${user.id}`, JSON.stringify(freePlan));
      }
    };

    syncFreeTokens();
  }, [isAuthenticated, user, userSubscription?.planId, userSubscription?.isFree, syncFreePlanFromFirestore]);

  const purchasePlan = useCallback(async (planId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      console.error('User must be authenticated to purchase a plan');
      return false;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      console.error('Invalid plan ID');
      return false;
    }

    setIsLoading(true);

    try {
      // Call backend API to create subscription (demo mode - no payment)
      const response = await fetch(getApiUrl(`subscription/${user.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          tokens: plan.tokens,
          price: plan.price
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create subscription: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setUserSubscription(result.subscription);
        console.log(`✅ Successfully purchased ${plan.name} plan with ${plan.tokens} tokens`);
        return true;
      } else {
        throw new Error(result.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error purchasing plan:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, plans]);

  const initiatePayment = useCallback(async (planId: string): Promise<{ success: boolean; paymentLink?: string; paymentId?: string; error?: string }> => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'User must be authenticated to purchase a plan' };
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      return { success: false, error: 'Invalid plan ID' };
    }

    setIsLoading(true);
    
    try {
      // Create payment link with Paystack
      const response = await fetch(getApiUrl('payment/create-link'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          planName: plan.name,
          price: plan.price,
          tokens: plan.tokens,
          userEmail: user.email || undefined,
          userName: user.displayName || undefined,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment link');
      }

      const result = await response.json();
      
      if (result.paymentLink) {
        console.log(`✅ Payment link created for ${plan.name} plan - $${plan.price}`);
        return { success: true, paymentLink: result.paymentLink, paymentId: result.reference || result.paymentId };
      } else {
        throw new Error('No payment link received');
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment link' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, plans]);

  const verifyPayment = useCallback(async (paymentId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      console.error('User must be authenticated to verify payment');
      return false;
    }

    setIsLoading(true);
    
    try {
      // Verify payment with backend
      const response = await fetch(getApiUrl('payment/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: paymentId,
          paymentId: paymentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment');
      }

      const result = await response.json();
      
      if (result.success && result.subscription) {
        setUserSubscription(result.subscription);
        console.log(`✅ Payment verified and subscription created successfully`);
        return true;
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, syncFreePlanFromFirestore]);

  const useToken = useCallback(async (amount: number = 1): Promise<boolean> => {
    if (!userSubscription || !userSubscription.isActive) {
      return false;
    }

    if (!user) {
      return false;
    }

    const amt = Math.max(1, Math.floor(amount));
    const isPremium = userSubscription.planId?.toLowerCase() === 'premium';

    if (!isPremium && userSubscription.tokensRemaining < amt) {
      console.warn(`⚠️ Not enough tokens: need ${amt}, have ${userSubscription.tokensRemaining}`);
      return false;
    }

    try {
      const response = await fetch(getApiUrl(`subscription/${user.id}/use-token`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to use token:', errorData.error || response.statusText);
        return false;
      }

      const result = await response.json();

      if (result.success) {
        const updatedSubscription = {
          ...userSubscription,
          tokensRemaining: result.tokensRemaining,
          tokensUsed: result.tokensUsed,
          planId: result.planId || userSubscription.planId,
          isFree: result.isFree,
          lastResetDate: result.lastResetDate
        };
        setUserSubscription(updatedSubscription);
        console.log(`✅ Tokens used: ${amt} (${result.planId}). Remaining: ${result.tokensRemaining}`);
        return true;
      }
      console.error('Failed to use token:', result.error);
      return false;
    } catch (error) {
      console.error('Error using token via backend:', error);
      console.warn('⚠️ Using local token management fallback');
      const updatedSubscription = {
        ...userSubscription,
        tokensRemaining: Math.max(0, userSubscription.tokensRemaining - amt),
        tokensUsed: userSubscription.tokensUsed + amt
      };
      setUserSubscription(updatedSubscription);
      console.log(`✅ Tokens used locally (fallback): ${amt}. Remaining: ${updatedSubscription.tokensRemaining}`);
      return true;
    }
  }, [userSubscription, user]);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      // Fetch from backend API
      const response = await fetch(getApiUrl(`subscription/${user.id}`));

      if (response.ok) {
        const result = await response.json();
        if (result.subscription) {
          if (result.subscription.planId === 'free') {
            const freePlan = await syncFreePlanFromFirestore();
            if (freePlan) {
              setUserSubscription(freePlan);
              return;
            }
          }
          setUserSubscription(result.subscription);
        } else {
          setUserSubscription(null);
        }
      } else {
        const freePlan = await syncFreePlanFromFirestore();
        if (freePlan) {
          setUserSubscription(freePlan);
        }
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      const freePlan = await syncFreePlanFromFirestore();
      if (freePlan) {
        setUserSubscription(freePlan);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, syncFreePlanFromFirestore]);

  // Premium users should have access even if tokensRemaining is low (they can get more via backend)
  // For non-premium users, check if tokensRemaining > 0 or if it's a free plan with daily limit
  const isPremium = userSubscription?.planId?.toLowerCase() === 'premium';
  const canUseToken = !!(
    userSubscription?.isActive && 
    (
      isPremium || // Premium users have access
      userSubscription.tokensRemaining > 0 || // Has tokens remaining
      userSubscription.isFree // Free plan users have daily limit managed separately
    )
  );

  const value: SubscriptionContextType = {
    plans,
    userSubscription,
    isLoading,
    purchasePlan,
    initiatePayment,
    verifyPayment,
    useToken,
    canUseToken,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
