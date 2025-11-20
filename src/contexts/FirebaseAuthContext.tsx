import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { saveUserToFirestore, getUserFromFirestore } from '@/lib/userService';
import { getApiUrl } from '@/lib/api';

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
  loginWithEmail?: (email: string, password: string) => Promise<void>;
  registerWithEmail?: (email: string, password: string, name: string) => Promise<void>;
  loginWithGithub?: () => Promise<void>;
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
  // Load user from localStorage immediately on mount (synchronous)
  // This prevents the "signing in" flash on page refresh
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ Restored user from localStorage:', parsedUser.name);
        return parsedUser;
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
    }
    return null;
  });
  
  // Start with isLoading=false if we have a cached user, true otherwise
  const [isLoading, setIsLoading] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return !savedUser; // Only show loading if there's no cached user
  });
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);

  // Check if Firebase is available
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        await import('firebase/app');
        setFirebaseAvailable(true);
        console.log('✅ Firebase available - using Firebase Auth');
        initializeFirebaseAuth();
      } catch (error) {
        console.warn('⚠️ Firebase not installed - using fallback Google OAuth');
        setFirebaseAvailable(false);
        initializeGoogleAuth();
      }
    };

    checkFirebase();
  }, []);

  // Firebase Authentication
  const initializeFirebaseAuth = async () => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      console.log('🔄 Setting up Firebase auth state listener...');

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔄 Firebase auth state check:', firebaseUser ? 'User confirmed' : 'User signed out');
        
        if (firebaseUser) {
          const userData: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            picture: firebaseUser.photoURL || undefined,
          };
          
          // Update localStorage immediately with basic user data
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Then try to sync with Firestore in the background (don't block UI)
          try {
            await saveUserToFirestore(userData);
            
            // Try to get updated user data from Firestore (including subscription info)
            const firestoreUser = await getUserFromFirestore(userData.id);
            if (firestoreUser) {
              // Merge Firestore data with auth data
              setUser(firestoreUser);
              localStorage.setItem('user', JSON.stringify(firestoreUser));
            }
            // Also sync user to backend for admin dashboard listing
            // CRITICAL: This ensures users appear in admin panel
            try {
              const syncUrl = getApiUrl('users/sync');
              console.log('═══════════════════════════════════════════════');
              console.log('📡 SYNCING USER TO BACKEND FOR ADMIN PANEL');
              console.log('═══════════════════════════════════════════════');
              console.log('🔗 Sync URL:', syncUrl);
              console.log('👤 User ID:', userData.id);
              console.log('📧 Email:', userData.email);
              console.log('👤 Name:', userData.name);
              console.log('🖼️ Picture:', userData.picture || 'none');
              
              const syncPayload = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                picture: userData.picture,
              };
              
              console.log('📤 Sending payload:', JSON.stringify(syncPayload, null, 2));
              
              const syncResponse = await fetch(syncUrl, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify(syncPayload)
              });
              
              console.log('📨 Response status:', syncResponse.status);
              
              if (syncResponse.ok) {
                const syncResult = await syncResponse.json();
                console.log('✅ ✅ ✅ USER SYNCED TO BACKEND SUCCESSFULLY! ✅ ✅ ✅');
                console.log('📊 Admin can now see this user in the admin panel!');
                console.log('📋 Sync result:', JSON.stringify(syncResult, null, 2));
                console.log('═══════════════════════════════════════════════');
              } else {
                const errorText = await syncResponse.text();
                console.error('═══════════════════════════════════════════════');
                console.error('❌ ❌ ❌ FAILED TO SYNC USER TO ADMIN PANEL! ❌ ❌ ❌');
                console.error('📨 Status:', syncResponse.status);
                console.error('📝 Error:', errorText);
                console.error('⚠️ USER WILL NOT APPEAR IN ADMIN DASHBOARD!');
                console.error('💡 Check backend logs and CORS settings');
                console.error('═══════════════════════════════════════════════');
                
                // Show alert to admin/developer
                if (import.meta.env.DEV) {
                  alert(`Failed to sync user to admin panel!\nStatus: ${syncResponse.status}\nCheck console for details.`);
                }
              }
            } catch (e) {
              console.error('═══════════════════════════════════════════════');
              console.error('❌ ❌ ❌ CRITICAL: USER SYNC FAILED! ❌ ❌ ❌');
              console.error('💥 Exception:', e);
              console.error('⚠️ USER WILL NOT APPEAR IN ADMIN DASHBOARD!');
              console.error('💡 Possible causes:');
              console.error('   - Backend is offline');
              console.error('   - VITE_API_URL not set correctly');
              console.error('   - CORS issues');
              console.error('   - Network connection problem');
              console.error('═══════════════════════════════════════════════');
              
              // Show alert to admin/developer
              if (import.meta.env.DEV) {
                alert(`Critical: Failed to sync user to backend!\nError: ${e}\nUser will NOT appear in admin panel.`);
              }
            }
          } catch (error) {
            console.error('Error syncing user with Firestore:', error);
            // Continue with local data if Firestore fails (already set above)
          }
          
          console.log('✅ User session verified:', userData.name);
        } else {
          console.log('ℹ️ No user signed in');
          setUser(null);
          localStorage.removeItem('user');
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error initializing Firebase auth:', error);
      setIsLoading(false);
      initializeGoogleAuth();
    }
  };

  // Fallback Google OAuth (original implementation)
  const initializeGoogleAuth = () => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        
        if (clientId) {
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
        }
      }
    };
    document.head.appendChild(script);

    // User is already loaded from localStorage in the initial state
    // Just finish loading
    setIsLoading(false);
  };

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData: User = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };
      
      // Save user data to Firestore backend (fallback OAuth)
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
        // Also sync user to backend for admin dashboard listing (fallback OAuth)
        // CRITICAL: This ensures users appear in admin panel
        try {
          const syncUrl = getApiUrl('users/sync');
          console.log('═══════════════════════════════════════════════');
          console.log('📡 SYNCING USER (FALLBACK OAUTH) TO BACKEND');
          console.log('═══════════════════════════════════════════════');
          console.log('🔗 Sync URL:', syncUrl);
          console.log('👤 User ID:', userData.id);
          console.log('📧 Email:', userData.email);
          console.log('👤 Name:', userData.name);
          
          const syncPayload = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
          };
          
          console.log('📤 Sending payload:', JSON.stringify(syncPayload, null, 2));
          
          const syncResponse = await fetch(syncUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(syncPayload)
          });
          
          console.log('📨 Response status:', syncResponse.status);
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log('✅ ✅ ✅ USER SYNCED TO BACKEND SUCCESSFULLY! ✅ ✅ ✅');
            console.log('📊 Admin can now see this user in the admin panel!');
            console.log('📋 Sync result:', JSON.stringify(syncResult, null, 2));
            console.log('═══════════════════════════════════════════════');
          } else {
            const errorText = await syncResponse.text();
            console.error('═══════════════════════════════════════════════');
            console.error('❌ ❌ ❌ FAILED TO SYNC USER! ❌ ❌ ❌');
            console.error('📨 Status:', syncResponse.status);
            console.error('📝 Error:', errorText);
            console.error('⚠️ USER WILL NOT APPEAR IN ADMIN DASHBOARD!');
            console.error('═══════════════════════════════════════════════');
          }
        } catch (e) {
          console.error('═══════════════════════════════════════════════');
          console.error('❌ ❌ ❌ CRITICAL: USER SYNC FAILED! ❌ ❌ ❌');
          console.error('💥 Exception:', e);
          console.error('⚠️ USER WILL NOT APPEAR IN ADMIN DASHBOARD!');
          console.error('═══════════════════════════════════════════════');
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
    if (firebaseAvailable) {
      // Firebase login
      try {
        const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        if (!auth) throw new Error('Firebase auth not available');
        
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        await signInWithPopup(auth, provider);
        console.log('✅ Firebase Google login successful');
      } catch (error) {
        console.error('❌ Firebase login failed:', error);
        throw error;
      }
    } else {
      // Fallback Google OAuth
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        try {
          window.google.accounts.id.prompt();
        } catch (error) {
          console.error('Error triggering Google login:', error);
        }
      }
    }
  }, [firebaseAvailable]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!firebaseAvailable) {
      throw new Error('Email login requires Firebase');
    }

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      if (!auth) throw new Error('Firebase auth not available');
      
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Email login successful');
    } catch (error) {
      console.error('❌ Email login failed:', error);
      throw error;
    }
  }, [firebaseAvailable]);

  const registerWithEmail = useCallback(async (email: string, password: string, name: string) => {
    if (!firebaseAvailable) {
      throw new Error('Email registration requires Firebase');
    }

    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      if (!auth) throw new Error('Firebase auth not available');
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      console.log('✅ Email registration successful');
    } catch (error) {
      console.error('❌ Email registration failed:', error);
      throw error;
    }
  }, [firebaseAvailable]);

  const loginWithGithub = useCallback(async () => {
    if (!firebaseAvailable) {
      throw new Error('GitHub login requires Firebase');
    }

    try {
      const { signInWithPopup, GithubAuthProvider } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      if (!auth) throw new Error('Firebase auth not available');
      
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');
      
      await signInWithPopup(auth, provider);
      console.log('✅ GitHub login successful');
    } catch (error) {
      console.error('❌ GitHub login failed:', error);
      throw error;
    }
  }, [firebaseAvailable]);

  const logout = useCallback(async () => {
    if (firebaseAvailable) {
      try {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        if (auth) {
          await signOut(auth);
        }
      } catch (error) {
        console.error('Error signing out from Firebase:', error);
      }
    }
    
    // Clear local state
    setUser(null);
    localStorage.removeItem('user');
    
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    console.log('✅ User signed out');
  }, [firebaseAvailable]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithEmail: firebaseAvailable ? loginWithEmail : undefined,
    registerWithEmail: firebaseAvailable ? registerWithEmail : undefined,
    loginWithGithub: firebaseAvailable ? loginWithGithub : undefined,
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