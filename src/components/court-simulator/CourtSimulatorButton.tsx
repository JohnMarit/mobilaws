import { Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourtSimulator } from '@/contexts/CourtSimulatorContext';

interface CourtSimulatorButtonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export default function CourtSimulatorButton({ variant = 'default', className = '' }: CourtSimulatorButtonProps) {
  const { openSimulator } = useCourtSimulator();

  if (variant === 'compact') {
    return (
      <Button
        onClick={openSimulator}
        variant="ghost"
        size="sm"
        className={`h-8 px-2 text-gray-600 hover:bg-primary/10 hover:text-primary ${className}`}
        title="Court Simulator"
      >
        <Landmark className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={openSimulator}
      className={`bg-brand-gradient hover:opacity-90 text-white px-4 py-2 rounded-lg shadow-md font-medium ${className}`}
    >
      <Landmark className="h-4 w-4 mr-2 shrink-0" />
      <span className="truncate">Court Simulation</span>
    </Button>
  );
}
