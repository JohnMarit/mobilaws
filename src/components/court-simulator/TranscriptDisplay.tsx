import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type TranscriptEntry, type Interruption } from '@/contexts/CourtSimulatorContext';

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  interruptions: Interruption[];
  className?: string;
}

export default function TranscriptDisplay({ entries, interruptions, className = '' }: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, interruptions]);

  const allEvents = buildTimeline(entries, interruptions);

  if (allEvents.length === 0) {
    return (
      <div className={`flex items-center justify-center text-sm text-gray-400 italic p-4 ${className}`}>
        Begin speaking to see your live transcript...
      </div>
    );
  }

  return (
    <ScrollArea className={`h-full ${className}`}>
      <div ref={scrollRef} className="p-3 space-y-2 text-sm">
        {allEvents.map((event, i) => {
          if (event.type === 'speech') {
            return (
              <div key={`s-${i}`} className="leading-relaxed text-gray-800">
                <span className={event.isFinal ? '' : 'text-gray-400 italic'}>
                  {event.text}
                </span>
              </div>
            );
          }

          return (
            <div key={`j-${i}`} className="my-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-amber-700 font-semibold text-xs">JUDGE</span>
                <span className="text-[10px] text-amber-500">
                  Severity: {(event.severity * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-amber-900 font-medium text-sm">"{event.question}"</p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

interface TimelineEvent {
  type: 'speech' | 'interruption';
  text: string;
  isFinal: boolean;
  question: string;
  severity: number;
  timestamp: number;
}

function buildTimeline(
  entries: TranscriptEntry[],
  interruptions: Interruption[]
): TimelineEvent[] {
  const finalEntries = entries.filter(e => e.isFinal);

  const events: TimelineEvent[] = [
    ...finalEntries.map(e => ({
      type: 'speech' as const,
      text: e.text,
      isFinal: e.isFinal,
      question: '',
      severity: 0,
      timestamp: e.timestamp,
    })),
    ...interruptions.map(intr => ({
      type: 'interruption' as const,
      text: '',
      isFinal: true,
      question: intr.question,
      severity: intr.severity,
      timestamp: intr.timestamp,
    })),
  ];

  events.sort((a, b) => a.timestamp - b.timestamp);

  const lastInterim = entries.filter(e => !e.isFinal).pop();
  if (lastInterim) {
    events.push({
      type: 'speech',
      text: lastInterim.text,
      isFinal: false,
      question: '',
      severity: 0,
      timestamp: lastInterim.timestamp,
    });
  }

  return events;
}
