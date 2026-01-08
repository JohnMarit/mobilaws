import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, HelpCircle, ArrowLeft, Award, BookOpen, Sparkles, MessageSquare } from 'lucide-react';
import { Lesson, Module } from '@/lib/learningContent';
import { useLearning } from '@/contexts/LearningContext';
import AudioPlayer, { HighlightedText } from './AudioPlayer';
import { useSubscription } from '@/contexts/SubscriptionContext';
import QuizRequestDialog from './QuizRequestDialog';
import MessageTutorDialog from './MessageTutorDialog';
import { renderHtmlContent } from '@/lib/htmlContentFormatter';

interface LessonRunnerProps {
  open: boolean;
  onClose: () => void;
  module: Module;
  lesson: Lesson;
}

export default function LessonRunner({ open, onClose, module, lesson }: LessonRunnerProps) {
  const { startLesson, completeLesson, deductXp, tier } = useLearning();
  const { userSubscription } = useSubscription();
  const [currentPhase, setCurrentPhase] = useState<'content' | 'quiz'>('content');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [showRetakeMessage, setShowRetakeMessage] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showQuizRequest, setShowQuizRequest] = useState(false);
  const [showMessageTutor, setShowMessageTutor] = useState(false);
  
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
      setCurrentSentenceIndex(-1);
      setShowRetakeMessage(false);
      setFinalScore(null);
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
      // Calculate final score
      const correctAnswers = quizAnswers.filter(a => a).length + (selectedOption === lesson.quiz[currentQuizIndex].correctAnswer ? 1 : 0);
      const score = Math.round((correctAnswers / lesson.quiz.length) * 100);
      setFinalScore(score);
      
      // Check if score meets minimum requirement (75%)
      if (score >= 75) {
        // Score is sufficient - complete lesson
        completeLesson(module.id, lesson.id, score);
        onClose();
      } else {
        // Score is below 75% - deduct 20 points and show retake message
        deductXp(20);
        setShowRetakeMessage(true);
      }
    }
  };

  const handleRetakeQuiz = () => {
    // Reset quiz state to retake
    setCurrentQuizIndex(0);
    setQuizAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setShowRetakeMessage(false);
    setFinalScore(null);
  };

  const renderContent = () => {
    return (
      <Card className="touch-manipulation overflow-hidden w-full">
        <CardHeader className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl font-semibold break-words">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="leading-tight break-words flex-1">{lesson.title}</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2 break-words">
            {audioEnabled ? 'Read or listen to the lesson content' : 'Read the lesson content before taking the quiz'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 overflow-x-hidden">
          {audioEnabled && (
            <div className="flex justify-start pb-3 sm:pb-4 border-b">
              <AudioPlayer
                text={lesson.content}
                enabled={audioEnabled}
                onHighlight={setCurrentSentenceIndex}
              />
            </div>
          )}
          <div className="prose prose-sm sm:prose-base max-w-none overflow-x-hidden overflow-y-auto min-h-[100px] w-full px-2 sm:px-0">
            {audioEnabled ? (
              <HighlightedText
                text={lesson.content}
                currentSentenceIndex={currentSentenceIndex}
                className="text-sm sm:text-base w-full block"
              />
            ) : (
              <div 
                className="text-sm sm:text-base leading-relaxed prose-content w-full block"
                style={{ 
                  maxWidth: '100%', 
                  width: '100%',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: renderHtmlContent(lesson.content) }}
              />
            )}
          </div>
          
          {/* Action Buttons Section - Better organized */}
          <div className="pt-4 sm:pt-5 border-t space-y-3 sm:space-y-4">
            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowQuizRequest(true)}
                className="gap-2 flex-1 sm:flex-initial text-xs sm:text-sm"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Request More Quizzes</span>
                <span className="sm:hidden">More Quizzes</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMessageTutor(true)}
                className="gap-2 flex-1 sm:flex-initial text-xs sm:text-sm"
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Ask a Question</span>
                <span className="sm:hidden">Ask Question</span>
              </Button>
            </div>
            
            {/* Primary Action - Take Quiz Button */}
            <Button 
              onClick={handleStartQuiz} 
              className="w-full gap-2 h-11 sm:h-12 text-base sm:text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
              size="lg"
            >
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
              Take Quiz
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
    const isQuizLocked = currentQuiz.locked || false;

    return (
      <Card className="touch-manipulation overflow-hidden w-full">
        <CardHeader className="px-4 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 break-words">
            Question {currentQuizIndex + 1} of {lesson.quiz.length}
            {isQuizLocked && <Badge variant="secondary" className="text-xs flex-shrink-0">🔒 Locked</Badge>}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm md:text-base leading-relaxed break-words">{currentQuiz.question}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 pt-0 overflow-x-hidden w-full">
          {isQuizLocked ? (
            <Alert className="touch-manipulation">
              <HelpCircle className="h-5 w-5 flex-shrink-0" />
              <AlertDescription className="text-sm sm:text-base break-words">
                This quiz is restricted to higher subscription tiers. Upgrade your plan to access this content.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 w-full">
              {currentQuiz.options.map((option, idx) => (
                <Button
                  key={idx}
                  variant={selectedOption === idx ? 'default' : 'outline'}
                  className="w-full justify-start text-left h-auto py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base touch-manipulation break-words whitespace-normal"
                  onClick={() => !showExplanation && setSelectedOption(idx)}
                  disabled={showExplanation}
                >
                  <span className="block leading-relaxed break-words">{option}</span>
                </Button>
              ))}
            </div>
          )}

          {showExplanation && (
            <Alert variant={isCorrect ? 'default' : 'destructive'} className="touch-manipulation w-full">
              <div className="flex items-start gap-2 w-full">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0 break-words">
                  <div className="font-semibold mb-1 text-sm sm:text-base break-words">
                    {isCorrect ? 'Correct!' : 'Not quite.'}
                  </div>
                  <AlertDescription className="text-sm sm:text-base leading-relaxed break-words">{currentQuiz.explanation}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {showRetakeMessage && finalScore !== null && (
            <Alert variant="destructive" className="touch-manipulation w-full">
              <div className="flex items-start gap-2 w-full">
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 break-words">
                  <div className="font-semibold mb-1 text-sm sm:text-base break-words">
                    Score: {finalScore}% - Retake Required
                  </div>
                  <AlertDescription className="text-sm sm:text-base leading-relaxed break-words">
                    You scored {finalScore}%, but you need at least 75% to complete this lesson. 20 points have been deducted from your total. Please review the content and retake the quiz.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-2 gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="outline" size="sm" onClick={onClose} className="h-9 sm:h-10 text-sm sm:text-base touch-manipulation">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Exit
            </Button>
            {isQuizLocked ? (
              <Button onClick={handleNextQuiz} className="h-9 sm:h-10 text-sm sm:text-base touch-manipulation">
                Skip Quiz
              </Button>
            ) : showRetakeMessage ? (
              <Button onClick={handleRetakeQuiz} className="h-9 sm:h-10 text-sm sm:text-base touch-manipulation">
                Retake Quiz
              </Button>
            ) : !showExplanation ? (
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
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[90vh] sm:max-h-[95vh] overflow-y-auto p-4 sm:p-6 overflow-x-hidden">
        <DialogHeader className="space-y-2 pb-3 sm:pb-4 pr-8">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl break-words">
            <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <span className="leading-tight break-words flex-1">{module.title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base leading-relaxed break-words">{module.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 w-full" style={{ maxWidth: '100%' }}>
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

      <QuizRequestDialog
        open={showQuizRequest}
        onOpenChange={setShowQuizRequest}
        moduleId={module.id}
        moduleName={module.title}
        lessonId={lesson.id}
        lessonName={lesson.title}
      />

      <MessageTutorDialog
        open={showMessageTutor}
        onOpenChange={setShowMessageTutor}
        moduleId={module.id}
        moduleName={module.title}
        lessonId={lesson.id}
        lessonName={lesson.title}
      />
    </>
  );
}
