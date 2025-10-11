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
    <div className="text-center px-4">
      <div className="text-5xl md:text-6xl lg:text-7xl text-gray-700 mb-8 leading-tight">
        <WordAnimation
          words={words}
          onComplete={onComplete}
          typingSpeed={80}
          deletingSpeed={40}
          pauseDuration={2500}
          className="font-semibold block"
          loop={true}
        />
      </div>
    </div>
  );
}
