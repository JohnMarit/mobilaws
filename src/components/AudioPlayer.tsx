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
      
      // Resume highlighting
      const words = text.split(/\s+/);
      const totalWords = words.length;
      const estimatedTimePerWord = (text.length / 0.85) / totalWords * 1000;
      let wordCount = pausedWordIndexRef.current + 1;
      
      highlightIntervalRef.current = setInterval(() => {
        if (wordCount < totalWords) {
          setCurrentWordIndex(wordCount);
          pausedWordIndexRef.current = wordCount;
          if (onHighlight) {
            onHighlight(wordCount);
          }
          wordCount++;
        } else {
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
            highlightIntervalRef.current = null;
          }
        }
      }, estimatedTimePerWord);
      
      return;
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;

    // Track word-by-word for highlighting using timing
    const words = text.split(/\s+/);
    const totalWords = words.length;
    const estimatedTimePerWord = (text.length / utterance.rate) / totalWords * 1000; // milliseconds per word

    let wordCount = 0;
    pausedWordIndexRef.current = -1;
    highlightIntervalRef.current = setInterval(() => {
      if (wordCount < totalWords) {
        setCurrentWordIndex(wordCount);
        pausedWordIndexRef.current = wordCount;
        if (onHighlight) {
          onHighlight(wordCount);
        }
        wordCount++;
      } else {
        if (highlightIntervalRef.current) {
          clearInterval(highlightIntervalRef.current);
          highlightIntervalRef.current = null;
        }
      }
    }, estimatedTimePerWord);

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

