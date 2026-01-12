import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, HelpCircle, ArrowLeft, Award, BookOpen, Sparkles, MessageSquare, Volume2 } from 'lucide-react';
import { Lesson, Module } from '@/lib/learningContent';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import AudioPlayer, { HighlightedText } from './AudioPlayer';
import { useSubscription } from '@/contexts/SubscriptionContext';
import QuizRequestDialog from './QuizRequestDialog';
import MessageTutorDialog from './MessageTutorDialog';
import { renderHtmlContent } from '@/lib/htmlContentFormatter';
import ConversationalLesson from './ConversationalLesson';
import CaseStudyLesson from './CaseStudyLesson';

interface LessonRunnerProps {
  open: boolean;
  onClose: () => void;
  module: Module;
  lesson: Lesson;
}

export default function LessonRunner({ open, onClose, module, lesson }: LessonRunnerProps) {
  const { user } = useAuth();
  const { startLesson, completeLesson, tier } = useLearning();
  const { userSubscription } = useSubscription();
  const [currentPhase, setCurrentPhase] = useState<'conversation' | 'case-study' | 'quiz' | 'content'>('conversation');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [showRetakeMessage, setShowRetakeMessage] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showQuizRequest, setShowQuizRequest] = useState(false);
  const [showMessageTutor, setShowMessageTutor] = useState(false);
  const [caseStudyScore, setCaseStudyScore] = useState<number | null>(null);
  
  // Refs for speech synthesis utterances
  const questionUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const explanationUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Determine if audio is enabled for this lesson - available for all tiers
  const audioEnabled = useMemo(() => {
    // Audio is available for all plans (free, basic, standard, premium) if lesson has audio
    return lesson.hasAudio === true;
  }, [lesson.hasAudio]);

  const totalSteps = 1 + lesson.quiz.length; // 1 content + n quizzes
  const currentStep = currentPhase === 'content' ? 0 : 1 + currentQuizIndex;
  const progressPercent = useMemo(
    () => Math.round((currentStep / totalSteps) * 100),
    [currentStep, totalSteps]
  );

  useEffect(() => {
    if (open) {
      // Require authentication to take lessons
      if (!user) {
        onClose();
        return;
      }
      startLesson(module.id, lesson.id);
      
      // Determine initial phase based on lesson type
      const lessonType = lesson.type || 'traditional';
      if (lessonType === 'conversational' && lesson.conversationalContent) {
        setCurrentPhase('conversation');
      } else if (lessonType === 'case-study' && lesson.caseStudies && lesson.caseStudies.length > 0) {
        setCurrentPhase('case-study');
      } else {
        setCurrentPhase('content');
      }
      
      setCurrentQuizIndex(0);
      setQuizAnswers([]);
      setSelectedOption(null);
      setShowExplanation(false);
      setCurrentSentenceIndex(-1);
      setShowRetakeMessage(false);
      setFinalScore(null);
      setCaseStudyScore(null);
      // Stop any playing audio when lesson changes
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      questionUtteranceRef.current = null;
      explanationUtteranceRef.current = null;
    }
  }, [open, module.id, lesson.id, startLesson, user, onClose, lesson.type, lesson.conversationalContent, lesson.caseStudies]);

  const handleConversationComplete = () => {
    // After conversation, move to case studies if available
    if (lesson.caseStudies && lesson.caseStudies.length > 0) {
      setCurrentPhase('case-study');
    } else if (lesson.quiz && lesson.quiz.length > 0) {
      setCurrentPhase('quiz');
      setCurrentQuizIndex(0);
    } else {
      // No quiz or case studies, complete the lesson
      completeLesson(module.id, lesson.id, 100);
      onClose();
    }
  };

  const handleCaseStudyComplete = (score: number) => {
    setCaseStudyScore(score);
    // After case studies, move to quiz if available
    if (lesson.quiz && lesson.quiz.length > 0) {
      setCurrentPhase('quiz');
      setCurrentQuizIndex(0);
    } else {
      // No quiz, complete the lesson with case study score
      if (score >= 75) {
        completeLesson(module.id, lesson.id, score);
        onClose();
      } else {
        setShowRetakeMessage(true);
      }
    }
  };

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
        // Score is below 75% - show retake message
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

  // Function to play quiz question audio
  const playQuestionAudio = (questionText: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any existing question audio
    if (questionUtteranceRef.current) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    questionUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Function to play explanation audio
  const playExplanationAudio = (explanationText: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any existing explanation audio
    if (explanationUtteranceRef.current) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(explanationText);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    explanationUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Auto-play quiz question when quiz index changes
  useEffect(() => {
    if (currentPhase === 'quiz' && currentQuizIndex < lesson.quiz.length && !lesson.quiz[currentQuizIndex].locked) {
      const currentQuiz = lesson.quiz[currentQuizIndex];
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        playQuestionAudio(currentQuiz.question);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, currentQuizIndex, lesson.quiz]);

  // Auto-play explanation when it's shown
  useEffect(() => {
    if (showExplanation && currentPhase === 'quiz' && currentQuizIndex < lesson.quiz.length) {
      const currentQuiz = lesson.quiz[currentQuizIndex];
      if (!currentQuiz.locked) {
        // Small delay to ensure UI is ready
        const timer = setTimeout(() => {
          playExplanationAudio(currentQuiz.explanation);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [showExplanation, currentPhase, currentQuizIndex, lesson.quiz]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      questionUtteranceRef.current = null;
      explanationUtteranceRef.current = null;
    };
  }, []);

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
          <div className="flex items-start gap-2 mt-2">
            <CardDescription className="text-xs sm:text-sm md:text-base leading-relaxed break-words flex-1">{currentQuiz.question}</CardDescription>
            {!isQuizLocked && 'speechSynthesis' in window && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => playQuestionAudio(currentQuiz.question)}
                className="flex-shrink-0 h-8 w-8 p-0"
                title="Replay question"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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
                  <div className="font-semibold mb-1 text-sm sm:text-base break-words flex items-center gap-2">
                    <span>{isCorrect ? 'Correct!' : 'Not quite.'}</span>
                    {!isQuizLocked && 'speechSynthesis' in window && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playExplanationAudio(currentQuiz.explanation)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                        title="Replay explanation"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
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
                    You scored {finalScore}%, but you need at least 75% to complete this lesson. Please review the content and retake the quiz.
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

  // Panel layout - keeps header and bottom nav visible
  const renderLessonPanel = (content: React.ReactNode) => {
    if (!open) return null;
    
    return (
      <>
        <div className="fixed top-[60px] bottom-[60px] left-0 right-0 z-40 bg-white dark:bg-slate-900 flex flex-col">
          {/* Lesson Header - Fixed */}
          <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button 
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
                  >
                    <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">{lesson.title}</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{module.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    <Award className="h-3 w-3" />
                    {lesson.xpReward} XP
                  </Badge>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Step {currentStep + 1} of {totalSteps}</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
              {content}
            </div>
          </div>
        </div>

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
  };

  // Render new interactive lesson types
  if (currentPhase === 'conversation' && lesson.conversationalContent) {
    return renderLessonPanel(
      <ConversationalLesson
        lesson={lesson.conversationalContent}
        onComplete={handleConversationComplete}
        difficulty={lesson.difficulty || 'medium'}
        showScript={lesson.difficulty !== 'hard'}
      />
    );
  }

  if (currentPhase === 'case-study' && lesson.caseStudies && lesson.caseStudies.length > 0) {
    return renderLessonPanel(
      <CaseStudyLesson
        caseStudies={lesson.caseStudies}
        onComplete={handleCaseStudyComplete}
      />
    );
  }

  return renderLessonPanel(
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Badge variant="outline" className="capitalize text-xs">
          {module.requiredTier}
        </Badge>
        {lesson.difficulty && (
          <Badge variant="outline" className={`text-xs ${
            lesson.difficulty === 'simple' ? 'border-green-500 text-green-700' :
            lesson.difficulty === 'medium' ? 'border-yellow-500 text-yellow-700' :
            'border-red-500 text-red-700'
          }`}>
            {lesson.difficulty.charAt(0).toUpperCase() + lesson.difficulty.slice(1)}
          </Badge>
        )}
      </div>
      {currentPhase === 'content' ? renderContent() : renderQuiz()}
    </div>
  );
}
