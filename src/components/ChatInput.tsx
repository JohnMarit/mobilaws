import { useState, useRef, useEffect } from 'react';
import { Send, History, X, Paperclip, Mic, Square, File as FileIcon, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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


const SUGGESTED_QUESTIONS = [
  'What are my rights if arrested?',
  'How do I start a business in South Sudan?',
  'Explain Constitution Article 16',
  'What does the Bill of Rights cover?',
  'How does citizenship work in South Sudan?',
  'What is the structure of the executive branch?',
  'What are my rights to education under the law?',
];

/** First-load suggestions only (full list kept for future “show more”) */
const SUGGESTED_QUESTIONS_INITIAL = SUGGESTED_QUESTIONS.slice(0, 3);

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
  const homeBothTools = isHome && enableAttachments && enableVoice;
  const homeSingleTool = isHome && hasLeftControls && !homeBothTools;
  const inputLeftPadClass = isHome
    ? homeBothTools
      ? 'pl-[56px] sm:pl-[72px]'
      : homeSingleTool
        ? 'pl-[52px] sm:pl-[58px]'
        : 'pl-5'
    : enableAttachments && enableVoice
      ? 'pl-[118px]'
      : hasLeftControls
        ? 'pl-[68px]'
        : 'pl-4';
  const chipsLeftClass = isHome
    ? homeBothTools
      ? 'left-[56px] sm:left-[72px]'
      : homeSingleTool
        ? 'left-[52px] sm:left-[58px]'
        : 'left-3'
    : enableAttachments && enableVoice
      ? 'left-[118px]'
      : hasLeftControls
        ? 'left-[68px]'
        : 'left-3';

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
    const maxHeight = isHome ? 220 : 160;
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

  const toolBtnBase = isHome
    ? 'group relative flex h-9 w-9 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200/90 bg-white text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-all duration-150 ease-out touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:border-slate-300/90 hover:bg-slate-50/90 hover:text-slate-700 sm:h-10 sm:w-10 sm:rounded-lg'
    : 'group relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 ease-out touch-manipulation active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const toolBtnAttach = isHome
    ? ''
    : 'border-slate-200/95 bg-white text-slate-600 shadow-sm hover:border-primary/45 hover:bg-gradient-to-br hover:from-primary/[0.09] hover:to-indigo-500/[0.05] hover:text-primary hover:shadow-md hover:-translate-y-px';

  const toolBtnMicIdle = isHome
    ? ''
    : 'border-slate-200/95 bg-white text-slate-600 shadow-sm hover:border-primary/45 hover:bg-gradient-to-br hover:from-primary/[0.09] hover:to-violet-500/[0.05] hover:text-primary hover:shadow-md hover:-translate-y-px';

  const toolBtnMicLive =
    'border-red-300/90 bg-gradient-to-br from-red-50 to-rose-100/90 text-red-600 shadow-md animate-mobilaws-recording hover:from-red-100 hover:to-rose-100';

  const attachBtnClass = isHome ? toolBtnBase : `${toolBtnBase} ${toolBtnAttach}`;
  const micBtnClass = isRecording
    ? `${toolBtnBase} ${toolBtnMicLive}`
    : `${toolBtnBase} ${isHome ? '' : toolBtnMicIdle}`;

  const barShellClass = isHome
    ? 'rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.08)] transition-all duration-200 focus-within:border-slate-300/95 focus-within:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_12px_32px_-16px_rgba(37,99,235,0.12)] focus-within:ring-1 focus-within:ring-primary/15 p-1.5 sm:p-2'
    : 'rounded-2xl border border-slate-200/90 bg-white/88 backdrop-blur-xl shadow-elevated p-1.5 sm:p-2 transition-all duration-300 focus-within:border-primary/35 focus-within:shadow-elevated-lg focus-within:ring-2 focus-within:ring-primary/12';

  return (
    <div className={`relative w-full max-w-4xl mx-auto ${isHome ? 'pl-4 md:pl-6' : ''}`}>
      <form
        onSubmit={handleSubmit}
        className={`relative min-w-0 ${barShellClass}`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="relative flex min-w-0 items-end gap-1.5 sm:gap-2.5">
          <div className="relative min-w-0 flex-1" onClick={() => inputRef.current?.focus()}>
            {attachedFiles.length > 0 && (
              <div className={`absolute ${chipsLeftClass} right-3 top-1.5 z-10 flex flex-wrap gap-1.5 pointer-events-auto`}>
                {attachedFiles.map((file, idx) => {
                  const isImage = file.type.startsWith('image/');
                  const displayName = file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name;
                  return (
                    <div
                      key={`file-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/90 px-2 py-1 text-xs text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      {isImage ? <ImageIcon className="h-3.5 w-3.5 text-primary/70" /> : <FileIcon className="h-3.5 w-3.5 text-primary/70" />}
                      <span className="max-w-[min(140px,40vw)] truncate font-medium">{displayName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="ml-0.5 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Remove file"
                        title="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
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
              rows={isHome ? 3 : 1}
              className={`flex w-full resize-none leading-6 ${
                isHome
                  ? `${
                      homeBothTools
                        ? 'min-h-[104px] sm:min-h-[108px]'
                        : homeSingleTool
                          ? 'min-h-[68px] sm:min-h-[72px]'
                          : 'min-h-[72px]'
                    } max-h-[220px] rounded-[0.875rem] border-0 bg-slate-50/60 py-2.5 sm:py-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.06]`
                  : 'min-h-[52px] max-h-[160px] rounded-xl border-0 bg-slate-50/70 py-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.06]'
              } ${attachedFiles.length ? 'pt-8 pb-2' : isHome ? 'py-2.5 sm:py-3' : 'py-3'} ${inputLeftPadClass} ${input && !isLoading ? 'pr-14' : 'pr-3 sm:pr-4'} text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-[background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto min-w-0`}
              disabled={disabled || isLoading}
              autoComplete="off"
              spellCheck="false"
              autoFocus
            />

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

            {hasLeftControls && (
              <div
                className={`absolute left-1 z-20 flex sm:left-1.5 ${
                  isHome
                    ? 'top-2 flex-col gap-1 sm:top-1/2 sm:-translate-y-1/2 sm:gap-1.5'
                    : 'bottom-2 flex-row gap-1.5'
                }`}
              >
                {enableAttachments && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAttachClick();
                    }}
                    className={attachBtnClass}
                    title="Attach PDF or image"
                    aria-label="Attach files"
                  >
                    {!isHome && (
                      <span className="pointer-events-none absolute inset-0 rounded-xl bg-primary/0 transition-colors duration-200 group-hover:bg-primary/[0.06] group-active:bg-primary/[0.1]" aria-hidden />
                    )}
                    <Paperclip
                      className={`relative z-10 transition-transform duration-200 ease-out group-active:scale-95 ${isHome ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px] group-hover:scale-110 group-hover:-rotate-6 group-active:rotate-0'}`}
                      strokeWidth={2}
                    />
                  </button>
                )}

                {enableVoice && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleMicClick();
                    }}
                    className={micBtnClass}
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                    aria-label={isRecording ? 'Stop voice input' : 'Voice input'}
                    aria-pressed={isRecording}
                  >
                    {!isRecording && !isHome && (
                      <span className="pointer-events-none absolute inset-0 rounded-xl bg-violet-500/0 transition-colors duration-200 group-hover:bg-violet-500/[0.05] group-active:bg-violet-500/[0.08]" aria-hidden />
                    )}
                    {isRecording ? (
                      <Square className="relative z-10 h-[18px] w-[18px] fill-current transition-transform duration-150 group-active:scale-90" />
                    ) : (
                      <Mic
                        className={`relative z-10 transition-transform duration-200 ease-out group-active:scale-95 ${isHome ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px] group-hover:scale-110'}`}
                        strokeWidth={2}
                      />
                    )}
                  </button>
                )}
              </div>
            )}

            {input && !isLoading && (
              <div className="absolute right-1.5 top-2.5 z-20 flex items-center sm:top-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInput('');
                  }}
                  className={`${toolBtnBase} border-transparent bg-slate-100/80 text-slate-500 shadow-none hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800 hover:shadow-sm`}
                  title="Clear input"
                  aria-label="Clear input"
                >
                  <X className="relative z-10 h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-active:scale-90" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className={
              isHome
                ? 'group mb-0.5 h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 rounded-xl border-0 bg-slate-900 px-0 text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-all duration-200 hover:bg-slate-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35 disabled:active:scale-100 sm:h-12 sm:w-12'
                : 'group mb-0.5 h-12 min-h-[48px] min-w-[48px] shrink-0 rounded-xl border-0 bg-brand-gradient px-5 text-primary-foreground shadow-md shadow-brand-sm transition-all duration-200 hover:opacity-[0.96] hover:shadow-lg active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100'
            }
            disabled={!input.trim() || isLoading || disabled}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin sm:h-6 sm:w-6" />
            ) : (
              <Send
                className={`transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isHome ? 'h-[18px] w-[18px]' : 'h-6 w-6'}`}
              />
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

      {showSuggestions && !input && (
        <div className="mt-4 space-y-2.5 px-0 md:px-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 pl-0.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <Sparkles className="h-3 w-3" strokeWidth={2} />
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Suggested questions
            </span>
          </div>
          <div className="flex flex-col gap-1.5 pb-1 sm:flex-row sm:flex-wrap sm:gap-2">
            {SUGGESTED_QUESTIONS_INITIAL.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleSuggestionClick(question)}
                className="touch-manipulation text-left text-[13px] font-medium leading-snug text-slate-800 transition-colors duration-150 active:scale-[0.99] rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)] hover:border-slate-300/90 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 focus-visible:ring-offset-2 sm:min-h-0 sm:max-w-[calc(50%-0.25rem)] sm:flex-1 sm:basis-[calc(50%-0.25rem)] sm:py-2.5"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
