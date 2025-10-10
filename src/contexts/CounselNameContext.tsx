import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// South Sudan names from names.md (removing duplicates)
const SOUTH_SUDAN_NAMES = [
  'Deng', 'Pout', 'Wani', 'Poni', 'Aluel', 'Mary'
];

interface CounselNameContextType {
  selectedName: string;
  setSelectedName: (name: string) => void;
  availableNames: string[];
  customNames: string[];
  addCustomName: (name: string) => boolean;
  deleteCustomName: (name: string) => void;
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
  const [selectedName, setSelectedNameState] = useState<string>('Deng'); // Default to Deng
  const [customNames, setCustomNames] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    // Load custom names from localStorage
    const savedCustomNames = localStorage.getItem('customCounselNames');
    let loadedCustomNames: string[] = [];
    if (savedCustomNames) {
      try {
        const parsed = JSON.parse(savedCustomNames);
        loadedCustomNames = Array.isArray(parsed) ? parsed : [];
        setCustomNames(loadedCustomNames);
      } catch (error) {
        console.error('Error parsing custom counsel names:', error);
        setCustomNames([]);
      }
    }

    // Load selected name from localStorage
    const savedName = localStorage.getItem('counselName');
    const allNames = [...SOUTH_SUDAN_NAMES, ...loadedCustomNames];
    if (savedName && allNames.includes(savedName)) {
      setSelectedNameState(savedName);
    } else {
      setSelectedNameState('Deng');
    }
  }, []);

  // Update available names when custom names change
  const availableNames = [...SOUTH_SUDAN_NAMES, ...customNames];

  // Save to localStorage when name changes
  const setSelectedName = (name: string) => {
    if (availableNames.includes(name)) {
      setSelectedNameState(name);
      localStorage.setItem('counselName', name);
    }
  };

  // Add custom name
  const addCustomName = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName && 
        trimmedName.length > 0 && 
        trimmedName.length <= 50 && 
        !availableNames.includes(trimmedName)) {
      const newCustomNames = [...customNames, trimmedName];
      setCustomNames(newCustomNames);
      localStorage.setItem('customCounselNames', JSON.stringify(newCustomNames));
      return true;
    }
    return false;
  };

  // Delete custom name
  const deleteCustomName = (name: string) => {
    const newCustomNames = customNames.filter(n => n !== name);
    setCustomNames(newCustomNames);
    localStorage.setItem('customCounselNames', JSON.stringify(newCustomNames));
    
    // If the deleted name was selected, switch to default
    if (selectedName === name) {
      setSelectedNameState('Deng');
      localStorage.setItem('counselName', 'Deng');
    }
  };

  const value: CounselNameContextType = {
    selectedName,
    setSelectedName,
    availableNames,
    customNames,
    addCustomName,
    deleteCustomName,
  };

  return (
    <CounselNameContext.Provider value={value}>
      {children}
    </CounselNameContext.Provider>
  );
};
