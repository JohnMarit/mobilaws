import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './FirebaseAuthContext';
import { getApiUrl } from '@/lib/api';

interface TutorAdmin {
  id: string;
  email: string;
  name: string;
  picture?: string;
  specializations?: string[];
  bio?: string;
  active: boolean;
}

interface TutorAdminContextValue {
  isTutorAdmin: boolean;
  tutor: TutorAdmin | null;
  isLoading: boolean;
  refreshTutorStatus: () => Promise<void>;
}

const TutorAdminContext = createContext<TutorAdminContextValue | undefined>(undefined);

export function TutorAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isTutorAdmin, setIsTutorAdmin] = useState(false);
  const [tutor, setTutor] = useState<TutorAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkTutorStatus = async () => {
    if (!user?.email) {
      console.log('❌ No user email found for tutor admin check');
      setIsTutorAdmin(false);
      setTutor(null);
      setIsLoading(false);
      return;
    }

    try {
      // URL encode the email to handle special characters
      const encodedEmail = encodeURIComponent(user.email);
      const checkUrl = getApiUrl(`tutor-admin/check/${encodedEmail}`);
      console.log('═══════════════════════════════════════════════');
      console.log('🔍 CHECKING TUTOR ADMIN STATUS');
      console.log('═══════════════════════════════════════════════');
      console.log('📧 User email:', user.email);
      console.log('📧 Encoded email:', encodedEmail);
      console.log('🔗 Check URL:', checkUrl);
      
      const response = await fetch(checkUrl);
      const data = await response.json();
      
      console.log('📡 Response status:', response.status);
      console.log('📦 Response data:', JSON.stringify(data, null, 2));

      if (data.isTutorAdmin && data.tutor) {
        console.log('✅ ✅ ✅ TUTOR ADMIN ACCESS GRANTED! ✅ ✅ ✅');
        console.log('👤 Tutor:', data.tutor.name);
        console.log('📧 Email:', data.tutor.email);
        console.log('🆔 ID:', data.tutor.id);
        console.log('✓ Active:', data.tutor.active);
        console.log('═══════════════════════════════════════════════');
        setIsTutorAdmin(true);
        setTutor(data.tutor);
      } else {
        console.error('═══════════════════════════════════════════════');
        console.error('❌ ❌ ❌ TUTOR ADMIN ACCESS DENIED! ❌ ❌ ❌');
        console.error('📧 Checked email:', user.email);
        console.error('📋 Response:', JSON.stringify(data, null, 2));
        console.error('');
        console.error('💡 TROUBLESHOOTING STEPS:');
        console.error('1. Make sure a tutor admin account exists for this email');
        console.error('2. Check that the email matches EXACTLY (no typos, case matters)');
        console.error('3. Verify the account is marked as active in Firestore');
        console.error('4. Try the diagnostic tool: check-tutor-status.html');
        console.error('5. Sign out and sign in again');
        console.error('═══════════════════════════════════════════════');
        setIsTutorAdmin(false);
        setTutor(null);
      }
    } catch (error) {
      console.error('═══════════════════════════════════════════════');
      console.error('❌ ❌ ❌ CRITICAL ERROR CHECKING TUTOR STATUS! ❌ ❌ ❌');
      console.error('💥 Error:', error);
      console.error('📧 User email:', user.email);
      console.error('');
      console.error('💡 POSSIBLE CAUSES:');
      console.error('   - Backend API is offline or unreachable');
      console.error('   - CORS configuration issue');
      console.error('   - Network connection problem');
      console.error('   - Firestore not initialized properly');
      console.error('═══════════════════════════════════════════════');
      setIsTutorAdmin(false);
      setTutor(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkTutorStatus();
  }, [user?.email]);

  const refreshTutorStatus = async () => {
    setIsLoading(true);
    await checkTutorStatus();
  };

  return (
    <TutorAdminContext.Provider
      value={{
        isTutorAdmin,
        tutor,
        isLoading,
        refreshTutorStatus,
      }}
    >
      {children}
    </TutorAdminContext.Provider>
  );
}

export function useTutorAdmin() {
  const context = useContext(TutorAdminContext);
  if (!context) {
    throw new Error('useTutorAdmin must be used within TutorAdminProvider');
  }
  return context;
}

