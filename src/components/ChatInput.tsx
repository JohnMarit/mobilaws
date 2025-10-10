import { useState, useRef, useEffect } from 'react';
import { Send, History, X, Paperclip, Mic, Square, File as FileIcon, Image as ImageIcon, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sanitizeInput, validateInput, checkRateLimit } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onAudioCaptured?: (audio: Blob) => void;
  enableAttachments?: boolean;
  enableVoice?: boolean;
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
  disabled = false,
  onFilesSelected,
  onAudioCaptured,
  enableAttachments = true,
  enableVoice = true
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [audioNotes, setAudioNotes] = useState<{ blob: Blob; url: string }[]>([]);
  const { toast } = useToast();

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
    
    if (!input.trim() || isLoading || disabled) {
      return;
    }

    const trimmedInput = input.trim();

    // Security: Validate input length (prevent excessively long inputs)
    if (trimmedInput.length > 1000) {
      toast({
        title: 'Input too long',
        description: 'Please limit your query to 1000 characters.',
        variant: 'destructive',
      });
      return;
    }

    // Security: Validate input doesn't contain dangerous patterns
    if (!validateInput(trimmedInput)) {
      toast({
        title: 'Invalid input',
        description: 'Your input contains potentially unsafe content. Please rephrase your query.',
        variant: 'destructive',
      });
      return;
    }

    // Security: Rate limiting (10 messages per minute per user)
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : 'anonymous';
    const rateLimitResult = checkRateLimit(`chat-input-${userId}`, {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    });

    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime);
      const secondsRemaining = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      toast({
        title: 'Too many requests',
        description: `Please wait ${secondsRemaining} seconds before sending another message.`,
        variant: 'destructive',
      });
      return;
    }

    // Sanitize input before sending
    const sanitizedInput = sanitizeInput(trimmedInput);
    
    saveToHistory(sanitizedInput);
    onSendMessage(sanitizedInput);
    setInput('');
    setShowSuggestions(false);
    setShowHistory(false);
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

  const handleAttachClick = () => {
    if (!enableAttachments) return;
    fileInputRef.current?.click();
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAttachedFiles(prev => [...prev, ...files]);
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
        const url = URL.createObjectURL(blob);
        setAudioNotes(prev => [...prev, { blob, url }]);
        onAudioCaptured?.(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied or unavailable', error);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="relative" onClick={() => inputRef.current?.focus()}>
        <div className="relative flex items-center">
          <div className="flex-1 relative" onClick={() => inputRef.current?.focus()}>
            {/* Attachment chips - ChatGPT style */}
            {(attachedFiles.length > 0 || audioNotes.length > 0) && (
              <div className="absolute left-3 right-3 top-1 z-10 flex flex-wrap gap-1.5 pointer-events-auto">
                {attachedFiles.map((file, idx) => {
                  const isImage = file.type.startsWith('image/');
                  const displayName = file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name;
                  return (
                    <div key={`file-${idx}`} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 transition-colors">
                      {isImage ? <ImageIcon className="h-3 w-3 text-gray-500" /> : <FileIcon className="h-3 w-3 text-gray-500" />}
                      <span className="truncate max-w-[120px]">{displayName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
                        aria-label="Remove file"
                        title="Remove file"
                      >
                        <X className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  );
                })}
                {audioNotes.map((note, idx) => (
                  <div key={`audio-${idx}`} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 transition-colors">
                    <FileAudio className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Voice note</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        URL.revokeObjectURL(note.url);
                        setAudioNotes(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
                      aria-label="Remove audio"
                      title="Remove audio"
                    >
                      <X className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className={`flex h-12 w-full rounded-xl border border-gray-300 bg-white ${attachedFiles.length || audioNotes.length ? 'pt-7 pb-2' : 'py-3'} pl-24 pr-12 text-base text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={disabled || isLoading}
              autoComplete="off"
              spellCheck="false"
              autoFocus
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
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 text-gray-600 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100"
                title="Attach files"
              >
                <Paperclip className="h-5 w-5" />
              </button>
            )}

            {/* Voice Recording Button */}
            {enableVoice && (
              <button
                type="button"
                onClick={handleMicClick}
                className={`absolute left-12 top-1/2 -translate-y-1/2 p-2.5 transition-colors rounded-full hover:bg-gray-100 ${isRecording ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-800'}`}
                title={isRecording ? 'Stop recording' : 'Record voice'}
              >
                {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}

            {/* Clear Button */}
            {input && !isLoading && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                title="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Send Button */}
          <Button
            type="submit"
            size="lg"
            className="ml-2 h-12 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
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
                className="h-6 text-xs hover:text-gray-900"
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
