import WordAnimation from './WordAnimation';

interface AnimatedCounselIntroductionProps {
  counselName: string;
  onComplete: () => void;
}

export default function AnimatedCounselIntroduction({
  counselName,
  onComplete
}: AnimatedCounselIntroductionProps) {
  const words = [
    `I am Counsel ${counselName}`,
    "let's address your legal matter",
    "how can I help you today?",
    "what legal question do you have?"
  ];

  return (
    <div className="text-center">
      <div className="text-lg text-gray-600 mb-4">
        <WordAnimation
          words={words}
          onComplete={onComplete}
          typingSpeed={120}
          deletingSpeed={60}
          pauseDuration={2500}
          className="font-medium"
          loop={true}
        />
      </div>
    </div>
  );
}
