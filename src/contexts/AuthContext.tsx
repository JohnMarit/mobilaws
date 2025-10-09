import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { saveUserToFirestore, getUserFromFirestore } from '@/lib/userService';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  subscription?: {
    planId: string;
    tokensRemaining: number;
    tokensUsed: number;
    totalTokens: number;
    isActive: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Google OAuth
  useEffect(() => {
    const initializeGoogleAuth = () => {
      if (typeof window !== 'undefined' && window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        
        if (!clientId) {
          console.error('❌ VITE_GOOGLE_CLIENT_ID is not set in environment variables');
          console.error('Please set up Google OAuth credentials in your .env file');
          setIsLoading(false);
          return;
        }
        
        console.log('🔧 Initializing Google OAuth with Client ID:', clientId.substring(0, 20) + '...');
        
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false,
          });
          console.log('✅ Google OAuth initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing Google OAuth:', error);
        }
      } else {
        console.error('❌ Google OAuth script not loaded');
      }
    };

    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('📜 Google OAuth script loaded');
      initializeGoogleAuth();
    };
    script.onerror = () => {
      console.error('❌ Failed to load Google OAuth script');
    };
    document.head.appendChild(script);

    // Check for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Try to sync with Firestore to get latest user data
        getUserFromFirestore(parsedUser.id).then(firestoreUser => {
          if (firestoreUser) {
            setUser(firestoreUser);
            localStorage.setItem('user', JSON.stringify(firestoreUser));
          }
        }).catch(err => {
          console.warn('Could not sync with Firestore:', err);
        });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData: User = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };
      
      // Save user data to Firestore backend
      try {
        await saveUserToFirestore(userData);
        
        // Try to get updated user data from Firestore (including subscription info)
        const firestoreUser = await getUserFromFirestore(userData.id);
        if (firestoreUser) {
          setUser(firestoreUser);
          localStorage.setItem('user', JSON.stringify(firestoreUser));
        } else {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error syncing user with Firestore:', error);
        // Fallback to local data if Firestore fails
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      console.log('✅ User logged in successfully:', userData.name);
    } catch (error) {
      console.error('❌ Error processing login response:', error);
    }
  }, []);

  const login = useCallback(async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('❌ VITE_GOOGLE_CLIENT_ID is not configured');
      alert('Google OAuth is not configured. Please contact the administrator.');
      return;
    }
    
    // Real Google OAuth
    if (typeof window !== 'undefined' && window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Error triggering Google login:', error);
        alert('Failed to open Google sign-in. Please try again.');
      }
    } else {
      console.error('Google OAuth not available');
      alert('Google OAuth is not available. Please refresh the page and try again.');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Extend Window interface for Google OAuth
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
