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
      setIsTutorAdmin(false);
      setTutor(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl(`tutor-admin/check/${user.email}`));
      const data = await response.json();

      if (data.isTutorAdmin) {
        setIsTutorAdmin(true);
        setTutor(data.tutor);
      } else {
        setIsTutorAdmin(false);
        setTutor(null);
      }
    } catch (error) {
      console.error('Failed to check tutor admin status:', error);
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

