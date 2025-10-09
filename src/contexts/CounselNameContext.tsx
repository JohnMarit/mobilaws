import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// South Sudan names from names.md (removing duplicates)
const SOUTH_SUDAN_NAMES = [
  'Deng', 'Gatluak', 'Nyaluak', 'Puot', 'Lam', 'Ladu', 'Wani', 'Kenyi', 
  'Mary', 'Taban', 'Akol', 'Abuk', 'Majok', 'Garang', 'Aluel', 'John', 
  'James', 'David', 'Grace'
];

interface CounselNameContextType {
  selectedName: string;
  setSelectedName: (name: string) => void;
  availableNames: string[];
}

const CounselNameContext = createContext<CounselNameContextType | undefined>(undefined);

export const useCounselName = () => {
  const context = useContext(CounselNameContext);
  if (context === undefined) {
    throw new Error('useCounselName must be used within a CounselNameProvider');
  }
  return context;
};

interface CounselNameProviderProps {
  children: ReactNode;
}

export const CounselNameProvider: React.FC<CounselNameProviderProps> = ({ children }) => {
  const [selectedName, setSelectedNameState] = useState<string>('Gatluak'); // Default to Gatluak for testing

  // Load from localStorage on mount
  useEffect(() => {
    // Clear localStorage for testing and force Gatluak
    localStorage.removeItem('counselName');
    setSelectedNameState('Gatluak');
    
    // Original logic (commented out for testing)
    // const savedName = localStorage.getItem('counselName');
    // if (savedName && SOUTH_SUDAN_NAMES.includes(savedName)) {
    //   setSelectedNameState(savedName);
    // }
  }, []);

  // Save to localStorage when name changes
  const setSelectedName = (name: string) => {
    if (SOUTH_SUDAN_NAMES.includes(name)) {
      setSelectedNameState(name);
      localStorage.setItem('counselName', name);
    }
  };

  const value: CounselNameContextType = {
    selectedName,
    setSelectedName,
    availableNames: SOUTH_SUDAN_NAMES,
  };

  return (
    <CounselNameContext.Provider value={value}>
      {children}
    </CounselNameContext.Provider>
  );
};
