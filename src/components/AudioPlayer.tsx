import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  text: string;
  enabled: boolean;
  className?: string;
  onHighlight?: (wordIndex: number) => void;
}

export default function AudioPlayer({ text, enabled, className, onHighlight }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const highlightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedWordIndexRef = useRef<number>(-1);
  const startTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      wordsRef.current = text.split(/\s+/);
    }
  }, [text]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    if (!isSupported || !enabled) return;

    if (isPaused && utteranceRef.current) {
      // Resume - continue highlighting from where we paused
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      
      // Resume highlighting with time-based calculation
      const words = text.split(/\s+/);
      const totalWords = words.length;
      const elapsedTime = Date.now() - startTimeRef.current;
      
      highlightIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(1, elapsed / totalDurationRef.current);
        const wordIndex = Math.floor(progress * totalWords);
        
        if (wordIndex < totalWords) {
          setCurrentWordIndex(wordIndex);
          pausedWordIndexRef.current = wordIndex;
          if (onHighlight) {
            onHighlight(wordIndex);
          }
        } else {
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
            highlightIntervalRef.current = null;
          }
        }
      }, 50); // Update every 50ms for smooth highlighting
      
      return;
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;

    // Calculate estimated total duration more accurately
    // Average reading speed: ~150 words per minute at rate 1.0 = 2.5 words/second
    // At rate 0.85: ~127.5 words per minute = ~2.125 words per second
    // But also account for character count (longer words take more time)
    const words = text.split(/\s+/);
    const totalWords = words.length;
    const avgWordLength = text.length / totalWords;
    // Adjust: longer words = slower, shorter words = faster
    // Base: 2.5 words/sec at rate 1.0, adjusted for rate and word length
    const baseWordsPerSecond = 2.5 * utterance.rate;
    const lengthAdjustment = Math.max(0.7, Math.min(1.3, 5 / avgWordLength)); // Adjust for word length
    const wordsPerSecond = baseWordsPerSecond * lengthAdjustment;
    const estimatedTotalDuration = (totalWords / wordsPerSecond) * 1000; // milliseconds
    
    totalDurationRef.current = estimatedTotalDuration;
    startTimeRef.current = Date.now();
    pausedWordIndexRef.current = -1;

    // Use time-based highlighting with frequent updates for smooth sync
    highlightIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / totalDurationRef.current);
      // Use a slight offset to account for speech delay (speech starts slightly after we start timing)
      const adjustedProgress = Math.min(1, progress * 1.05); // 5% ahead to compensate for speech delay
      const wordIndex = Math.min(totalWords - 1, Math.floor(adjustedProgress * totalWords));
      
      if (wordIndex < totalWords && elapsed < totalDurationRef.current * 1.1) {
        setCurrentWordIndex(wordIndex);
        pausedWordIndexRef.current = wordIndex;
        if (onHighlight) {
          onHighlight(wordIndex);
        }
      } else {
        if (highlightIntervalRef.current) {
          clearInterval(highlightIntervalRef.current);
          highlightIntervalRef.current = null;
        }
      }
    }, 30); // Update every 30ms for very responsive highlighting

    utterance.onend = () => {
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
    };


    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
      // Keep track of elapsed time for resume
      const elapsed = Date.now() - startTimeRef.current;
      startTimeRef.current = Date.now() - elapsed; // Adjust start time to account for pause
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    pausedWordIndexRef.current = -1;
    startTimeRef.current = 0;
    totalDurationRef.current = 0;
    utteranceRef.current = null;
    if (highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
  };

  if (!enabled) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className={cn('text-xs text-muted-foreground', className)}>
        Audio playback not supported in your browser
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={isPlaying ? handlePause : handlePlay}
        className="gap-2"
      >
        {isPlaying ? (
          <>
            <Pause className="h-4 w-4" />
            Pause
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Listen
          </>
        )}
      </Button>
      {isPlaying && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="text-xs"
        >
          Stop
        </Button>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Volume2 className="h-3 w-3" />
        <span>Read-along</span>
      </div>
    </div>
  );
}

/**
 * Component to render text with word highlighting for read-along
 */
export function HighlightedText({ 
  text, 
  currentWordIndex, 
  className 
}: { 
  text: string; 
  currentWordIndex: number;
  className?: string;
}) {
  const words = text.split(/\s+/);
  
  return (
    <div className={cn('whitespace-pre-line leading-relaxed', className)}>
      {words.map((word, index) => {
        const isHighlighted = index === currentWordIndex;
        
        return (
          <span
            key={index}
            className={cn(
              'transition-colors duration-150',
              isHighlighted && 'bg-yellow-200 dark:bg-yellow-900 rounded px-1 font-medium'
            )}
          >
            {word}{' '}
          </span>
        );
      })}
    </div>
  );
}

