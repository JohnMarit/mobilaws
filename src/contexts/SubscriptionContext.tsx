import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './FirebaseAuthContext';

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
  useToken: () => boolean;
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

  // Define subscription plans
  const plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 5,
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
      price: 10,
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
      price: 30,
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

  // Load user subscription and initialize free plan if needed
  useEffect(() => {
    const initializeSubscription = async () => {
      if (isAuthenticated && user) {
        setIsLoading(true);
        try {
          // Fetch from backend API (this will auto-create free plan if needed)
          const response = await fetch(`http://localhost:8000/api/subscription/${user.id}`);
          
          if (response.ok) {
            const result = await response.json();
            if (result.subscription) {
              setUserSubscription(result.subscription);
              localStorage.setItem(`subscription_${user.id}`, JSON.stringify(result.subscription));
              console.log(`✅ Subscription loaded for user: ${result.subscription.planId} plan with ${result.subscription.tokensRemaining} tokens`);
            }
          } else {
            // Fallback to localStorage if backend is unavailable
            const savedSubscription = localStorage.getItem(`subscription_${user.id}`);
            if (savedSubscription) {
              try {
                const subscription: UserSubscription = JSON.parse(savedSubscription);
                // Check if subscription is still valid
                if (subscription.isActive && (!subscription.expiryDate || new Date(subscription.expiryDate) > new Date())) {
                  setUserSubscription(subscription);
                } else {
                  // Subscription expired, mark as inactive
                  const expiredSubscription = { ...subscription, isActive: false };
                  setUserSubscription(expiredSubscription);
                  localStorage.setItem(`subscription_${user.id}`, JSON.stringify(expiredSubscription));
                }
              } catch (error) {
                console.error('Error parsing saved subscription:', error);
                setUserSubscription(null);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
          // Fallback to localStorage
          const savedSubscription = localStorage.getItem(`subscription_${user.id}`);
          if (savedSubscription) {
            const subscription: UserSubscription = JSON.parse(savedSubscription);
            setUserSubscription(subscription);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setUserSubscription(null);
      }
    };

    initializeSubscription();
  }, [isAuthenticated, user]);

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
      // Call backend API to create subscription
      const response = await fetch(`http://localhost:8000/api/subscription/${user.id}`, {
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
        localStorage.setItem(`subscription_${user.id}`, JSON.stringify(result.subscription));
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

  const useToken = useCallback(async (): Promise<boolean> => {
    if (!userSubscription || !userSubscription.isActive || userSubscription.tokensRemaining <= 0) {
      return false;
    }

    if (!user) {
      return false;
    }

    try {
      // Call backend API to use token
      const response = await fetch(`http://localhost:8000/api/subscription/${user.id}/use-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to use token: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const updatedSubscription = {
          ...userSubscription,
          tokensRemaining: result.tokensRemaining,
          tokensUsed: result.tokensUsed
        };

        setUserSubscription(updatedSubscription);
        localStorage.setItem(`subscription_${user.id}`, JSON.stringify(updatedSubscription));
        return true;
      } else {
        console.error('Failed to use token:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error using token:', error);
      return false;
    }
  }, [userSubscription, user]);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      // Fetch from backend API
      const response = await fetch(`http://localhost:8000/api/subscription/${user.id}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.subscription) {
          setUserSubscription(result.subscription);
          localStorage.setItem(`subscription_${user.id}`, JSON.stringify(result.subscription));
        } else {
          setUserSubscription(null);
          localStorage.removeItem(`subscription_${user.id}`);
        }
      } else {
        // Fallback to localStorage if backend is unavailable
        const savedSubscription = localStorage.getItem(`subscription_${user.id}`);
        if (savedSubscription) {
          const subscription: UserSubscription = JSON.parse(savedSubscription);
          setUserSubscription(subscription);
        }
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      // Fallback to localStorage if backend is unavailable
      const savedSubscription = localStorage.getItem(`subscription_${user.id}`);
      if (savedSubscription) {
        const subscription: UserSubscription = JSON.parse(savedSubscription);
        setUserSubscription(subscription);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const canUseToken = userSubscription?.isActive && (userSubscription.tokensRemaining > 0) || false;

  const value: SubscriptionContextType = {
    plans,
    userSubscription,
    isLoading,
    purchasePlan,
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
