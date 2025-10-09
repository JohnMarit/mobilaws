import TypewriterAnimation from './TypewriterAnimation';

interface AnimatedCounselIntroductionProps {
  counselName: string;
  onComplete: () => void;
}

export default function AnimatedCounselIntroduction({
  counselName,
  onComplete
}: AnimatedCounselIntroductionProps) {
  return (
    <div className="text-center">
      <div className="text-lg text-gray-600 mb-4">
        <TypewriterAnimation
          text={`I am Counsel ${counselName}, let's address your legal matter.`}
          onComplete={onComplete}
          typingSpeed={80}
          deletingSpeed={40}
          pauseDuration={1500}
          className="font-medium"
          loop={true}
        />
      </div>
    </div>
  );
}
