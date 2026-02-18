import { type EmotionSnapshot } from '@/contexts/CourtSimulatorContext';

interface EmotionIndicatorProps {
  emotion: EmotionSnapshot | null;
  compact?: boolean;
}

const EMOTION_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  nervousness: { color: 'text-amber-600', label: 'Nervous', bg: 'bg-amber-50' },
  nervous: { color: 'text-amber-600', label: 'Nervous', bg: 'bg-amber-50' },
  stress: { color: 'text-orange-600', label: 'Stressed', bg: 'bg-orange-50' },
  distressed: { color: 'text-orange-600', label: 'Distressed', bg: 'bg-orange-50' },
  anger: { color: 'text-red-600', label: 'Agitated', bg: 'bg-red-50' },
  defensive: { color: 'text-red-500', label: 'Defensive', bg: 'bg-red-50' },
  confidence: { color: 'text-green-600', label: 'Confident', bg: 'bg-green-50' },
  confident: { color: 'text-green-600', label: 'Confident', bg: 'bg-green-50' },
  composed: { color: 'text-emerald-600', label: 'Composed', bg: 'bg-emerald-50' },
  hesitation: { color: 'text-purple-600', label: 'Hesitant', bg: 'bg-purple-50' },
  uncertain: { color: 'text-purple-500', label: 'Uncertain', bg: 'bg-purple-50' },
  evasive: { color: 'text-rose-600', label: 'Evasive', bg: 'bg-rose-50' },
  neutral: { color: 'text-gray-600', label: 'Neutral', bg: 'bg-gray-50' },
};

export default function EmotionIndicator({ emotion, compact = false }: EmotionIndicatorProps) {
  if (!emotion) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <span>Detecting...</span>
      </div>
    );
  }

  const primary = emotion.primary.toLowerCase();
  const config = EMOTION_CONFIG[primary] || EMOTION_CONFIG.neutral;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
        {config.label}
      </div>
    );
  }

  const entries: Array<{ key: string; value: number }> = [
    { key: 'confidence', value: emotion.confidence },
    { key: 'nervousness', value: emotion.nervousness },
    { key: 'stress', value: emotion.stress },
    { key: 'hesitation', value: emotion.hesitation },
    { key: 'anger', value: emotion.anger },
  ].filter(e => e.value > 0.1);

  return (
    <div className="space-y-1.5">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
        <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} animate-pulse`} />
        {config.label}
      </div>
      <div className="space-y-1">
        {entries.map(({ key, value }) => {
          const c = EMOTION_CONFIG[key] || EMOTION_CONFIG.neutral;
          return (
            <div key={key} className="flex items-center gap-2 text-[10px]">
              <span className="w-16 text-gray-500 capitalize">{c.label}</span>
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                <div
                  className={`h-full rounded-full ${c.color.replace('text-', 'bg-')}`}
                  style={{ width: `${value * 100}%` }}
                />
              </div>
              <span className="text-gray-400 w-7 text-right">{Math.round(value * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
