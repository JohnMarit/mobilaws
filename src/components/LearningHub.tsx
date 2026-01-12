import { useMemo, useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faScroll, faGlobe, faScaleBalanced, faLandmark, faBook, faHeadphones, 
  faStar, faHeart, faPlus, faFire, faTrophy, faBolt, faCertificate, faRoute,
  faCircleCheck, faLock, faChevronRight, faChevronDown, faChevronUp,
  faTrashCan, faRotateLeft, faXmark, faAward, faPlay, faWandMagicSparkles,
  faSpinner, faBookOpen, faGraduationCap, faListCheck, faArrowRight, faBullseye,
  faHouse
} from '@fortawesome/free-solid-svg-icons';
import { useLearning } from '@/contexts/LearningContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import LessonRunner from './LessonRunner';
import Leaderboard from './Leaderboard';
import ExamPage from './ExamPage';
import LoginModal from './LoginModal';
import { Lesson, Module } from '@/lib/learningContent';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { getApiUrl } from '@/lib/api';

// Category name mapping - maps icon names to readable category names
const categoryMap: Record<string, string> = {
  'faScroll': 'Constitution',
  'faGlobe': 'International Law',
  'faScaleBalanced': 'Criminal Law',
  'faLandmark': 'Public Law',
  'faBook': 'General'
};

// Get category name from icon
const getCategoryName = (icon: string): string => {
  return categoryMap[icon] || icon.replace('fa', '');
};

// Format numbers with K, M suffixes (e.g., 2000 -> "2K", 1500000 -> "1.5M")
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    const millions = num / 1000000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const thousands = num / 1000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return num.toString();
};

interface LearningHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullscreen?: boolean;
}

export default function LearningHub({ open, onOpenChange, fullscreen = false }: LearningHubProps) {
  const { user } = useAuth();
  const { tier, modules, progress, getModuleProgress, getLessonProgress, dailyLessonsRemaining, canTakeLesson, reloadModules } = useLearning();
  const { showLoginModal, setShowLoginModal } = usePromptLimit();
  const [activeLesson, setActiveLesson] = useState<{ module: Module; lesson: Lesson } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRequestingLessons, setIsRequestingLessons] = useState<string | null>(null);
  const [isDeletingLessons, setIsDeletingLessons] = useState<string | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'certifications' | 'leaderboard'>('lessons');
  const [activeNav, setActiveNav] = useState<'featured' | 'learning' | 'certification' | 'leaderboard'>('featured');
  const [selectedCourse, setSelectedCourse] = useState<Module | null>(null);
  const [showGenerateLessonsPopup, setShowGenerateLessonsPopup] = useState(false);
  const [moduleForGeneration, setModuleForGeneration] = useState<{ id: string; name: string } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'simple' | 'medium' | 'hard'>('medium');

  const xpPercent = useMemo(() => {
    const remainder = progress.xp % 120;
    return Math.min(100, Math.round((remainder / 120) * 100));
  }, [progress.xp]);

  const streakColor = progress.streak >= 7 ? 'text-blue-600' : 'text-blue-500';

  const handleStartLesson = (module: Module, lesson: Lesson) => {
    // Require authentication to take lessons
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!canTakeLesson && tier === 'free') {
      alert('You have reached your daily lesson limit. Come back tomorrow or upgrade for unlimited access!');
      return;
    }
    // Close the course panel when starting a lesson
    setSelectedCourse(null);
    setActiveLesson({ module, lesson });
  };

  // Track previous activeLesson to detect when it closes
  const prevActiveLessonRef = useRef<{ module: Module; lesson: Lesson } | null>(null);
  
  useEffect(() => {
    prevActiveLessonRef.current = activeLesson;
  }, [activeLesson]);

  // Check if user completed exactly 5 lessons when lesson closes
  useEffect(() => {
    if (!user) return;

    // When activeLesson becomes null (lesson closed), check if 5 lessons completed
    if (prevActiveLessonRef.current && !activeLesson) {
      const closedModule = prevActiveLessonRef.current.module;
      const modProg = getModuleProgress(closedModule.id);
      
      if (modProg) {
        const completedCount = Object.keys(modProg.lessonsCompleted || {}).length;
        // Check if user just completed their 5th lesson
        if (completedCount === 5 && !showGenerateLessonsPopup && moduleForGeneration?.id !== closedModule.id) {
          setModuleForGeneration({ id: closedModule.id, name: closedModule.title });
          // Small delay to ensure lesson closes first
          setTimeout(() => {
            setShowGenerateLessonsPopup(true);
          }, 500);
        }
      }
    }
  }, [activeLesson, user, getModuleProgress, showGenerateLessonsPopup, moduleForGeneration]);

  const handleCourseClick = (module: Module) => {
    setSelectedCourse(module);
  };

  const handleGenerateMoreLessons = async () => {
    if (!moduleForGeneration || !user) return;
    await requestMoreLessons(moduleForGeneration.id, moduleForGeneration.name, selectedDifficulty);
    setShowGenerateLessonsPopup(false);
    setModuleForGeneration(null);
    setSelectedDifficulty('medium'); // Reset to default
  };

  const closeLesson = () => {
    // If we have a selected course, reopen it when lesson closes
    if (activeLesson) {
      const module = modules.find(m => m.id === activeLesson.module.id);
      if (module) {
        setSelectedCourse(module);
      }
    }
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

  const requestMoreLessons = async (moduleId: string, moduleName: string, difficulty: 'simple' | 'medium' | 'hard' = 'medium') => {
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
          difficulty,
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
      
      // Refresh modules to show new lessons without kicking the user back home
      await reloadModules();
    } catch (error) {
      console.error('Error requesting lessons:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate lessons. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsRequestingLessons(null);
    }
  };

  const deleteGeneratedLessons = async (moduleId: string, moduleName: string, deleteAll: boolean = false) => {
    if (!user) {
      toast.error('Please login to delete lessons');
      return;
    }

    // Confirm deletion
    const confirmMessage = deleteAll
      ? `Are you sure you want to delete ALL generated lessons for "${moduleName}"?\n\n` +
        `This will:\n` +
        `• Remove ALL your generated lessons\n` +
        `• Reset your request count (allowing you to generate new lessons)\n` +
        `• This action cannot be undone`
      : `Are you sure you want to delete the last 5 generated lessons for "${moduleName}"?\n\n` +
        `This will:\n` +
        `• Remove the 5 most recently generated lessons\n` +
        `• Keep older generated lessons\n` +
        `• This action cannot be undone`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    setIsDeletingLessons(moduleId);
    try {
      const url = new URL(getApiUrl(`user-lessons/${user.id}/${moduleId}`));
      if (deleteAll) {
        url.searchParams.set('deleteAll', 'true');
      }
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete lessons');
      }

      const data = await response.json();
      toast.success(data.message || `Deleted ${data.deletedCount} generated lesson${data.deletedCount !== 1 ? 's' : ''}. You can now generate new lessons!`);
      
      // Reload modules to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error deleting lessons:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete lessons. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsDeletingLessons(null);
    }
  };

  // Count how many generation sets a module has
  const countGenerationSets = (module: Module) => {
    const userGeneratedLessons = module.lessons.filter(lesson => lesson.userGenerated === true);
    if (userGeneratedLessons.length === 0) return 0;
    
    // Group by generationBatchId or createdAt timestamp
    const batchIds = new Set<string>();
    userGeneratedLessons.forEach(lesson => {
      // Prefer generationBatchId, fallback to createdAt if available
      const batchId = lesson.generationBatchId || 
                     (lesson.createdAt ? (typeof lesson.createdAt === 'string' ? lesson.createdAt : lesson.createdAt.toString()) : null) ||
                     'unknown';
      batchIds.add(batchId);
    });
    
    return batchIds.size;
  };

  // Check if module has user-generated lessons
  const hasUserGeneratedLessons = (module: Module) => {
    return module.lessons.some(lesson => lesson.userGenerated === true);
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
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      // Find the icon name from the selected category name
      const iconName = Object.keys(categoryMap).find(key => categoryMap[key] === selectedCategory) || selectedCategory;
      filtered = filtered.filter(m => {
        // Check both icon name and category name for compatibility
        return m.icon === iconName || getCategoryName(m.icon) === selectedCategory;
      });
    }

    // Sort: favorites first, then by name (alphabetically), then by completion
    return filtered.sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      
      // Sort by name alphabetically
      const nameCompare = a.title.localeCompare(b.title);
      if (nameCompare !== 0) return nameCompare;
      
      // Then by completion
      const aStatus = moduleStatus(a);
      const bStatus = moduleStatus(b);
      return bStatus.percent - aStatus.percent;
    });
  }, [modules, selectedCategory, favorites, searchQuery]);

  const categories = useMemo(() => {
    const catNames = new Set(modules.map(m => getCategoryName(m.icon)));
    return Array.from(catNames).sort(); // Sort alphabetically
  }, [modules]);

  // Filter modules based on navigation
  const displayedModules = useMemo(() => {
    if (activeNav === 'learning') {
      // Show only courses user has started (has progress)
      return filteredModules.filter(module => {
        const modProg = getModuleProgress(module.id);
        return modProg && Object.keys(modProg.lessonsCompleted || {}).length > 0;
      });
    } else if (activeNav === 'featured') {
      // Show all courses
      return filteredModules;
    }
    // For certification and leaderboard, return empty (they show different content)
    return [];
  }, [filteredModules, activeNav, getModuleProgress]);

  // If fullscreen mode, render fullscreen layout
  if (fullscreen && open) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-blue-50 via-white to-white flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-blue-100/70 bg-white/80 backdrop-blur-md flex-shrink-0 h-[60px] shadow-sm">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faBookOpen} className="text-xl text-primary" />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold leading-tight">Learning Hub</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Curated courses with a clean, blue-first experience</p>
            </div>
          </div>
          
          {/* Stats as Round Icons */}
          <div className="flex items-center gap-2">
            {/* Level Icon */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm ring-1 ring-white/60">
                <FontAwesomeIcon icon={faStar} className="text-xs text-white" />
              </div>
              <span className="text-[10px] font-semibold text-blue-700">{progress.level}</span>
            </div>
            
            {/* Streak Icon */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-sm ring-1 ring-white/60">
                <FontAwesomeIcon icon={faFire} className="text-xs text-white" />
              </div>
              <span className="text-[10px] font-semibold text-blue-700">{progress.streak}</span>
            </div>
            
            {/* Daily Lessons/Goal Icon */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm ring-1 ring-white/60">
                {tier === 'free' ? (
                  <FontAwesomeIcon icon={faTrophy} className="text-xs text-white" />
                ) : (
                  <FontAwesomeIcon icon={faBullseye} className="text-xs text-white" />
                )}
              </div>
              <span className="text-[10px] font-semibold text-blue-700">
                {tier === 'free' ? `${dailyLessonsRemaining}/2` : `${progress.dailyGoal} XP`}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0 ml-1 rounded-full hover:bg-blue-50 text-slate-600"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 pb-20">
          {activeNav === 'featured' || activeNav === 'learning' ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Modules */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {activeNav === 'learning' ? 'My Learning' : 'All Courses'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[140px] sm:w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(catName => {
                          // Find the icon name for this category
                          const iconName = Object.keys(categoryMap).find(key => categoryMap[key] === catName) || 'faBook';
                          return (
                            <SelectItem key={catName} value={catName}>
                              <FontAwesomeIcon icon={
                                iconName === 'faScroll' ? faScroll :
                                iconName === 'faGlobe' ? faGlobe :
                                iconName === 'faScaleBalanced' ? faScaleBalanced :
                                iconName === 'faLandmark' ? faLandmark : faBook
                              } className="mr-2" />
                              {catName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="text-sm sm:text-base">{tier.toUpperCase()}</Badge>
                  </div>
                </div>
                {displayedModules.length === 0 ? (
                  <div className="text-center py-12">
                    <FontAwesomeIcon icon={faBookOpen} className="text-5xl mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">
                      {activeNav === 'learning' 
                        ? "You haven't started any courses yet. Browse Featured to get started!" 
                        : 'No courses available.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {displayedModules.map((module) => {
                      const { percent, done } = moduleStatus(module);
                      return (
                        <Card 
                          key={module.id} 
                          className={`group cursor-pointer h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 bg-white/80 border border-blue-100 ${favorites.has(module.id) ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
                          onClick={() => handleCourseClick(module)}
                        >
                          {/* Course Image/Icon - Rectangular Header */}
                          <div className="relative h-32 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center overflow-hidden text-white">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.14),transparent_30%)]" />
                            <FontAwesomeIcon
                              icon={
                                module.icon === 'faScroll' ? faScroll :
                                  module.icon === 'faGlobe' ? faGlobe :
                                    module.icon === 'faScaleBalanced' ? faScaleBalanced :
                                      module.icon === 'faLandmark' ? faLandmark :
                                        faBook
                              }
                              className="text-5xl relative z-10 drop-shadow-sm"
                            />
                            {done && (
                              <div className="absolute top-2 right-2 z-10">
                                <FontAwesomeIcon icon={faCircleCheck} className="text-lg text-white bg-blue-500/80 rounded-full p-1 shadow-sm" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2 z-10">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 bg-white/80 hover:bg-white text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(module.id);
                                }}
                              >
                                <FontAwesomeIcon 
                                  icon={faHeart} 
                                  className={`text-sm ${favorites.has(module.id) ? 'text-blue-600' : 'text-blue-300'}`}
                                />
                              </Button>
                            </div>
                          </div>
                          
                          <CardHeader className="pb-3 p-4">
                            <CardTitle className="text-base font-semibold line-clamp-2 mb-2 text-slate-900">{module.title}</CardTitle>
                            <CardDescription className="text-xs text-slate-500 line-clamp-2">{module.description}</CardDescription>
                          </CardHeader>
                          
                          <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Badge variant="outline" className="capitalize text-[10px] border-blue-200 text-blue-700 bg-blue-50">
                                {module.requiredTier}
                              </Badge>
                              <span>•</span>
                              <span>{module.lessons.length} lessons</span>
                            </div>
                            <div>
                              <Progress value={percent} className="h-1.5 bg-blue-50" />
                              <div className="text-xs text-slate-500 mt-1">{percent}% complete</div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : activeNav === 'certification' ? (
            <ExamPage />
          ) : activeNav === 'leaderboard' ? (
            <Leaderboard />
          ) : null}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-blue-100 flex items-center justify-around h-[60px] safe-area-inset-bottom z-50 shadow-2xl shadow-blue-50/70">
          <button
            onClick={() => {
              setSelectedCourse(null);
              setActiveLesson(null);
              onOpenChange(false);
            }}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-slate-500 hover:text-blue-600"
          >
            <FontAwesomeIcon icon={faHouse} className="text-lg" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setActiveLesson(null);
              setActiveNav('featured');
            }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeNav === 'featured' ? 'text-blue-700 bg-blue-50/80' : 'text-slate-500'
            }`}
          >
            <FontAwesomeIcon icon={faStar} className="text-lg" />
            <span className="text-xs font-medium">Featured</span>
          </button>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setActiveLesson(null);
              setActiveNav('learning');
            }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeNav === 'learning' ? 'text-blue-700 bg-blue-50/80' : 'text-slate-500'
            }`}
          >
            <FontAwesomeIcon icon={faPlay} className="text-lg" />
            <span className="text-xs font-medium">Learning</span>
          </button>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setActiveLesson(null);
              setActiveNav('certification');
            }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeNav === 'certification' ? 'text-blue-700 bg-blue-50/80' : 'text-slate-500'
            }`}
          >
            <FontAwesomeIcon icon={faAward} className="text-lg" />
            <span className="text-xs font-medium">Certs</span>
          </button>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setActiveLesson(null);
              setActiveNav('leaderboard');
            }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeNav === 'leaderboard' ? 'text-blue-700 bg-blue-50/80' : 'text-slate-500'
            }`}
          >
            <FontAwesomeIcon icon={faTrophy} className="text-lg" />
            <span className="text-xs font-medium">Top</span>
          </button>
        </div>

        {activeLesson && (
          <LessonRunner
            module={activeLesson.module}
            lesson={activeLesson.lesson}
            onClose={closeLesson}
            open={Boolean(activeLesson)}
          />
        )}

        {/* Course View Panel - Slides in from right, keeps header and bottom nav visible */}
        {selectedCourse && (
          <div className="fixed top-[60px] bottom-[60px] left-0 right-0 z-40 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:to-slate-800 flex flex-col">
            {/* Course Header - Fixed at top */}
            <div className="flex-shrink-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-blue-100 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-3 shadow-sm">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => setSelectedCourse(null)}
                      className="w-9 h-9 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 border border-blue-100"
                    >
                      <FontAwesomeIcon icon={faChevronDown} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <FontAwesomeIcon
                        icon={
                          selectedCourse.icon === 'faScroll' ? faScroll :
                            selectedCourse.icon === 'faGlobe' ? faGlobe :
                              selectedCourse.icon === 'faScaleBalanced' ? faScaleBalanced :
                                selectedCourse.icon === 'faLandmark' ? faLandmark :
                                  faGraduationCap
                        }
                        className="text-lg text-blue-700"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{selectedCourse.title}</h1>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{selectedCourse.lessons.length} lessons</span>
                        {(() => {
                          const { percent } = moduleStatus(selectedCourse);
                          return <span>• {percent}% complete</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {(() => {
                    const { percent } = moduleStatus(selectedCourse);
                    return (
                      <div className="hidden sm:block w-24 flex-shrink-0">
                        <Progress value={percent} className="h-2 bg-blue-50" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Scrollable Lessons Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="max-w-4xl mx-auto">
                {/* Course description */}
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedCourse.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="capitalize text-xs border-blue-200 text-blue-700 bg-blue-50">{selectedCourse.requiredTier}</Badge>
                    {(() => {
                      const { done } = moduleStatus(selectedCourse);
                      if (done) {
                        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Completed</Badge>;
                      }
                      return null;
                    })()}
                  </div>
                </div>
                
                {/* Lessons List */}
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                    <FontAwesomeIcon icon={faListCheck} />
                    Lessons
                  </h2>
                  
                  {(() => {
                    // Sort lessons: incomplete first, completed last
                    const sortedLessons = [...selectedCourse.lessons].sort((a, b) => {
                      const aProgress = getLessonProgress(selectedCourse.id, a.id);
                      const bProgress = getLessonProgress(selectedCourse.id, b.id);
                      const aCompleted = aProgress?.completed === true;
                      const bCompleted = bProgress?.completed === true;
                      
                      if (aCompleted && !bCompleted) return 1;
                      if (!aCompleted && bCompleted) return -1;
                      return 0;
                    });
                    
                    let foundFirstIncomplete = false;
                    
                    return sortedLessons.map((lesson, index) => {
                      const lp = getLessonProgress(selectedCourse.id, lesson.id);
                      // A lesson is completed if the progress says so, regardless of tier locking
                      const isCompleted = lp?.completed === true;
                      // Tier-based locking
                      const isTierLocked = lesson.locked === true;
                      
                      // Sequential locking: only first incomplete, non-tier-locked lesson is unlocked
                      let isSequentiallyLocked = false;
                      if (!isCompleted && !isTierLocked) {
                        if (!foundFirstIncomplete) {
                          foundFirstIncomplete = true;
                          isSequentiallyLocked = false; // First incomplete is available
                        } else {
                          isSequentiallyLocked = true; // Others are sequentially locked
                        }
                      }
                      
                      // A lesson is locked if: tier locked OR sequentially locked
                      // BUT completed lessons are NEVER locked (always reviewable)
                      const isLocked = !isCompleted && (isTierLocked || isSequentiallyLocked);

                      return (
                        <div 
                          key={lesson.id} 
                          className={`bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 p-3 sm:p-4 transition-all ${
                            isLocked && !isCompleted ? 'opacity-60' : 'hover:shadow-lg hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              isCompleted 
                                ? 'bg-blue-100 text-blue-800' 
                                : isLocked 
                                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' 
                                  : 'bg-blue-50 text-blue-700'
                            }`}>
                              {isCompleted ? (
                                <FontAwesomeIcon icon={faCircleCheck} />
                              ) : isLocked ? (
                                <FontAwesomeIcon icon={faLock} />
                              ) : (
                                index + 1
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-slate-900 dark:text-white leading-tight">{lesson.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faBolt} className="text-blue-600" />
                                  {lesson.xpReward} XP
                                </span>
                                <span>• {lesson.quiz.length} Q</span>
                                {lesson.userGenerated && (
                                  <FontAwesomeIcon icon={faWandMagicSparkles} className="text-blue-500" />
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant={isCompleted ? 'outline' : 'default'}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Lesson clicked:', lesson.title, 'isLocked:', isLocked, 'isCompleted:', isCompleted);
                                handleStartLesson(selectedCourse, lesson);
                              }}
                              disabled={isLocked}
                              className={`h-8 px-3 text-xs flex-shrink-0 rounded-full ${isCompleted ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
                            >
                              {isCompleted ? 'Review' : isLocked ? 'Locked' : 'Start'}
                            </Button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
            
            {/* Generate More - Fixed at bottom (above bottom nav) */}
            {(() => {
              const { percent, done } = moduleStatus(selectedCourse);
              if (percent === 100 && done) {
                return (
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-500 px-4 sm:px-6 lg:px-8 py-3 border-t border-blue-600/60">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                        <FontAwesomeIcon icon={faWandMagicSparkles} className="text-lg text-white drop-shadow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-white">All lessons completed! 🎉</h3>
                        <p className="text-blue-100 text-xs">Generate more lessons to continue</p>
                      </div>
                      <Button
                        onClick={() => {
                          setModuleForGeneration({ id: selectedCourse.id, name: selectedCourse.title });
                          setShowGenerateLessonsPopup(true);
                        }}
                        disabled={isRequestingLessons === selectedCourse.id}
                        size="sm"
                        className="bg-white text-blue-700 hover:bg-blue-50 h-9 px-4 flex-shrink-0 rounded-full shadow-sm"
                      >
                        {isRequestingLessons === selectedCourse.id ? (
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faPlus} className="mr-1" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Generate More Lessons Popup */}
        <Dialog open={showGenerateLessonsPopup} onOpenChange={setShowGenerateLessonsPopup}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-blue-600" />
                Generate More Lessons
              </DialogTitle>
              <DialogDescription>
                Choose a difficulty level and generate more interactive lessons for{' '}
                <span className="font-semibold">{moduleForGeneration?.name}</span>.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Select Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Simple */}
                  <button
                    onClick={() => setSelectedDifficulty('simple')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDifficulty === 'simple'
                        ? 'border-blue-400 bg-blue-50 shadow-lg'
                        : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        selectedDifficulty === 'simple' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <FontAwesomeIcon icon={faPlay} className="text-lg" />
                      </div>
                      <div className="font-semibold text-gray-900">Simple</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Beginner friendly
                      </div>
                    </div>
                  </button>
                  
                  {/* Medium */}
                  <button
                    onClick={() => setSelectedDifficulty('medium')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDifficulty === 'medium'
                        ? 'border-blue-500 bg-blue-100 shadow-lg'
                        : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        selectedDifficulty === 'medium' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <FontAwesomeIcon icon={faFire} className="text-lg" />
                      </div>
                      <div className="font-semibold text-gray-900">Medium</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Challenging
                      </div>
                    </div>
                  </button>
                  
                  {/* Hard */}
                  <button
                    onClick={() => setSelectedDifficulty('hard')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDifficulty === 'hard'
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        selectedDifficulty === 'hard' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <FontAwesomeIcon icon={faBolt} className="text-lg" />
                      </div>
                      <div className="font-semibold text-gray-900">Hard</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Expert level
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2 text-blue-600" />
                  <strong>What you'll get:</strong>
                  {selectedDifficulty === 'simple' && ' Guided conversations with auto-play, basic legal case studies with multiple-choice answers.'}
                  {selectedDifficulty === 'medium' && ' Interactive dialogues you control, intermediate case scenarios requiring critical thinking.'}
                  {selectedDifficulty === 'hard' && ' Listening-only challenges (no text), complex legal cases with nuanced analysis required.'}
                </p>
                <ul className="text-sm text-blue-700 mt-3 space-y-1">
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-blue-600" />
                    5 new AI-generated lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-blue-600" />
                    More practice questions
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-blue-600" />
                    Additional XP rewards
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-blue-200 text-blue-700"
                  onClick={() => {
                    setShowGenerateLessonsPopup(false);
                    setModuleForGeneration(null);
                  }}
                >
                  Maybe Later
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
                  onClick={handleGenerateMoreLessons}
                  disabled={isRequestingLessons === moduleForGeneration?.id}
                >
                  {isRequestingLessons === moduleForGeneration?.id ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
                      Generate Lessons
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </div>
    );
  }

  // Original dialog mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] sm:max-h-[95vh] overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2 pb-3 sm:pb-4 pr-8">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
            <FontAwesomeIcon icon={faBookOpen} className="text-lg sm:text-xl md:text-2xl text-primary flex-shrink-0" />
            <span className="leading-tight">Learning Paths</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base md:text-lg">
            Structured, tier-aware lessons with quizzes, streaks, and XP—tailored for South Sudan law.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto bg-blue-50 border border-blue-100 rounded-xl">
            <TabsTrigger value="lessons" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 rounded-lg">
              <FontAwesomeIcon icon={faRoute} className="mr-2 text-primary" />
              <span className="hidden sm:inline">Learning Path</span>
              <span className="sm:hidden">Path</span>
            </TabsTrigger>
            <TabsTrigger value="certifications" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 rounded-lg">
              <FontAwesomeIcon icon={faCertificate} className="mr-2 text-blue-500" />
              <span className="hidden sm:inline">Certifications</span>
              <span className="sm:hidden">Certs</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 rounded-lg">
              <FontAwesomeIcon icon={faTrophy} className="mr-2 text-blue-500" />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <Card className="touch-manipulation relative overflow-hidden bg-white border border-blue-100 shadow-sm rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardDescription className="text-xs sm:text-sm text-slate-500">Level</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-blue-700">
                      <FontAwesomeIcon icon={faStar} className="text-lg text-blue-500" />
                      Level {progress.level}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                    <div className="text-sm sm:text-base text-slate-600">{formatNumber(progress.xp)} XP</div>
                    <Progress value={xpPercent} className="h-1.5 bg-blue-50" />
                    <div className="text-xs sm:text-sm text-slate-500">Next level at +{120 - (progress.xp % 120)} XP</div>
                  </CardContent>
                </Card>

                <Card className="touch-manipulation relative overflow-hidden bg-white border border-blue-100 shadow-sm rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardDescription className="text-xs sm:text-sm text-slate-500">Streak</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-blue-700">
                      <FontAwesomeIcon icon={faFire} className={`text-lg ${streakColor}`} />
                      {progress.streak} days
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                    <div className="text-sm sm:text-base text-slate-600">Stay consistent to keep your streak.</div>
                  </CardContent>
                </Card>

                <Card className="touch-manipulation relative overflow-hidden bg-white border border-blue-100 shadow-sm rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardDescription className="text-xs sm:text-sm text-slate-500">
                      {tier === 'free' ? 'Daily Lessons' : 'Daily Goal'}
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-blue-700">
                      {tier === 'free' ? (
                        <>
                          <FontAwesomeIcon icon={faTrophy} className="text-lg text-blue-500" />
                          {dailyLessonsRemaining}/2
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faBullseye} className="text-lg text-blue-500" />
                          {progress.dailyGoal} XP
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                    <div className="text-sm sm:text-base text-slate-600">
                      {tier === 'free'
                        ? dailyLessonsRemaining > 0
                          ? `${dailyLessonsRemaining} lesson${dailyLessonsRemaining === 1 ? '' : 's'} left today`
                          : 'Come back tomorrow!'
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
                        {categories.map(catName => {
                          // Find the icon name for this category
                          const iconName = Object.keys(categoryMap).find(key => categoryMap[key] === catName) || 'faBook';
                          return (
                            <SelectItem key={catName} value={catName}>
                              <FontAwesomeIcon icon={
                                iconName === 'faScroll' ? faScroll :
                                iconName === 'faGlobe' ? faGlobe :
                                iconName === 'faScaleBalanced' ? faScaleBalanced :
                                iconName === 'faLandmark' ? faLandmark : faBook
                              } className="mr-2" />
                              {catName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="text-sm sm:text-base">{tier.toUpperCase()}</Badge>
                  </div>
                </div>
                {/* Search Input */}
                <div className="w-full">
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredModules.map((module) => {
                    const { percent, done } = moduleStatus(module);
                    const isExpanded = expandedLessons.has(module.id);
                    const visibleLessons = module.lessons.filter((_, lessonIndex) => isExpanded || lessonIndex < 5);
                    const isSelected = selectedModuleId === module.id;
                    return (
                      <Card key={module.id} className={`h-full flex flex-col touch-manipulation transition-all duration-300 bg-white border border-blue-100 rounded-2xl shadow-sm ${favorites.has(module.id) ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}>
                        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                          {/* Course Image/Icon */}
                          <div className="mb-3 flex justify-center">
                            {module.imageUrl ? (
                              <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border border-blue-100 bg-gradient-to-br from-blue-100 to-blue-50">
                                <img
                                  src={module.imageUrl}
                                  alt={module.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-md border border-blue-100">
                                <FontAwesomeIcon
                                  icon={
                                    module.icon === 'faScroll' ? faScroll :
                                      module.icon === 'faGlobe' ? faGlobe :
                                        module.icon === 'faScaleBalanced' ? faScaleBalanced :
                                          module.icon === 'faLandmark' ? faLandmark :
                                            faBook
                                  }
                                  className="text-4xl sm:text-5xl text-blue-600"
                                />
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-base sm:text-lg flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 w-full justify-center">
                              <span className="leading-tight text-center text-slate-900">{module.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600"
                                onClick={() => toggleFavorite(module.id)}
                              >
                                <FontAwesomeIcon 
                                  icon={faHeart} 
                                  className={`text-lg ${favorites.has(module.id) ? 'text-blue-600' : 'text-blue-200'}`}
                                />
                              </Button>
                              {done ? <FontAwesomeIcon icon={faCircleCheck} className="text-sm sm:text-lg text-blue-600 flex-shrink-0" /> : null}
                            </div>
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base text-slate-600">{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-3 sm:gap-4 p-3 sm:p-6 pt-0">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
                            <Badge variant="outline" className="capitalize text-xs sm:text-sm border-blue-200 text-blue-700 bg-blue-50">
                              {module.requiredTier}
                            </Badge>
                            <span>{module.lessons.length} lessons</span>
                          </div>
                          <div>
                            <Progress value={percent} className="h-2 sm:h-2.5 bg-blue-50" />
                            <div className="text-xs sm:text-sm text-slate-500 mt-1">{percent}% complete</div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <Badge variant="outline" className="capitalize text-[11px] sm:text-xs border-blue-200 text-blue-700 bg-blue-50">
                                {module.requiredTier}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-sm border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                onClick={() => setSelectedModuleId(prev => prev === module.id ? null : module.id)}
                              >
                                {isSelected ? 'Hide lessons' : 'View lessons'}
                              </Button>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {visibleLessons.map((lesson) => {
                                  const lp = getLessonProgress(module.id, lesson.id);
                                  const isLocked = lesson.locked;
                                  const isCompleted = lp?.completed === true && !isLocked;

                                  return (
                                    <Card
                                      key={lesson.id}
                                      className={`h-full flex flex-col justify-between border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 ${isLocked ? 'opacity-70' : ''}`}
                                    >
                                      <CardContent className="flex-1 flex flex-col gap-3 p-3 sm:p-4">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm sm:text-base font-semibold leading-tight line-clamp-2 text-slate-900">{lesson.title}</span>
                                              {isCompleted && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                                  <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
                                                  Done
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                                              <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon={faBolt} className="h-3 w-3 text-blue-600" />
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
                                            <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-100">
                                              <FontAwesomeIcon icon={faLock} className="text-sm" />
                                              <span className="hidden sm:inline">Locked</span>
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                          <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <Badge variant="outline" className="capitalize text-[11px] sm:text-xs border-blue-200 text-blue-700 bg-blue-50">
                                              {lesson.tier || 'basic'}
                                            </Badge>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant={isCompleted ? 'outline' : 'default'}
                                            className={`h-9 sm:h-10 px-3 sm:px-4 text-sm flex-shrink-0 min-w-[70px] sm:min-w-[90px] ${isCompleted ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
                                            onClick={() => handleStartLesson(module, lesson)}
                                            disabled={isLocked}
                                          >
                                            <span className="hidden sm:inline">{isCompleted ? 'Review' : 'Start'}</span>
                                            <span className="sm:hidden">{isCompleted ? '✓' : '▶'}</span>
                                            <FontAwesomeIcon icon={faChevronRight} className="text-sm sm:ml-1 hidden sm:inline" />
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
                                  className="w-full mt-1 text-sm text-blue-700 hover:bg-blue-50"
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
                                      <FontAwesomeIcon icon={faChevronUp} className="mr-2" />
                                      Show Less
                                    </>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faChevronDown} className="mr-2" />
                                      Show All {module.lessons.length} Lessons
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {/* Delete/Regenerate Generated Lessons Buttons */}
                              {hasUserGeneratedLessons(module) && (() => {
                                const totalSets = countGenerationSets(module);
                                const hasMoreThan5Sets = totalSets > 5;
                                
                                return (
                                  <div className="w-full mt-2 space-y-2">
                                    <Button
                                      variant="outline"
                                      className="w-full border-dashed border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-blue-700"
                                      onClick={() => deleteGeneratedLessons(module.id, module.title, false)}
                                      disabled={isDeletingLessons === module.id}
                                    >
                                      {isDeletingLessons === module.id ? (
                                        <>
                                          <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon={faTrashCan} className="mr-2" />
                                          Delete Last 5 Lessons
                                        </>
                                      )}
                                    </Button>
                                    
                                    {hasMoreThan5Sets && (
                                      <Button
                                        variant="outline"
                                        className="w-full border-dashed border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-blue-700"
                                        onClick={() => deleteGeneratedLessons(module.id, module.title, true)}
                                        disabled={isDeletingLessons === module.id}
                                      >
                                        {isDeletingLessons === module.id ? (
                                          <>
                                            <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />
                                            Delete All Lessons
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                );
                              })()}
                              
                              {/* Request More Lessons Button */}
                              {done && (
                                <Button
                                  variant="outline"
                                  className="w-full mt-2 border-dashed border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-blue-700"
                                  onClick={() => {
                                    setModuleForGeneration({ id: module.id, name: module.title });
                                    setShowGenerateLessonsPopup(true);
                                  }}
                                  disabled={isRequestingLessons === module.id}
                                >
                                  {isRequestingLessons === module.id ? (
                                    <>
                                      <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
                                      Generate More
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
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

      {/* Login Modal for unauthenticated users */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </Dialog>
  );
}


