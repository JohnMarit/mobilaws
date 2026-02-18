import { useEffect, useState } from 'react';
import { Gavel, Volume2, RotateCcw } from 'lucide-react';
import { type Interruption } from '@/contexts/CourtSimulatorContext';
import { Button } from '@/components/ui/button';

interface JudgeInterruptionProps {
  interruption: Interruption;
  isSpeaking: boolean;
  onRepeat?: () => void;
  onContinue?: () => void;
}

export default function JudgeInterruption({
  interruption,
  isSpeaking,
  onRepeat,
  onContinue,
}: JudgeInterruptionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-900 px-5 py-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Gavel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Judge Intervenes</h3>
            <p className="text-amber-200 text-xs">
              Severity: {(interruption.severity * 100).toFixed(0)}%
            </p>
          </div>
          {isSpeaking && (
            <div className="ml-auto flex gap-0.5 items-end">
              {[8, 14, 10, 16, 11].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-amber-300 rounded-full animate-bounce"
                  style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Judge statement (written text) */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-start gap-2">
            <Volume2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-900 text-sm font-semibold leading-relaxed italic">
              "{interruption.question}"
            </p>
          </div>
          {interruption.reason && (
            <p className="text-gray-400 text-xs mt-2 leading-relaxed pl-6">
              {interruption.reason}
            </p>
          )}
        </div>

        {/* Status + action controls */}
        <div className="px-5 pb-5 pt-3 space-y-3">
          {isSpeaking ? (
            <p className="text-amber-700 text-sm font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Judge is speaking — please listen...
            </p>
          ) : (
            <p className="text-green-700 text-sm font-medium">
              ✓ Question delivered. Read above, replay, or continue.
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button" size="sm" variant="outline"
              onClick={onRepeat} disabled={isSpeaking}
              className="flex-1"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Replay audio
            </Button>
            <Button
              type="button" size="sm"
              onClick={onContinue} disabled={isSpeaking}
              className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
            >
              Continue testimony
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
