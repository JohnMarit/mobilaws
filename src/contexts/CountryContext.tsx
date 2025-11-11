import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type SupportedCountry =
  | 'South Sudan'
  | 'Uganda'
  | 'Kenya'
  | 'Tanzania'
  | 'Burundi'
  | 'Rwanda'
  | 'DR Congo'
  | 'Somalia';

type CountryContextType = {
  selectedCountry: SupportedCountry;
  setSelectedCountry: (country: SupportedCountry) => void;
  countries: SupportedCountry[];
  countryToFlag: Record<SupportedCountry, string>;
  countryToCode: Record<SupportedCountry, string>;
};

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const useCountry = () => {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return ctx;
};

const COUNTRIES: SupportedCountry[] = [
  'South Sudan',
  'Uganda',
  'Kenya',
  'Tanzania',
  'Burundi',
  'Rwanda',
  'DR Congo',
  'Somalia',
];

// ISO 3166-1 alpha-2 country codes for flag images
const COUNTRY_CODES: Record<SupportedCountry, string> = {
  'South Sudan': 'SS',
  'Uganda': 'UG',
  'Kenya': 'KE',
  'Tanzania': 'TZ',
  'Burundi': 'BI',
  'Rwanda': 'RW',
  'DR Congo': 'CD',
  'Somalia': 'SO',
};

// Flag image URLs using flagcdn.com
const COUNTRY_FLAGS: Record<SupportedCountry, string> = {
  'South Sudan': `https://flagcdn.com/w40/${COUNTRY_CODES['South Sudan'].toLowerCase()}.png`,
  'Uganda': `https://flagcdn.com/w40/${COUNTRY_CODES['Uganda'].toLowerCase()}.png`,
  'Kenya': `https://flagcdn.com/w40/${COUNTRY_CODES['Kenya'].toLowerCase()}.png`,
  'Tanzania': `https://flagcdn.com/w40/${COUNTRY_CODES['Tanzania'].toLowerCase()}.png`,
  'Burundi': `https://flagcdn.com/w40/${COUNTRY_CODES['Burundi'].toLowerCase()}.png`,
  'Rwanda': `https://flagcdn.com/w40/${COUNTRY_CODES['Rwanda'].toLowerCase()}.png`,
  'DR Congo': `https://flagcdn.com/w40/${COUNTRY_CODES['DR Congo'].toLowerCase()}.png`,
  'Somalia': `https://flagcdn.com/w40/${COUNTRY_CODES['Somalia'].toLowerCase()}.png`,
};

interface CountryProviderProps {
  children: ReactNode;
}

export const CountryProvider = ({ children }: CountryProviderProps) => {
  const [selectedCountry, setSelectedCountryState] = useState<SupportedCountry>('South Sudan');

  useEffect(() => {
    const saved = localStorage.getItem('selectedCountry');
    if (saved && COUNTRIES.includes(saved as SupportedCountry)) {
      setSelectedCountryState(saved as SupportedCountry);
    }
  }, []);

  const setSelectedCountry = (country: SupportedCountry) => {
    setSelectedCountryState(country);
    localStorage.setItem('selectedCountry', country);
  };

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        countries: COUNTRIES,
        countryToFlag: COUNTRY_FLAGS,
        countryToCode: COUNTRY_CODES,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
};


