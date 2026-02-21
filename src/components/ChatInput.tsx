import { useState, useRef, useEffect } from 'react';
import { Send, History, X, Paperclip, Mic, Square, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { validateInput, checkRateLimit } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onAudioCaptured?: (audio: Blob) => void;
  enableAttachments?: boolean;
  enableVoice?: boolean;
  variant?: 'home' | 'chat';
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
  enableVoice = true,
  variant = 'chat'
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const confirmedTextRef = useRef<string>('');
  const { toast } = useToast();
  const isHome = variant === 'home';
  const hasLeftControls = enableAttachments || enableVoice;
  const inputLeftPadClass =
    enableAttachments && enableVoice ? 'pl-[116px]' : hasLeftControls ? 'pl-[64px]' : 'pl-4';
  const chipsLeftClass =
    enableAttachments && enableVoice ? 'left-[116px]' : hasLeftControls ? 'left-[64px]' : 'left-3';

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

  // Auto-resize textarea to fit content (with a cap)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = isHome ? 240 : 160;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [input, attachedFiles.length, isHome]);

  // Save query to history
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...recentQueries.filter(q => q !== query)].slice(0, 10);
    setRecentQueries(newHistory);
    localStorage.setItem('law-chat-history', JSON.stringify(newHistory));
  };

  const handleSubmit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    
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
    let userId = 'anonymous';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user?.id || 'anonymous';
      }
    } catch (error) {
      console.warn('Failed to parse user from localStorage:', error);
      userId = 'anonymous';
    }
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

    // Don't sanitize input - React will handle escaping when displaying
    // We only validate for dangerous patterns (already done above)
    // Sanitization is only needed when using dangerouslySetInnerHTML
    
    // Get files to send with message
    const filesToSend = attachedFiles.length > 0 ? [...attachedFiles] : undefined;
    
    saveToHistory(trimmedInput);
    onSendMessage(trimmedInput, filesToSend);
    setInput('');
    setAttachedFiles([]); // Clear attached files after sending
    setShowSuggestions(false);
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };

  const handleMicClick = async () => {
    if (!enableVoice) return;
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      // Check for Speech Recognition API support
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: 'Voice input not supported',
          description: 'Your browser does not support speech recognition.',
          variant: 'destructive',
        });
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        // Store the current input as the base text
        confirmedTextRef.current = input;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update confirmed text with final transcripts
        if (finalTranscript) {
          confirmedTextRef.current += finalTranscript;
        }

        // Update the input with confirmed text + interim transcript in real-time
        const displayText = confirmedTextRef.current + interimTranscript;
        setInput(displayText);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          // User didn't speak, just stop
          stopRecording();
        } else if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone access denied',
            description: 'Please allow microphone access to use voice input.',
            variant: 'destructive',
          });
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
        // Ensure final state is set
        setInput(confirmedTextRef.current);
        confirmedTextRef.current = '';
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition failed:', error);
      setIsRecording(false);
      toast({
        title: 'Voice input failed',
        description: 'Unable to start voice recognition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="relative" onClick={() => inputRef.current?.focus()}>
        <div className="relative flex items-center">
          <div className="flex-1 relative" onClick={() => inputRef.current?.focus()}>
            {/* Attachment chips - ChatGPT style */}
            {attachedFiles.length > 0 && (
              <div className={`absolute ${chipsLeftClass} right-3 top-1 z-10 flex flex-wrap gap-1.5 pointer-events-auto`}>
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
              </div>
            )}
            <textarea
              ref={inputRef}
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              rows={isHome ? 4 : 1}
              className={`flex w-full rounded-xl border border-gray-300 bg-white resize-none leading-6 ${
                isHome ? 'min-h-[96px] max-h-[240px]' : 'min-h-[48px] max-h-[160px]'
              } ${attachedFiles.length ? 'pt-7 pb-2' : isHome ? 'py-4' : 'py-3'} ${inputLeftPadClass} pr-[64px] text-base text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto`}
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

            {/* Left controls (Attach / Voice) - always vertically centered */}
            {hasLeftControls && (
              <div className="absolute left-2 inset-y-0 z-20 flex items-center gap-1.5">
                {enableAttachments && (
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    className="h-12 w-12 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100"
                    title="Attach files"
                    aria-label="Attach files"
                  >
                    <Paperclip className="h-6 w-6" />
                  </button>
                )}

                {enableVoice && (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 ${isRecording ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-800'}`}
                    title={isRecording ? 'Stop voice input' : 'Voice input'}
                    aria-label={isRecording ? 'Stop voice input' : 'Voice input'}
                  >
                    {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                )}
              </div>
            )}

            {/* Clear Button - positioned inside the input field */}
            {input && !isLoading && (
              <div className="absolute right-2 inset-y-0 z-20 flex items-center">
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="h-12 w-12 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100"
                  title="Clear input"
                  aria-label="Clear input"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Send Button */}
          <Button
            type="submit"
            size="lg"
            className="ml-3 h-14 px-7 rounded-xl bg-blue-500 hover:bg-blue-600 text-white self-center"
            disabled={!input.trim() || isLoading || disabled}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
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
