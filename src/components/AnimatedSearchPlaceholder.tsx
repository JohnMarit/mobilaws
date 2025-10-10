import { useState, useEffect } from 'react';

interface AnimatedSearchPlaceholderProps {
  keywords: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export default function AnimatedSearchPlaceholder({
  keywords,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 1500,
  className = ''
}: AnimatedSearchPlaceholderProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentKeywordIndex, setCurrentKeywordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (keywords.length === 0) return;

    const currentKeyword = keywords[currentKeywordIndex];

    if (!isDeleting && displayedText.length < currentKeyword.length) {
      // Typing phase
      timeout = setTimeout(() => {
        setDisplayedText(currentKeyword.slice(0, displayedText.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayedText.length === currentKeyword.length) {
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
      // Move to next keyword
      setIsDeleting(false);
      setCurrentKeywordIndex((prevIndex) => (prevIndex + 1) % keywords.length);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentKeywordIndex, keywords, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse text-[#10a37f] font-bold">|</span>
    </span>
  );
}
