import { useMemo, useState } from 'react';
import { Flame, Star, Target, CheckCircle2, Lock, BookOpen, ChevronRight, Trophy, Volume2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScroll, faGlobe, faScaleBalanced, faLandmark, faBook, faHeadphones, faStar } from '@fortawesome/free-solid-svg-icons';
import { useLearning } from '@/contexts/LearningContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LessonRunner from './LessonRunner';
import Leaderboard from './Leaderboard';
import ExamPage from './ExamPage';
import { Lesson, Module } from '@/lib/learningContent';

interface LearningHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LearningHub({ open, onOpenChange }: LearningHubProps) {
  const { tier, modules, progress, getModuleProgress, getLessonProgress, dailyLessonsRemaining, canTakeLesson } = useLearning();
  const [activeLesson, setActiveLesson] = useState<{ module: Module; lesson: Lesson } | null>(null);

  const xpPercent = useMemo(() => {
    const remainder = progress.xp % 120;
    return Math.min(100, Math.round((remainder / 120) * 100));
  }, [progress.xp]);

  const streakColor = progress.streak >= 7 ? 'text-orange-500' : 'text-orange-400';

  const handleStartLesson = (module: Module, lesson: Lesson) => {
    if (!canTakeLesson && tier === 'free') {
      alert('You have reached your daily lesson limit. Come back tomorrow or upgrade for unlimited access!');
      return;
    }
    setActiveLesson({ module, lesson });
  };

  const closeLesson = () => {
    setActiveLesson(null);
  };

  const moduleStatus = (module: Module) => {
    const modProg = getModuleProgress(module.id);
    const totalLessons = module.lessons.length;
    const completedLessons = modProg ? Object.keys(modProg.lessonsCompleted).length : 0;
    const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    const done = percent === 100;
    return { percent, done };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Learning Paths
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg">
            Structured, tier-aware lessons with quizzes, streaks, and XP—tailored for South Sudan law.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card className="touch-manipulation">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardDescription className="text-sm sm:text-base">Level</CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl">Level {progress.level}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      {progress.xp} XP total
                    </div>
                    <Progress value={xpPercent} className="mt-2 h-2 sm:h-2.5" />
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Next level at +{120 - (progress.xp % 120)} XP</div>
                  </CardContent>
                </Card>

                <Card className="touch-manipulation">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardDescription className="text-sm sm:text-base">Streak</CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                      <Flame className={`h-5 w-5 sm:h-6 sm:w-6 ${streakColor}`} />
                      {progress.streak} days
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-sm sm:text-base text-muted-foreground">
                      Stay active daily to keep your streak.
                    </div>
                  </CardContent>
                </Card>

                <Card className="touch-manipulation">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardDescription className="text-sm sm:text-base">
                      {tier === 'free' ? 'Daily Lessons' : 'Daily Goal'}
                    </CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                      {tier === 'free' ? (
                        <>
                          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                          {dailyLessonsRemaining}/2
                        </>
                      ) : (
                        <>
                          <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                          {progress.dailyGoal} XP
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-sm sm:text-base text-muted-foreground">
                      {tier === 'free'
                        ? dailyLessonsRemaining > 0
                          ? `${dailyLessonsRemaining} lesson${dailyLessonsRemaining === 1 ? '' : 's'} left today`
                          : (
                            <span className="flex items-center gap-1">
                              Come back tomorrow!
                              <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-yellow-500" />
                            </span>
                          )
                        : 'Complete lessons to hit your goal.'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Modules */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold">Modules</h3>
                  <Badge variant="secondary" className="text-sm sm:text-base">{tier.toUpperCase()} Plan</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {modules.map((module) => {
                    const { percent, done } = moduleStatus(module);
                    return (
                      <Card key={module.id} className="h-full flex flex-col touch-manipulation">
                        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                          <CardTitle className="text-base sm:text-lg flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <FontAwesomeIcon
                                icon={
                                  module.icon === 'faScroll' ? faScroll :
                                    module.icon === 'faGlobe' ? faGlobe :
                                      module.icon === 'faScaleBalanced' ? faScaleBalanced :
                                        module.icon === 'faLandmark' ? faLandmark :
                                          faBook
                                }
                                className="text-xl sm:text-2xl text-primary"
                              />
                              <span className="leading-tight">{module.title}</span>
                            </div>
                            {done ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" /> : null}
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base">{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-2.5 sm:gap-3 p-3 sm:p-6 pt-0">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                            <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                              {module.requiredTier}
                            </Badge>
                            <span>{module.lessons.length} lessons</span>
                          </div>
                          <div>
                            <Progress value={percent} className="h-2 sm:h-2.5" />
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">{percent}% complete</div>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            {module.lessons.map((lesson) => {
                              const lp = getLessonProgress(module.id, lesson.id);
                              const isLocked = lesson.locked;
                              const isCompleted = lp?.completed || false;
                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between rounded-md border px-3 sm:px-4 py-2.5 sm:py-3 bg-white touch-manipulation"
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="text-sm sm:text-base font-medium flex items-center gap-1.5 sm:gap-2 truncate">
                                      <span className="truncate">{lesson.title}</span>
                                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                      {lesson.hasAudio && (
                                        <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                      <span>{lesson.xpReward} XP • {lesson.quiz.length} Q</span>
                                      {lesson.hasAudio && (
                                        <span className="ml-1 text-blue-500 flex items-center gap-1">
                                          <FontAwesomeIcon icon={faHeadphones} className="h-3 w-3" />
                                          Listen
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isLocked ? (
                                    <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm flex-shrink-0">
                                      <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:inline">{lesson.tier.toUpperCase()}</span>
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 sm:h-9 px-3 sm:px-4 text-sm flex-shrink-0"
                                      onClick={() => handleStartLesson(module, lesson)}
                                    >
                                      <span className="hidden sm:inline">{isCompleted ? 'Review' : 'Start'}</span>
                                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 sm:ml-1" />
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="certifications">
            <ExamPage />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </DialogContent>

      {activeLesson && (
        <LessonRunner
          module={activeLesson.module}
          lesson={activeLesson.lesson}
          onClose={closeLesson}
          open={Boolean(activeLesson)}
        />
      )}
    </Dialog>
  );
}


