import { useState, useEffect } from 'react';

interface TypewriterAnimationProps {
  text: string;
  onComplete?: () => void;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  loop?: boolean;
}

export default function TypewriterAnimation({
  text,
  onComplete,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
  className = '',
  loop = false
}: TypewriterAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!isComplete) {
      if (!isDeleting && displayedText.length < text.length) {
        // Typing phase
        timeout = setTimeout(() => {
          setDisplayedText(text.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else if (!isDeleting && displayedText.length === text.length) {
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
        // Animation complete
        if (loop) {
          // Reset for looping
          setIsDeleting(false);
          setIsComplete(false);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, text, typingSpeed, deletingSpeed, pauseDuration, onComplete, isComplete]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse text-[#10a37f] font-bold">|</span>
    </span>
  );
}
