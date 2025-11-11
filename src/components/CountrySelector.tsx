import { useState, useEffect, useRef } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useToast } from '@/hooks/use-toast';

interface CountrySelectorProps {
  className?: string;
}

export default function CountrySelector({ className = '' }: CountrySelectorProps) {
  const { selectedCountry, setSelectedCountry, countries, countryToFlag } = useCountry();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <img 
          src={countryToFlag[selectedCountry]} 
          alt={`${selectedCountry} flag`}
          className="w-5 h-4 object-cover rounded-sm border border-gray-200"
          loading="lazy"
        />
        <span className="hidden sm:inline text-gray-700">{selectedCountry}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[220px]">
          <ul className="max-h-80 overflow-y-auto p-1" role="listbox" aria-label="Select country">
            {countries.map((country) => (
              <li key={country}>
                <button
                  onClick={() => {
                    // Only South Sudan is currently supported
                    if (country !== 'South Sudan') {
                      toast({
                        title: 'Coming soon',
                        description:
                          'We currently support South Sudan. Uganda, Kenya, Tanzania, Burundi, Rwanda, DR Congo, and Somalia are coming soon.',
                      });
                      setIsOpen(false);
                      return;
                    }
                    setSelectedCountry(country);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2 ${
                    selectedCountry === country ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  role="option"
                  aria-selected={selectedCountry === country}
                >
                  <img 
                    src={countryToFlag[country]} 
                    alt={`${country} flag`}
                    className="w-5 h-4 object-cover rounded-sm border border-gray-200"
                    loading="lazy"
                  />
                  <span>{country}</span>
                  {selectedCountry === country && <span className="ml-auto text-blue-600">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


