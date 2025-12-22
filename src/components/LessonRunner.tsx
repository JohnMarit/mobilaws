import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, HelpCircle, ArrowLeft, Award, BookOpen } from 'lucide-react';
import { Lesson, Module } from '@/lib/learningContent';
import { useLearning } from '@/contexts/LearningContext';
import AudioPlayer, { HighlightedText } from './AudioPlayer';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface LessonRunnerProps {
  open: boolean;
  onClose: () => void;
  module: Module;
  lesson: Lesson;
}

export default function LessonRunner({ open, onClose, module, lesson }: LessonRunnerProps) {
  const { startLesson, completeLesson, tier } = useLearning();
  const { userSubscription } = useSubscription();
  const [currentPhase, setCurrentPhase] = useState<'content' | 'quiz'>('content');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  // Determine if audio is enabled for this lesson
  const audioEnabled = useMemo(() => {
    if (!lesson.hasAudio) return false;
    // Premium users get all lessons with audio
    if (tier === 'premium') return true;
    // Standard users get 30% (already marked in lesson.hasAudio)
    if (tier === 'standard') return lesson.hasAudio;
    return false;
  }, [lesson.hasAudio, tier]);

  const totalSteps = 1 + lesson.quiz.length; // 1 content + n quizzes
  const currentStep = currentPhase === 'content' ? 0 : 1 + currentQuizIndex;
  const progressPercent = useMemo(
    () => Math.round((currentStep / totalSteps) * 100),
    [currentStep, totalSteps]
  );

  useEffect(() => {
    if (open) {
      startLesson(module.id, lesson.id);
      setCurrentPhase('content');
      setCurrentQuizIndex(0);
      setQuizAnswers([]);
      setSelectedOption(null);
      setShowExplanation(false);
      setCurrentWordIndex(-1);
      // Stop any playing audio when lesson changes
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [open, module.id, lesson.id, startLesson]);

  const handleStartQuiz = () => {
    setCurrentPhase('quiz');
    setCurrentQuizIndex(0);
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;
    const currentQuiz = lesson.quiz[currentQuizIndex];
    const isCorrect = selectedOption === currentQuiz.correctAnswer;
    setQuizAnswers([...quizAnswers, isCorrect]);
    setShowExplanation(true);
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex < lesson.quiz.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Complete lesson
      const correctAnswers = quizAnswers.filter(a => a).length + (selectedOption === lesson.quiz[currentQuizIndex].correctAnswer ? 1 : 0);
      const score = Math.round((correctAnswers / lesson.quiz.length) * 100);
      completeLesson(module.id, lesson.id, score);
      onClose();
    }
  };

  const renderContent = () => {
    return (
      <Card className="touch-manipulation">
        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="leading-tight">{lesson.title}</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {audioEnabled ? 'Read or listen to the lesson content' : 'Read the lesson content before taking the quiz'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
          {audioEnabled && (
            <div className="flex justify-start pb-2 border-b">
              <AudioPlayer
                text={lesson.content}
                enabled={audioEnabled}
                onHighlight={setCurrentWordIndex}
              />
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            {audioEnabled ? (
              <HighlightedText
                text={lesson.content}
                currentWordIndex={currentWordIndex}
                className="text-sm sm:text-base"
              />
            ) : (
              <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed">{lesson.content}</div>
            )}
          </div>
          <div className="flex justify-end pt-2 sm:pt-4">
            <Button onClick={handleStartQuiz} className="gap-2 h-10 sm:h-11 text-base">
              Take Quiz
              <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuiz = () => {
    if (currentQuizIndex >= lesson.quiz.length) return null;
    
    const currentQuiz = lesson.quiz[currentQuizIndex];
    const isCorrect = showExplanation && selectedOption === currentQuiz.correctAnswer;

    return (
      <Card className="touch-manipulation">
        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Question {currentQuizIndex + 1} of {lesson.quiz.length}</CardTitle>
          <CardDescription className="text-sm sm:text-base leading-relaxed">{currentQuiz.question}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
          <div className="space-y-2">
            {currentQuiz.options.map((option, idx) => (
              <Button
                key={idx}
                variant={selectedOption === idx ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base touch-manipulation"
                onClick={() => !showExplanation && setSelectedOption(idx)}
                disabled={showExplanation}
              >
                <span className="block leading-relaxed">{option}</span>
              </Button>
            ))}
          </div>

          {showExplanation && (
            <Alert variant={isCorrect ? 'default' : 'destructive'} className="touch-manipulation">
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1 text-sm sm:text-base">
                    {isCorrect ? 'Correct!' : 'Not quite.'}
                  </div>
                  <AlertDescription className="text-sm sm:text-base leading-relaxed">{currentQuiz.explanation}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-2 gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={onClose} className="h-9 sm:h-10 text-sm sm:text-base touch-manipulation">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Exit
            </Button>
            {!showExplanation ? (
              <Button
                onClick={handleQuizSubmit}
                disabled={selectedOption === null}
                className="h-9 sm:h-10 text-sm sm:text-base touch-manipulation"
              >
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuiz} className="h-9 sm:h-10 text-sm sm:text-base touch-manipulation">
                <span className="hidden xs:inline">{currentQuizIndex < lesson.quiz.length - 1 ? 'Next Question' : 'Complete Lesson'}</span>
                <span className="xs:hidden">{currentQuizIndex < lesson.quiz.length - 1 ? 'Next' : 'Complete'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl pr-8">
            <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="truncate">{module.title}</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">{module.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground flex-wrap">
            <Badge variant="outline" className="capitalize text-xs sm:text-sm">
              {module.requiredTier}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
              <Award className="h-3 w-3 sm:h-4 sm:w-4" />
              {lesson.xpReward} XP
            </Badge>
            <span className="ml-auto text-xs sm:text-sm">
              Step {currentStep + 1}/{totalSteps}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 sm:h-2.5" />
          {currentPhase === 'content' ? renderContent() : renderQuiz()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
