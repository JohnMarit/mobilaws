import { useMemo } from 'react';
import { Timer } from 'lucide-react';

interface SessionTimerProps {
  elapsedSeconds: number;
  maxDuration: number;
  minDuration: number;
}

export default function SessionTimer({ elapsedSeconds, maxDuration, minDuration }: SessionTimerProps) {
  const remaining = Math.max(0, maxDuration - elapsedSeconds);
  const progress = Math.min(1, elapsedSeconds / maxDuration);
  const pastMinimum = elapsedSeconds >= minDuration;

  const timeStr = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [remaining]);

  const urgencyColor = remaining <= 10
    ? 'text-red-500'
    : remaining <= 30
      ? 'text-orange-500'
      : 'text-gray-700';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex items-center gap-1.5 font-mono text-lg font-semibold ${urgencyColor}`}>
        <Timer className="h-4 w-4" />
        <span>{timeStr}</span>
      </div>

      <div className="w-full max-w-[160px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: remaining <= 10 ? '#ef4444' : remaining <= 30 ? '#f97316' : '#3b82f6',
          }}
        />
      </div>

      {pastMinimum && (
        <span className="text-[10px] text-green-600 font-medium">Min. time reached</span>
      )}
    </div>
  );
}
