import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AnimatedSearchInput from './AnimatedSearchInput';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: { tags?: string[]; part?: string; chapter?: string; lawSource?: string }) => void;
  isLoading?: boolean;
  resultCount?: number;
}

const QUICK_FILTERS = [
  { label: 'Bill of Rights', tag: 'bill of rights' },
  { label: 'Human Rights', tag: 'human rights' },
  { label: 'Citizenship', tag: 'citizenship' }
];

const LAW_SOURCE_FILTERS = [
  { label: 'Constitution', lawSource: 'Laws of South Sudan' },
  { label: 'Penal Code', lawSource: 'Penal Code Act South Sudan 2008' }
];

export default function SearchBar({ 
  query, 
  onQueryChange, 
  onSearch, 
  onFilterChange,
  isLoading = false,
  resultCount = 0
}: SearchBarProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeLawSource, setActiveLawSource] = useState<string>('');

  const handleFilterToggle = (tag: string) => {
    // Put the filter term in the search bar and perform search
    onQueryChange(tag);
    onSearch(tag);
    
    // Clear any existing filters since we're now searching by keyword
    setActiveFilters([]);
    setActiveLawSource('');
    onFilterChange({ tags: [], lawSource: undefined });
  };

  const handleLawSourceToggle = (lawSource: string) => {
    const newLawSource = activeLawSource === lawSource ? '' : lawSource;
    setActiveLawSource(newLawSource);
    onFilterChange({ tags: activeFilters, lawSource: newLawSource || undefined });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4">
      {/* Main Search */}
      <AnimatedSearchInput
        query={query}
        onQueryChange={onQueryChange}
        onSearch={onSearch}
        isLoading={isLoading}
      />

      {/* Search Results Count */}
      {query.trim() && (
        <div className="text-sm text-muted-foreground">
          <span>
            {resultCount} result{resultCount !== 1 ? 's' : ''} for "{query}"
          </span>
        </div>
      )}

      {/* Quick Filter Tags */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2 py-1.5 sm:py-2 whitespace-nowrap">Quick filters:</span>
          {QUICK_FILTERS.map((filter) => (
            <Badge
              key={filter.tag}
              variant={activeFilters.includes(filter.tag) ? "default" : "outline"}
              className="cursor-pointer transition-colors hover:bg-primary/10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 badge-mobile"
              onClick={() => handleFilterToggle(filter.tag)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
        {(activeFilters.length > 0 || activeLawSource) && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveFilters([]);
                setActiveLawSource('');
                onFilterChange({ tags: [] });
              }}
              className="h-6 text-xs px-2 hover:text-gray-900"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Law Source Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2 py-1.5 sm:py-2 whitespace-nowrap">Law sources:</span>
          {LAW_SOURCE_FILTERS.map((filter) => (
            <Badge
              key={filter.lawSource}
              variant={activeLawSource === filter.lawSource ? "default" : "outline"}
              className="cursor-pointer transition-colors hover:bg-primary/10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 badge-mobile"
              onClick={() => handleLawSourceToggle(filter.lawSource)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}