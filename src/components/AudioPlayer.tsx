import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderHtmlContent } from '@/lib/htmlContentFormatter';

interface AudioPlayerProps {
  text: string;
  enabled: boolean;
  className?: string;
  onHighlight?: (sentenceIndex: number) => void;
}

export default function AudioPlayer({ text, enabled, className, onHighlight }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const highlightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedSentenceIndexRef = useRef<number>(-1);
  const startTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);
  const sentencesRef = useRef<string[]>([]);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      // Split text into sentences for better highlighting
      // Handle multiple sentence endings and preserve punctuation
      const sentenceEndings = /([.!?]+\s*)/;
      const parts = text.split(sentenceEndings);
      const sentences: string[] = [];
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;
        
        // If it's a sentence ending, attach to previous sentence
        if (/^[.!?]+$/.test(part)) {
          if (sentences.length > 0) {
            sentences[sentences.length - 1] += part;
          }
        } else if (part.length > 0) {
          sentences.push(part);
        }
      }
      
      // If no sentences found (no punctuation), split by line breaks or use whole text
      if (sentences.length === 0) {
        sentences.push(text);
      }
      
      sentencesRef.current = sentences;
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
      
      // Resume highlighting with sentence-based calculation
      const sentences = sentencesRef.current;
      const totalSentences = sentences.length;
      
      highlightIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(1, elapsed / totalDurationRef.current);
        const sentenceIndex = Math.floor(progress * totalSentences);
        
        if (sentenceIndex < totalSentences && elapsed < totalDurationRef.current * 1.1) {
          setCurrentSentenceIndex(sentenceIndex);
          pausedSentenceIndexRef.current = sentenceIndex;
          if (onHighlight) {
            onHighlight(sentenceIndex);
          }
        } else {
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
            highlightIntervalRef.current = null;
          }
        }
      }, 100); // Update every 100ms for sentence highlighting
      
      return;
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;

    // Calculate estimated total duration using sentence-based approach
    // Average reading speed: ~150 words per minute at rate 1.0 = 2.5 words/second
    // At rate 0.85: ~127.5 words per minute = ~2.125 words per second
    const sentences = sentencesRef.current;
    const totalSentences = sentences.length;
    
    // Calculate total words for duration estimation
    const totalWords = text.split(/\s+/).length;
    const wordsPerSecond = 2.5 * utterance.rate;
    const estimatedTotalDuration = (totalWords / wordsPerSecond) * 1000; // milliseconds
    
    totalDurationRef.current = estimatedTotalDuration;
    startTimeRef.current = Date.now();
    pausedSentenceIndexRef.current = -1;

    // Use sentence-based highlighting with Apple Music-style sync
    // Update more frequently and use better timing calculation
    highlightIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / totalDurationRef.current);
      
      // Calculate sentence index based on progress
      // Use a slight lead to ensure highlighting stays ahead of speech
      const adjustedProgress = Math.min(1, progress * 1.08); // 8% ahead for better sync
      const sentenceIndex = Math.min(totalSentences - 1, Math.floor(adjustedProgress * totalSentences));
      
      if (sentenceIndex < totalSentences && elapsed < totalDurationRef.current * 1.1) {
        setCurrentSentenceIndex(sentenceIndex);
        pausedSentenceIndexRef.current = sentenceIndex;
        if (onHighlight) {
          onHighlight(sentenceIndex);
        }
      } else {
        if (highlightIntervalRef.current) {
          clearInterval(highlightIntervalRef.current);
          highlightIntervalRef.current = null;
        }
      }
    }, 80); // Update every 80ms for sentence-level highlighting (faster than word-level)

    utterance.onend = () => {
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
        highlightIntervalRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
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
    setCurrentSentenceIndex(-1);
    pausedSentenceIndexRef.current = -1;
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
 * Component to render text with sentence highlighting for read-along (Apple Music style)
 */
export function HighlightedText({ 
  text, 
  currentSentenceIndex, 
  className 
}: { 
  text: string; 
  currentSentenceIndex: number;
  className?: string;
}) {
  // Clean HTML content first - extract plain text for sentence splitting
  const cleanText = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    return tempDiv.textContent || tempDiv.innerText || text;
  }, [text]);
  
  // Render formatted HTML content
  const formattedContent = useMemo(() => renderHtmlContent(text), [text]);
  
  // Split clean text into sentences for highlighting
  const sentences = useMemo(() => {
    const sentenceEndings = /([.!?]+\s*)/;
    const parts = cleanText.split(sentenceEndings);
    const result: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // If it's a sentence ending, attach to previous sentence
      if (/^[.!?]+$/.test(part)) {
        if (result.length > 0) {
          result[result.length - 1] += part;
        }
      } else if (part.length > 0) {
        result.push(part);
      }
    }
    
    // If no sentences found, use whole text
    if (result.length === 0) {
      result.push(cleanText);
    }
    
    return result;
  }, [cleanText]);
  
  // For audio highlighting, we'll use a simpler approach - just render the formatted HTML
  // The highlighting will work at the sentence level through the audio player
  return (
    <div 
      className={cn('leading-relaxed prose-content', className)}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
}

