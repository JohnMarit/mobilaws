import { useEffect, useState } from 'react';
import { Gavel } from 'lucide-react';
import { type Interruption } from '@/contexts/CourtSimulatorContext';

interface JudgeInterruptionProps {
  interruption: Interruption;
  isSpeaking: boolean;
}

export default function JudgeInterruption({ interruption, isSpeaking }: JudgeInterruptionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-6 py-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Gavel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Judge Intervenes</h3>
            <p className="text-amber-200 text-xs">
              Severity: {(interruption.severity * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-900 text-base font-medium leading-relaxed">
            "{interruption.question}"
          </p>
          <p className="text-gray-500 text-sm mt-3 italic">
            {interruption.reason}
          </p>
        </div>

        <div className="px-6 pb-4">
          {isSpeaking ? (
            <div className="flex items-center gap-2 text-amber-700">
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-amber-500 rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 8}px`,
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">Judge is speaking...</span>
            </div>
          ) : (
            <p className="text-sm text-green-600 font-medium">
              Resuming session...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
