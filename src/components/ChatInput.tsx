import { useState, useRef, useEffect } from 'react';
import { Send, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}


const QUICK_FILTERS = [
  { label: 'Bill of Rights', query: 'bill of rights fundamental rights' },
  { label: 'Human Rights', query: 'human rights dignity' },
  { label: 'Citizenship', query: 'citizenship nationality' },
  { label: 'Government', query: 'government structure executive' },
  { label: 'Education', query: 'education right to education' },
  { label: 'Justice', query: 'justice judicial system' }
];

export default function ChatInput({ 
  onSendMessage, 
  isLoading = false, 
  placeholder = "Ask me anything about South Sudan laws...",
  disabled = false
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  // Load recent queries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('law-chat-history');
    if (saved) {
      try {
        setRecentQueries(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled && !isLoading) {
      inputRef.current.focus();
    }
  }, [disabled, isLoading]);

  // Save query to history
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...recentQueries.filter(q => q !== query)].slice(0, 10);
    setRecentQueries(newHistory);
    localStorage.setItem('law-chat-history', JSON.stringify(newHistory));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      saveToHistory(input.trim());
      onSendMessage(input.trim());
      setInput('');
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setShowHistory(false);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
    setShowSuggestions(false);
  };

  const handleHistoryClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
    setShowHistory(false);
  };

  const clearHistory = () => {
    setRecentQueries([]);
    localStorage.removeItem('law-chat-history');
  };

  const handleInputFocus = () => {
    if (recentQueries.length > 0) {
      setShowHistory(true);
    }
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicks on suggestions
    setTimeout(() => {
      setShowHistory(false);
      setShowSuggestions(false);
    }, 300);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="relative" onClick={() => inputRef.current?.focus()}>
        <div className="relative flex items-center gap-2">
          <div className="flex-1 relative" onClick={() => inputRef.current?.focus()}>
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="flex h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled || isLoading}
              autoComplete="off"
              spellCheck="false"
              autoFocus
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                title="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!input.trim() || isLoading || disabled}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>

      {/* History Dropdown */}
      {showHistory && recentQueries.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <h4 className="text-sm font-medium">Recent queries</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="max-h-48">
              {recentQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(query)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{query}</span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {showSuggestions && !input && (
        <div className="mt-4 space-y-4 px-4 md:px-0" onClick={(e) => e.stopPropagation()}>
          {/* Quick Filters */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Quick topics:</span>
            </div>
            <div className="flex flex-wrap gap-2 pb-4">
              {QUICK_FILTERS.map((filter) => (
                <Badge
                  key={filter.label}
                  variant="outline"
                  className="cursor-pointer transition-colors hover:bg-primary/10 text-sm px-3 py-1.5"
                  onClick={() => handleSuggestionClick(filter.query)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
