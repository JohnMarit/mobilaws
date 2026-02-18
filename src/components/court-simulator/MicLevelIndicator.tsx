import { useMemo } from 'react';

interface MicLevelIndicatorProps {
  level: number;
  className?: string;
}

export default function MicLevelIndicator({ level, className = '' }: MicLevelIndicatorProps) {
  const bars = 12;

  const activeBars = useMemo(() => Math.round(level * bars), [level]);

  return (
    <div className={`flex items-end gap-0.5 h-6 ${className}`} aria-label={`Microphone level: ${Math.round(level * 100)}%`}>
      {Array.from({ length: bars }).map((_, i) => {
        const isActive = i < activeBars;
        const height = 4 + (i / bars) * 20;
        const color = i < bars * 0.5
          ? 'bg-green-400'
          : i < bars * 0.8
            ? 'bg-yellow-400'
            : 'bg-red-400';

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${isActive ? color : 'bg-gray-200'}`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}
