import { useState, useRef, useEffect } from 'react';
import { Search, X, Send, Paperclip, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnimatedSearchPlaceholder from './AnimatedSearchPlaceholder';

interface AnimatedSearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onAudioCaptured?: (audio: Blob) => void;
  enableAttachments?: boolean;
  enableVoice?: boolean;
}

const SEARCH_KEYWORDS = [
  'Civil rights',
  'Citizenship',
  'Human rights',
  'Bill of Rights',
  'Freedom of speech',
  'Constitutional law',
  'Legal rights',
  'Government powers'
];

export default function AnimatedSearchInput({
  query,
  onQueryChange,
  onSearch,
  isLoading = false,
  onFilesSelected,
  onAudioCaptured,
  enableAttachments = true,
  enableVoice = true
}: AnimatedSearchInputProps) {
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleInputFocus = () => {
    setShowPlaceholder(false);
    // Position cursor at the end of the text when focusing (like Google)
    setTimeout(() => {
      if (inputRef.current) {
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
        // Ensure the input is focused and cursor is visible
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleInputBlur = () => {
    if (!query.trim()) {
      setShowPlaceholder(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Escape key to clear search
    if (e.key === 'Escape') {
      clearQuery();
    }
    // Handle Ctrl+A to select all text
    if (e.key === 'a' && e.ctrlKey) {
      e.preventDefault();
      inputRef.current?.select();
    }
  };

  const handleInputClick = () => {
    // Select all text when clicking in the search bar (like Google)
    if (inputRef.current && inputRef.current.value) {
      inputRef.current.select();
    }
  };

  const clearQuery = () => {
    onQueryChange('');
    setShowPlaceholder(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleAttachClick = () => {
    if (!enableAttachments) return;
    fileInputRef.current?.click();
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    onFilesSelected?.(files);
    // Reset value to allow selecting the same file again
    e.currentTarget.value = '';
  };

  const stopRecording = () => {
    setIsRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    try {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
  };

  const handleMicClick = async () => {
    if (!enableVoice) return;
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        onAudioCaptured?.(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied or unavailable', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div 
        className="relative flex items-center"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="absolute left-3 sm:left-4 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
        
        {/* Animated Placeholder Overlay */}
        {showPlaceholder && !query && (
          <div className="absolute left-10 sm:left-12 right-24 sm:right-28 h-12 sm:h-14 flex items-center pointer-events-none z-5">
            <AnimatedSearchPlaceholder
              keywords={SEARCH_KEYWORDS}
              typingSpeed={80}
              deletingSpeed={40}
              pauseDuration={1200}
              className="text-gray-500 text-base sm:text-lg"
            />
          </div>
        )}
        
        <Input
          ref={inputRef}
          type="text"
          placeholder=""
          title="Search by keyword (e.g., 'freedom', 'citizenship') or article number (e.g., 'Article 23', '25')"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          className="pl-10 sm:pl-12 pr-20 sm:pr-24 h-12 sm:h-14 text-base sm:text-lg rounded-xl border-2 border-border focus:border-primary transition-colors bg-white text-gray-900 focus:outline-none focus:ring-0 search-input-mobile search-compact"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Hidden File Input */}
        {enableAttachments && (
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            multiple
            className="hidden"
            onChange={handleFilesChange}
          />
        )}

        {/* Attachment Button */}
        {enableAttachments && (
          <button
            type="button"
            onClick={handleAttachClick}
            className="absolute right-14 sm:right-16 p-1.5 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        )}

        {/* Voice Recording Button */}
        {enableVoice && (
          <button
            type="button"
            onClick={handleMicClick}
            className={`absolute right-8 sm:right-10 p-1.5 transition-colors rounded-full hover:bg-gray-100 ${isRecording ? 'text-red-600 hover:text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
            title={isRecording ? 'Stop recording' : 'Record voice'}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 grid place-items-center"
          disabled={isLoading || !query.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>

        {/* Clear Button - only show when there's text and not loading */}
        {query && !isLoading && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-12 sm:right-14 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            title="Clear search"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
