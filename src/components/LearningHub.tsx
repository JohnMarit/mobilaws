import { useMemo, useState, useEffect } from 'react';
import { Flame, Star, Target, CheckCircle2, Lock, BookOpen, ChevronRight, Trophy, Volume2, Plus, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScroll, faGlobe, faScaleBalanced, faLandmark, faBook, faHeadphones, faStar, faHeart, faPlus, faFire, faTrophy, faBolt } from '@fortawesome/free-solid-svg-icons';
import { useLearning } from '@/contexts/LearningContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import LessonRunner from './LessonRunner';
import Leaderboard from './Leaderboard';
import ExamPage from './ExamPage';
import { Lesson, Module } from '@/lib/learningContent';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { getApiUrl } from '@/lib/api';

interface LearningHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LearningHub({ open, onOpenChange }: LearningHubProps) {
  const { user } = useAuth();
  const { tier, modules, progress, getModuleProgress, getLessonProgress, dailyLessonsRemaining, canTakeLesson } = useLearning();
  const [activeLesson, setActiveLesson] = useState<{ module: Module; lesson: Lesson } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRequestingLessons, setIsRequestingLessons] = useState<string | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

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

  const toggleFavorite = (moduleId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(moduleId)) {
        newFavorites.delete(moduleId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(moduleId);
        toast.success('Added to favorites');
      }
      // Save to localStorage
      localStorage.setItem('module-favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const requestMoreLessons = async (moduleId: string, moduleName: string) => {
    if (!user) {
      toast.error('Please login to request more lessons');
      return;
    }

    setIsRequestingLessons(moduleId);
    try {
      const modProg = getModuleProgress(moduleId);
      const completedLessons = modProg ? Object.keys(modProg.lessonsCompleted) : [];

      const response = await fetch(getApiUrl('ai-lessons/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          moduleId,
          moduleName,
          completedLessons,
          tier,
          numberOfLessons: 5
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          // Request limit reached
          const errorData = await response.json();
          toast.error(errorData.message || 'Request limit reached', {
            duration: 5000,
          });
          return;
        }
        
        const errorText = await response.text();
        let errorMessage = 'Failed to generate lessons';
        
        if (response.status === 404) {
          errorMessage = 'AI lesson generation is not available. Please contact support or try again later.';
          console.error('API endpoint not found. Backend may need to be redeployed.');
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      toast.success(`Generated ${data.lessons.length} new lessons! (${data.requestCount}/${data.maxRequests} requests used)`);
      
      // Reload modules to show new lessons (trigger context refresh)
      // The LearningContext will automatically fetch user lessons on next render
      window.location.reload();
    } catch (error) {
      console.error('Error requesting lessons:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate lessons. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsRequestingLessons(null);
    }
  };

  // Load favorites from localStorage on mount
  useState(() => {
    const saved = localStorage.getItem('module-favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  });

  // Filter and sort modules
  const filteredModules = useMemo(() => {
    let filtered = modules;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.icon === selectedCategory);
    }

    // Sort: favorites first, then by completion
    return filtered.sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      
      const aStatus = moduleStatus(a);
      const bStatus = moduleStatus(b);
      return bStatus.percent - aStatus.percent;
    });
  }, [modules, selectedCategory, favorites]);

  const categories = useMemo(() => {
    const cats = new Set(modules.map(m => m.icon));
    return Array.from(cats);
  }, [modules]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] sm:max-h-[95vh] overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2 pb-3 sm:pb-4 pr-8">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
            <span className="leading-tight">Learning Paths</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base md:text-lg">
            Structured, tier-aware lessons with quizzes, streaks, and XP—tailored for South Sudan law.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
            <TabsTrigger value="lessons" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden sm:inline">Lessons</span>
              <span className="sm:hidden">📚</span>
            </TabsTrigger>
            <TabsTrigger value="certifications" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden sm:inline">Certifications</span>
              <span className="sm:hidden">🎓</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">🏆</span>
            </TabsTrigger>
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
                  <h3 className="text-lg sm:text-xl font-semibold">Courses</h3>
                  <div className="flex items-center gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[140px] sm:w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            <FontAwesomeIcon icon={
                              cat === 'faScroll' ? faScroll :
                              cat === 'faGlobe' ? faGlobe :
                              cat === 'faScaleBalanced' ? faScaleBalanced :
                              cat === 'faLandmark' ? faLandmark : faBook
                            } className="mr-2" />
                            {cat.replace('fa', '')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="text-sm sm:text-base">{tier.toUpperCase()}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredModules.map((module) => {
                    const { percent, done } = moduleStatus(module);
                    const isExpanded = expandedLessons.has(module.id);
                    const visibleLessons = module.lessons.filter((_, lessonIndex) => isExpanded || lessonIndex < 5);
                    return (
                      <Card key={module.id} className={`h-full flex flex-col touch-manipulation transition-all duration-300 ${favorites.has(module.id) ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}>
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
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleFavorite(module.id)}
                              >
                                <FontAwesomeIcon 
                                  icon={faHeart} 
                                  className={`text-lg ${favorites.has(module.id) ? 'text-red-500' : 'text-gray-300'}`}
                                />
                              </Button>
                              {done ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" /> : null}
                            </div>
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base">{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-3 sm:gap-4 p-3 sm:p-6 pt-0">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {visibleLessons.map((lesson) => {
                              const lp = getLessonProgress(module.id, lesson.id);
                              const isLocked = lesson.locked;
                              const isCompleted = lp?.completed === true && !isLocked;

                              return (
                                <Card
                                  key={lesson.id}
                                  className={`h-full flex flex-col justify-between border shadow-sm hover:shadow-md transition-all duration-300 ${isLocked ? 'opacity-70' : ''}`}
                                >
                                  <CardContent className="flex-1 flex flex-col gap-3 p-3 sm:p-4">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm sm:text-base font-semibold leading-tight line-clamp-2">{lesson.title}</span>
                                          {isCompleted && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                              Done
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                                          <span className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faBolt} className="h-3 w-3 text-yellow-500" />
                                            {lesson.xpReward} XP
                                          </span>
                                          <span>• {lesson.quiz.length} Q</span>
                                          {lesson.hasAudio && (
                                            <span className="flex items-center gap-1 text-blue-600">
                                              <FontAwesomeIcon icon={faHeadphones} className="h-3 w-3" />
                                              Audio
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {isLocked && (
                                        <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                                          <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                                          <span className="hidden sm:inline">Locked</span>
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize text-[11px] sm:text-xs">
                                          {lesson.tier || 'basic'}
                                        </Badge>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={isCompleted ? 'outline' : 'default'}
                                        className="h-9 sm:h-10 px-3 sm:px-4 text-sm flex-shrink-0 min-w-[70px] sm:min-w-[90px]"
                                        onClick={() => handleStartLesson(module, lesson)}
                                        disabled={isLocked}
                                      >
                                        <span className="hidden sm:inline">{isCompleted ? 'Review' : 'Start'}</span>
                                        <span className="sm:hidden">{isCompleted ? '✓' : '▶'}</span>
                                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 sm:ml-1 hidden sm:inline" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                          
                          {/* Expand/Collapse Button */}
                          {module.lessons.length > 5 && (
                            <Button
                              variant="ghost"
                              className="w-full mt-1 text-sm"
                              onClick={() => {
                                setExpandedLessons(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(module.id)) {
                                    newSet.delete(module.id);
                                  } else {
                                    newSet.add(module.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              {expandedLessons.has(module.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-2" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                  Show All {module.lessons.length} Lessons
                                </>
                              )}
                            </Button>
                          )}
                          
                          {/* Request More Lessons Button */}
                          {done && (
                            <Button
                              variant="outline"
                              className="w-full mt-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
                              onClick={() => requestMoreLessons(module.id, module.title)}
                              disabled={isRequestingLessons === module.id}
                            >
                              {isRequestingLessons === module.id ? (
                                <>
                                  <div className="animate-spin mr-2">⏳</div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                  Request 5 More Lessons
                                </>
                              )}
                            </Button>
                          )}
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


