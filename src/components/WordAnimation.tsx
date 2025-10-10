import { useState, useEffect } from 'react';

interface WordAnimationProps {
  words: string[];
  onComplete?: () => void;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  loop?: boolean;
}

export default function WordAnimation({
  words,
  onComplete,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  className = '',
  loop = false
}: WordAnimationProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!isComplete && words.length > 0) {
      const currentWord = words[currentWordIndex];

      if (!isDeleting && displayedText.length < currentWord.length) {
        // Typing phase
        timeout = setTimeout(() => {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else if (!isDeleting && displayedText.length === currentWord.length) {
        // Pause before deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      } else if (isDeleting && displayedText.length > 0) {
        // Deleting phase
        timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, deletingSpeed);
      } else if (isDeleting && displayedText.length === 0) {
        // Move to next word
        setIsDeleting(false);
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
        } else {
          // Last word completed
          if (loop) {
            // Reset for looping
            setCurrentWordIndex(0);
            setIsComplete(false);
          } else {
            setIsComplete(true);
            onComplete?.();
          }
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration, onComplete, isComplete, loop]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse text-[#10a37f] font-bold">|</span>
    </span>
  );
}
