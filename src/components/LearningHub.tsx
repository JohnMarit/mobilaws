import { useMemo, useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faScroll, faGlobe, faScaleBalanced, faLandmark, faBook, faHeadphones, 
  faStar, faHeart, faPlus, faFire, faTrophy, faBolt, faCertificate, faRoute,
  faCircleCheck, faLock, faChevronRight, faChevronDown, faChevronUp,
  faTrashCan, faRotateLeft, faXmark, faPlay, faWandMagicSparkles,
  faSpinner, faBookOpen, faGraduationCap, faListCheck, faArrowRight, faBullseye,
  faBell, faSearch, faClock,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
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
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import LessonRunner from './LessonRunner';
import Leaderboard from './Leaderboard';
import ExamPage from './ExamPage';
import LoginModal from './LoginModal';
import { Lesson, Module } from '@/lib/learningContent';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { getApiUrl } from '@/lib/api';
import { auth } from '@/lib/firebase';

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
  const { tier, modules, progress, getModuleProgress, getLessonProgress, dailyLessonsRemaining, canTakeLesson, reloadModules, modulesLoading } = useLearning();
  const [isDeletingModule, setIsDeletingModule] = useState<string | null>(null);
  
  // State to store page-based progress for modules
  const [pageBasedProgress, setPageBasedProgress] = useState<Record<string, number>>({});

  // Fetch CORRECT page-based progress for all modules
  useEffect(() => {
    if (!user?.id || modules.length === 0) return;

    const fetchPageProgress = async () => {
      try {
        // Use getApiUrl helper to avoid double /api/ issue
        const apiUrl = getApiUrl(`migration/all-correct-progress/${user.id}`);
        console.log(`📊 Fetching page-based progress from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.warn('⚠️ Could not fetch page-based progress, using lesson-based fallback');
          return;
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.modules)) {
          // Build progress map: moduleId -> percentage
          const progressMap: Record<string, number> = {};
          
          data.modules.forEach((moduleData: any) => {
            if (moduleData.hasPageData) {
              // Use page-based progress (CORRECT - based on pages covered)
              progressMap[moduleData.moduleId] = moduleData.progress || 0;
              console.log(`  ✓ ${moduleData.moduleName}: ${moduleData.progress}% (page ${moduleData.currentPage}/${moduleData.totalPages})`);
            }
          });
          
          setPageBasedProgress(progressMap);
          console.log(`✅ Loaded page-based progress for ${Object.keys(progressMap).length} modules`);
        }
      } catch (error) {
        console.error('❌ Error fetching page-based progress:', error);
        // Silently fail - will use lesson-based fallback
      }
    };

    fetchPageProgress();
    
    // Refresh progress when modules change or user completes lessons
    const refreshInterval = setInterval(fetchPageProgress, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [user?.id, modules.length]);

  // Add refresh button handler
  useEffect(() => {
    const handleModulesUpdated = () => {
      toast.info('📚 Course content has been updated!');
      reloadModules();
    };

    window.addEventListener('modules-updated', handleModulesUpdated);
    return () => window.removeEventListener('modules-updated', handleModulesUpdated);
  }, [reloadModules]);
  const { showLoginModal, setShowLoginModal, setShowSubscriptionModal } = usePromptLimit();
  const [activeLesson, setActiveLesson] = useState<{ module: Module; lesson: Lesson } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRequestingLessons, setIsRequestingLessons] = useState<string | null>(null);
  const [isDeletingLessons, setIsDeletingLessons] = useState<string | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Module | null>(null);
  const [showGenerateLessonsPopup, setShowGenerateLessonsPopup] = useState(false);
  const [moduleForGeneration, setModuleForGeneration] = useState<{ id: string; name: string } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'simple' | 'medium' | 'hard'>('medium');
  
  // Notifications state
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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
    // CRITICAL: Use page-based progress if available (CORRECT calculation)
    const pagePercent = pageBasedProgress[module.id];
    
    if (pagePercent !== undefined) {
      // We have page-based progress - USE THIS (accounts for document pages, not just lessons)
      const done = pagePercent === 100;
      return { percent: pagePercent, done };
    }
    
    // Fallback to lesson-based calculation (will be replaced once page progress loads)
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

    // Sort: self-study first, then favorites, then by name (alphabetically), then by completion
    return filtered.sort((a, b) => {
      // Self-study modules always appear first
      const aSelfStudy = a.isSelfStudy ? 1 : 0;
      const bSelfStudy = b.isSelfStudy ? 1 : 0;
      if (aSelfStudy !== bSelfStudy) return bSelfStudy - aSelfStudy;
      
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

  // Helper function to get auth token for API requests
  const getAuthToken = async (): Promise<string | null> => {
    try {
      if (auth?.currentUser) {
        return await auth.currentUser.getIdToken();
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return null;
  };

  // Format time ago - handles Firestore timestamps and regular timestamps
  const formatTimeAgo = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    
    // Handle Firestore Timestamp object (has .seconds property)
    let seconds: number;
    if (timestamp.seconds !== undefined) {
      // Firestore Timestamp serialized as {seconds, nanoseconds}
      seconds = timestamp.seconds;
    } else if (timestamp.toDate) {
      // Firestore Timestamp with toDate method (if not serialized)
      seconds = Math.floor(timestamp.toDate().getTime() / 1000);
    } else if (typeof timestamp === 'string') {
      // ISO string format
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Unknown';
      seconds = Math.floor(date.getTime() / 1000);
    } else if (typeof timestamp === 'number') {
      // Unix timestamp in milliseconds or seconds
      seconds = timestamp < 10000000000 ? timestamp : Math.floor(timestamp / 1000);
    } else if (timestamp instanceof Date) {
      seconds = Math.floor(timestamp.getTime() / 1000);
    } else {
      // Try to parse as object with seconds
      console.warn('Unexpected timestamp format:', timestamp);
      return 'Unknown';
    }
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - seconds;

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  // Check if user is admin (based on email whitelist)
  const isAdmin = (): boolean => {
    if (!user?.email) return false;
    // Admin emails are typically configured in backend environment
    // For now, we'll check common admin email patterns or fetch from API if needed
    const adminEmails = ['thuchabraham42@gmail.com']; // This should match backend ADMIN_EMAILS
    return adminEmails.includes(user.email.toLowerCase());
  };

  // Get user initials for avatar
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get verification badge based on tier (Facebook style - colored checkmark)
  const getVerificationBadge = (tier?: string) => {
    if (!tier || tier === 'free') return null;
    
    const tierLower = tier.toLowerCase();
    
    // Facebook style verification badge - colored circular badge with white checkmark
    let badgeColor = '';
    let titleText = '';
    
    if (tierLower === 'premium') {
      badgeColor = '#FFD700'; // Gold
      titleText = 'Premium Verified';
    } else if (tierLower === 'standard') {
      badgeColor = '#C0C0C0'; // Silver
      titleText = 'Standard Verified';
    } else if (tierLower === 'basic') {
      badgeColor = '#1877F2'; // Facebook Blue
      titleText = 'Basic Verified';
    } else {
      return null;
    }
    
      return (
        <span 
        className="inline-flex items-center justify-center w-4 h-4 facebook-verified-badge" 
        title={titleText}
          style={{
          backgroundColor: badgeColor,
          }}
        >
        <FontAwesomeIcon icon={faCheck} className="text-[10px] text-white" style={{ fontWeight: 'bold', filter: 'drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.2))' }} />
        </span>
      );
  };

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('notifications/count'), { headers });
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.success) {
        setNotificationCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available for fetching notifications');
        setNotifications([]);
        return;
      }

      const response = await fetch(getApiUrl('notifications'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch notifications:', response.status, response.statusText);
        setNotifications([]);
        return;
      }
      
      const data = await response.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications || []);
        console.log('✅ Notifications loaded:', data.notifications.length);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(getApiUrl('notifications/read-all'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotificationCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Fetch notification count on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      // Refresh notification count every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    } else {
      setNotificationCount(0);
    }
  }, [user]);

  // Fetch notifications when notification panel opens
  useEffect(() => {
    if (showNotifications && user) {
      // Always fetch notifications when dialog opens
      const loadNotifications = async () => {
        await fetchNotifications();
      };
      loadNotifications();
    } else if (!user) {
      // Clear notifications if user logs out
      setNotifications([]);
    }
  }, [showNotifications, user]);

  const displayedModules = filteredModules;

  // If fullscreen mode, render fullscreen layout
  if (fullscreen && open) {
    return (
      <div className="fixed inset-0 z-50 bg-mobilaws-hero flex flex-col overflow-hidden text-slate-900">
        {/* Header — premium frosted strip */}
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2.5 border-b border-white/40 bg-white/55 backdrop-blur-2xl backdrop-saturate-150 flex-shrink-0 min-h-[56px] shadow-[0_1px_0_0_rgba(255,255,255,0.65)_inset,0_8px_32px_-12px_hsl(221_83%_53%_/_0.12)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-2xl hover:bg-primary/10 text-slate-600 border border-transparent hover:border-primary/10 transition-all"
              onClick={() => onOpenChange(false)}
              aria-label="Close study hub"
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg" />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/25 ring-2 ring-white/40 shrink-0">
                <FontAwesomeIcon icon={faBookOpen} className="text-white text-sm drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-[1.05rem] font-bold leading-tight tracking-tight text-gradient-brand truncate">
                  Study
                </h1>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
                  Learning hub
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5 shrink-0">
            {/* Compact Mobbin-scale metrics: ~24px icon well, tight type */}
            <div
              className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-1.5 py-1 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:gap-2 sm:rounded-xl sm:px-2 sm:py-1"
              title="Level"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 sm:h-7 sm:w-7">
                <FontAwesomeIcon icon={faStar} className="text-[10px] sm:text-[11px]" />
              </span>
              <div className="min-w-0 leading-none">
                <p className="text-[8px] font-medium uppercase tracking-[0.06em] text-slate-400 sm:text-[9px]">
                  Level
                </p>
                <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-900 sm:text-xs">
                  {progress.level}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-1.5 py-1 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:gap-2 sm:rounded-xl sm:px-2 sm:py-1"
              title="Streak"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 sm:h-7 sm:w-7">
                <FontAwesomeIcon icon={faFire} className="text-[10px] sm:text-[11px]" />
              </span>
              <div className="min-w-0 leading-none">
                <p className="text-[8px] font-medium uppercase tracking-[0.06em] text-slate-400 sm:text-[9px]">
                  Streak
                </p>
                <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-900 sm:text-xs">
                  {progress.streak}d
                </p>
              </div>
            </div>
            <div
              className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-2 py-1 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
              title={tier === 'free' ? 'Daily lessons' : 'Daily goal'}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                {tier === 'free' ? (
                  <FontAwesomeIcon icon={faTrophy} className="text-[11px]" />
                ) : (
                  <FontAwesomeIcon icon={faBullseye} className="text-[11px]" />
                )}
              </span>
              <div className="min-w-0 leading-none">
                <p className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-400">
                  {tier === 'free' ? 'Daily' : 'Goal'}
                </p>
                <p className="mt-0.5 max-w-[3.5rem] truncate text-xs font-semibold tabular-nums text-slate-900">
                  {tier === 'free' ? `${dailyLessonsRemaining}/2` : `${progress.dailyGoal}`}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content — courses first; secondary sections collapsed below */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-5 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-sm text-slate-800">
                <span className="font-medium text-muted-foreground">Welcome back, </span>
                <span className="font-semibold">{user?.name || 'Student'}</span>
              </p>
            </div>

            <div className="relative">
              <Input
                type="text"
                placeholder="Search courses, topics…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border-white/60 bg-white/70 pl-11 text-sm shadow-elevated ring-1 ring-primary/[0.06] backdrop-blur-xl placeholder:text-muted-foreground/70 focus-visible:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/20 sm:h-12 sm:pl-12 sm:text-base"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-primary/50 sm:left-4"
              />
            </div>

            {(() => {
              const currentModule =
                modules.find((m) => {
                  const prog = getModuleProgress(m.id);
                  return prog && Object.keys(prog.lessonsCompleted || {}).length > 0;
                }) || modules[0];

              if (!currentModule) return null;
              const { percent } = moduleStatus(currentModule);

              return (
                <div className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/60 p-3 shadow-sm backdrop-blur-md ring-1 ring-primary/[0.04] sm:gap-4 sm:p-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-md shadow-primary/20 ring-2 ring-white/50 sm:h-12 sm:w-12">
                    <FontAwesomeIcon
                      icon={
                        currentModule.icon === 'faScroll'
                          ? faScroll
                          : currentModule.icon === 'faGlobe'
                            ? faGlobe
                            : currentModule.icon === 'faScaleBalanced'
                              ? faScaleBalanced
                              : currentModule.icon === 'faLandmark'
                                ? faLandmark
                                : faBook
                      }
                      className="text-lg text-white sm:text-xl"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary/80">
                      Resume
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                      {currentModule.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress
                        value={percent}
                        className="h-1.5 flex-1 rounded-full bg-primary/10"
                      />
                      <span className="shrink-0 text-[11px] font-bold tabular-nums text-primary">
                        {percent}%
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCourseClick(currentModule)}
                    className="h-9 shrink-0 rounded-full border-0 bg-brand-gradient px-4 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:opacity-[0.96] sm:h-10 sm:px-5"
                  >
                    Open
                  </Button>
                </div>
              );
            })()}

            <div className="space-y-3 sm:space-y-4" data-featured-courses>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary/70">
                      All courses
                    </p>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Browse catalog
                    </h3>
                    <p className="mt-1 max-w-xl text-xs text-muted-foreground sm:text-sm">
                      Filter with search and category — your next lesson is one tap away.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-10 w-[150px] sm:w-[190px] rounded-full border-white/55 bg-white/65 backdrop-blur-md shadow-sm ring-1 ring-primary/[0.06]">
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
                    <Badge
                      variant="secondary"
                      className="rounded-full border border-primary/12 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-sm shadow-sm"
                    >
                      {tier}
                    </Badge>
                  </div>
                </div>
                {modulesLoading ? (
                  <div className="rounded-[1.5rem] border border-white/55 bg-white/45 py-14 text-center backdrop-blur-xl shadow-elevated ring-1 ring-primary/[0.05]">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-4xl text-primary/50 animate-spin" />
                    <p className="text-base font-semibold text-slate-800">Loading your catalog…</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">Hang tight — courses are syncing.</p>
                  </div>
                ) : displayedModules.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-primary/20 bg-white/40 py-14 text-center backdrop-blur-md">
                    <FontAwesomeIcon icon={faBookOpen} className="mx-auto mb-4 text-4xl text-primary/25" />
                    <p className="font-semibold text-slate-700">No courses match your filters</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try another category or clear search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                    {displayedModules.map((module) => {
                      const { percent, done } = moduleStatus(module);
                      return (
                        <Card 
                          key={module.id} 
                          className={cn(
                            'group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.25rem] border border-white/60 bg-white/55 backdrop-blur-md shadow-elevated transition-all duration-300',
                            'hover:-translate-y-1 hover:border-primary/20 hover:shadow-elevated-lg',
                            favorites.has(module.id) && 'ring-2 ring-primary/35 shadow-brand'
                          )}
                          onClick={() => handleCourseClick(module)}
                        >
                          <div className="relative h-[7.5rem] overflow-hidden rounded-t-[1.25rem]">
                            {module.imageUrl ? (
                              <img 
                                src={module.imageUrl} 
                                alt={module.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <>
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(221,83%,48%)] via-[hsl(232,70%,55%)] to-[hsl(250,55%,58%)] text-white">
                                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.15),transparent_32%)]" />
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
                                </div>
                              </>
                            )}
                            {done && (
                              <div className="absolute right-2 top-2 z-10">
                                <FontAwesomeIcon icon={faCircleCheck} className="rounded-full bg-emerald-500/95 p-1 text-base text-white shadow-lg ring-2 ring-white/50" />
                              </div>
                            )}
                            <div className="absolute left-2 top-2 z-10 flex gap-1">
                              {module.isSelfStudy && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 rounded-xl border border-white/40 bg-white/85 p-0 text-red-600 shadow-sm backdrop-blur-sm hover:bg-white"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete "${module.title}"? This action cannot be undone.`)) {
                                      setIsDeletingModule(module.id);
                                      try {
                                        const token = await getAuthToken();
                                        if (!token) {
                                          toast.error('Please sign in to delete modules');
                                          return;
                                        }
                                        
                                        const response = await fetch(getApiUrl(`self-study/modules/${module.id}`), {
                                          method: 'DELETE',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                          },
                                        });

                                        if (!response.ok) {
                                          const error = await response.json();
                                          throw new Error(error.error || 'Failed to delete module');
                                        }

                                        toast.success('Module deleted successfully');
                                        await reloadModules();
                                      } catch (error) {
                                        console.error('Error deleting module:', error);
                                        toast.error(error instanceof Error ? error.message : 'Failed to delete module');
                                      } finally {
                                        setIsDeletingModule(null);
                                      }
                                    }
                                  }}
                                  disabled={isDeletingModule === module.id}
                                  title="Delete self-study module"
                                >
                                  {isDeletingModule === module.id ? (
                                    <FontAwesomeIcon icon={faSpinner} className="text-sm animate-spin" />
                                  ) : (
                                    <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-xl border border-white/40 bg-white/85 p-0 text-primary shadow-sm backdrop-blur-sm hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(module.id);
                                }}
                              >
                                <FontAwesomeIcon 
                                  icon={faHeart} 
                                  className={cn(
                                    'text-sm transition-colors',
                                    favorites.has(module.id) ? 'text-primary' : 'text-primary/35'
                                  )}
                                />
                              </Button>
                            </div>
                          </div>
                          
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="mb-1.5 line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900">
                              {module.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {module.description}
                            </CardDescription>
                          </CardHeader>
                          
                          <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge
                                variant="outline"
                                className="rounded-full border-primary/15 bg-primary/[0.06] px-2 py-0.5 text-[10px] font-semibold capitalize text-primary"
                              >
                                {module.requiredTier}
                              </Badge>
                              <span className="font-medium">{module.lessons.length} lessons</span>
                            </div>
                            <div>
                              <Progress value={percent} className="h-1.5 rounded-full bg-primary/10" />
                              <div className="mt-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                                {percent}% complete
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              <Collapsible
                defaultOpen={false}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl"
              >
                <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left outline-none transition-colors hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-slate-300/80 sm:gap-4 sm:px-4 sm:py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:h-11 sm:w-11">
                    <FontAwesomeIcon icon={faRoute} className="text-base sm:text-lg" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400 sm:text-[11px]">
                      More
                    </p>
                    <p className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base">
                      Stats, path & streak
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180">
                    <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-5 border-t border-slate-200/70 px-3 pb-5 pt-4 sm:px-4 sm:pb-6">
                    <div className="grid grid-cols-3 divide-x divide-slate-200/80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                      <div className="p-3 text-center sm:p-4">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:h-10 sm:w-10">
                          <FontAwesomeIcon icon={faBook} className="text-sm sm:text-base" />
                        </div>
                        <div className="text-lg font-semibold tabular-nums tracking-tight text-slate-900 sm:text-xl">
                          {modules.length}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
                          Courses
                        </div>
                      </div>
                      <div className="p-3 text-center sm:p-4">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:h-10 sm:w-10">
                          <FontAwesomeIcon icon={faClock} className="text-sm sm:text-base" />
                        </div>
                        <div className="text-lg font-semibold tabular-nums tracking-tight text-slate-900 sm:text-xl">
                          {Math.floor(progress.xp / 60)}h
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
                          Study
                        </div>
                      </div>
                      <div className="p-3 text-center sm:p-4">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:h-10 sm:w-10">
                          <FontAwesomeIcon icon={faTrophy} className="text-sm sm:text-base" />
                        </div>
                        <div className="text-lg font-semibold tabular-nums tracking-tight text-slate-900 sm:text-xl">
                          {Math.floor(progress.xp / 500)}
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
                          Certs
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const pathSlice = modules.slice(0, 5);
                      const firstActionable = pathSlice.findIndex((_, index) => {
                        const { done } = moduleStatus(pathSlice[index]);
                        const isLocked = index > 0 && !moduleStatus(modules[index - 1]).done;
                        return !done && !isLocked;
                      });
                      return (
                        <section aria-labelledby="learning-path-heading">
                          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/48 shadow-elevated-lg ring-1 ring-primary/[0.06] backdrop-blur-xl">
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-[hsl(262,58%,58%,0.06)]" />
                            <div className="relative border-b border-primary/[0.08] px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
                              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary/75">
                                Curated sequence
                              </p>
                              <h2
                                id="learning-path-heading"
                                className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
                              >
                                Recommended learning path
                              </h2>
                              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                Finish each step to unlock the next. Your full catalog is above whenever you need it.
                              </p>
                            </div>
                            <div className="relative px-3 py-4 sm:px-5 sm:py-6">
                              <div className="relative">
                                <div
                                  className="absolute bottom-8 left-[17px] top-5 w-px rounded-full bg-gradient-to-b from-primary/35 via-primary/15 to-primary/5 sm:left-[21px]"
                                  aria-hidden
                                />
                                <div className="space-y-3 sm:space-y-4">
                                  {pathSlice.map((module, index) => {
                                    const { percent, done } = moduleStatus(module);
                                    const isLocked = index > 0 && !moduleStatus(modules[index - 1]).done;
                                    const isCurrent = index === firstActionable && !done;
                                    return (
                                      <div key={module.id} className="relative flex gap-3 sm:gap-4">
                                        <div className="relative z-10 flex w-9 flex-shrink-0 justify-center pt-1 sm:w-11">
                                          <div
                                            className={cn(
                                              'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm',
                                              done &&
                                                'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-white',
                                              isLocked &&
                                                !done &&
                                                'bg-slate-200/90 text-slate-500 shadow-inner ring-2 ring-white/90',
                                              !done &&
                                                !isLocked &&
                                                isCurrent &&
                                                'scale-[1.02] bg-brand-gradient text-primary-foreground shadow-lg shadow-primary/35 ring-4 ring-primary/20',
                                              !done &&
                                                !isLocked &&
                                                !isCurrent &&
                                                'border-2 border-primary/20 bg-white text-primary shadow-md shadow-primary/10'
                                            )}
                                          >
                                            {done ? (
                                              <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
                                            ) : isLocked ? (
                                              <FontAwesomeIcon icon={faLock} className="text-[11px]" />
                                            ) : (
                                              index + 1
                                            )}
                                          </div>
                                        </div>
                                        <div
                                          className={cn(
                                            'min-w-0 flex-1 rounded-2xl border px-3 py-3 transition-all duration-300 sm:px-5 sm:py-4',
                                            isCurrent &&
                                              'border-primary/25 bg-white/75 shadow-md shadow-primary/8 ring-1 ring-primary/10',
                                            !isCurrent &&
                                              'border-white/70 bg-white/45 backdrop-blur-md hover:border-primary/15 hover:bg-white/65 hover:shadow-md'
                                          )}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <h4 className="pr-2 text-sm font-semibold leading-snug text-slate-900 sm:text-base">
                                              {module.title}
                                            </h4>
                                            {isCurrent && (
                                              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                                Next
                                              </span>
                                            )}
                                          </div>
                                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            {done
                                              ? 'Completed'
                                              : isLocked
                                                ? 'Complete the previous course to unlock'
                                                : 'In progress or ready to start'}
                                          </p>
                                          {!done && !isLocked && (
                                            <div className="mt-3">
                                              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                                                <span className="font-medium text-muted-foreground">
                                                  Progress
                                                </span>
                                                <span className="font-bold tabular-nums text-primary">
                                                  {percent}%
                                                </span>
                                              </div>
                                              <Progress
                                                value={percent}
                                                className="h-1.5 rounded-full bg-primary/10"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <Button
                                className="relative z-10 mt-4 h-11 w-full rounded-2xl border border-white/30 bg-brand-gradient font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-[0.96] sm:h-12"
                                type="button"
                                onClick={() => {
                                  setSelectedCourse(null);
                                  setTimeout(() => {
                                    document
                                      .querySelector('[data-featured-courses]')
                                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }, 80);
                                }}
                              >
                                Jump to course list
                              </Button>
                            </div>
                          </div>
                        </section>
                      );
                    })()}

                    <Card className="relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-gradient-to-br from-[hsl(221,83%,46%)] via-[hsl(232,72%,52%)] to-[hsl(255,55%,48%)] text-white shadow-elevated-lg">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_90%_-10%,rgba(255,255,255,0.28),transparent_50%)]" />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.1),transparent_42%)]" />
                      <CardContent className="relative p-4 sm:p-6">
                        <div className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner backdrop-blur-md sm:right-4 sm:top-4 sm:h-12 sm:w-12">
                          <FontAwesomeIcon icon={faTrophy} className="text-lg text-white drop-shadow-sm sm:text-xl" />
                        </div>
                        <div className="relative z-10 pr-12 sm:pr-14">
                          <div className="mb-1 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFire} className="text-amber-200 drop-shadow-sm" />
                            <h3 className="text-lg font-bold tracking-tight sm:text-xl">
                              {progress.streak}-day streak
                            </h3>
                          </div>
                          <p className="mb-4 max-w-md text-sm font-medium text-white/85 sm:text-base">
                            Consistency compounds — one lesson keeps the flame alive.
                          </p>
                          <div className="mb-4 flex flex-wrap gap-2">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-colors sm:h-9 sm:w-9 sm:text-xs',
                                  idx < progress.streak % 7 && 'bg-white text-primary shadow-md',
                                  idx === progress.streak % 7 &&
                                    'bg-white text-primary shadow-lg ring-2 ring-white/90',
                                  idx > progress.streak % 7 &&
                                    'border border-white/40 bg-white/15 text-white/90'
                                )}
                              >
                                {day}
                              </div>
                            ))}
                          </div>
                          <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4">
                            <div className="mb-2 flex items-center justify-between text-sm font-medium">
                              <span className="text-white/90">Today&apos;s rhythm</span>
                              <span className="font-bold tabular-nums">
                                {progress.xp % 60} / 60 min
                              </span>
                            </div>
                            <Progress
                              value={((progress.xp % 60) / 60) * 100}
                              className="h-2 rounded-full bg-white/25"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
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
          <div className="fixed top-[56px] bottom-0 left-0 right-0 z-40 flex flex-col bg-mobilaws-hero pb-[max(0px,env(safe-area-inset-bottom))]">
            <div className="flex-shrink-0 border-b border-white/45 bg-white/60 px-4 py-3 backdrop-blur-2xl shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <button 
                      type="button"
                      onClick={() => setSelectedCourse(null)}
                      className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/70 text-slate-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900"
                      aria-label="Back to hub"
                    >
                      <FontAwesomeIcon icon={faChevronDown} className="text-base" />
                    </button>
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg shadow-primary/20 ring-2 ring-white/40">
                      <FontAwesomeIcon
                        icon={
                          selectedCourse.icon === 'faScroll' ? faScroll :
                            selectedCourse.icon === 'faGlobe' ? faGlobe :
                              selectedCourse.icon === 'faScaleBalanced' ? faScaleBalanced :
                                selectedCourse.icon === 'faLandmark' ? faLandmark :
                                  faGraduationCap
                        }
                        className="text-lg text-primary-foreground"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900 sm:text-lg">
                        {selectedCourse.title}
                      </h1>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-muted-foreground">
                        <span>{selectedCourse.lessons.length} lessons</span>
                        {(() => {
                          const { percent } = moduleStatus(selectedCourse);
                          return (
                            <span className="tabular-nums text-primary/80">· {percent}%</span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {(() => {
                    const { percent } = moduleStatus(selectedCourse);
                    return (
                      <div className="hidden w-28 flex-shrink-0 pt-1 sm:block">
                        <Progress value={percent} className="h-2 rounded-full bg-primary/10" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <div className="mb-6 rounded-2xl border border-white/55 bg-white/45 p-4 backdrop-blur-md shadow-sm sm:p-5">
                  <p className="text-sm leading-relaxed text-slate-600">{selectedCourse.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/15 bg-primary/[0.06] px-2.5 py-0.5 text-xs font-semibold capitalize text-primary"
                    >
                      {selectedCourse.requiredTier}
                    </Badge>
                    {(() => {
                      const { done } = moduleStatus(selectedCourse);
                      if (done) {
                        return (
                          <Badge className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            Completed
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary/70">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FontAwesomeIcon icon={faListCheck} className="text-sm" />
                    </span>
                    Lesson plan
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
                          className={cn(
                            'rounded-2xl border p-3.5 transition-all duration-200 sm:p-4',
                            isLocked && !isCompleted &&
                              'border-slate-200/80 bg-slate-50/60 opacity-[0.78]',
                            (!isLocked || isCompleted) &&
                              'border-white/65 bg-white/60 shadow-sm backdrop-blur-md hover:border-primary/18 hover:shadow-md'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                                isCompleted && 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80',
                                isLocked && !isCompleted && 'bg-slate-100 text-slate-400',
                                !isCompleted && !isLocked && 'bg-primary/10 text-primary ring-1 ring-primary/15'
                              )}
                            >
                              {isCompleted ? (
                                <FontAwesomeIcon icon={faCircleCheck} />
                              ) : isLocked ? (
                                <FontAwesomeIcon icon={faLock} className="text-xs" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold leading-snug text-slate-900">{lesson.title}</h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 font-medium text-primary/80">
                                  <FontAwesomeIcon icon={faBolt} className="text-[10px]" />
                                  {lesson.xpReward} XP
                                </span>
                                <span>· {lesson.quiz.length} questions</span>
                                {lesson.userGenerated && (
                                  <FontAwesomeIcon icon={faWandMagicSparkles} className="text-primary/60" />
                                )}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant={isCompleted ? 'outline' : 'default'}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleStartLesson(selectedCourse, lesson);
                              }}
                              disabled={isLocked}
                              className={cn(
                                'h-9 flex-shrink-0 rounded-full px-4 text-xs font-semibold',
                                isCompleted &&
                                  'border-primary/20 text-primary hover:bg-primary/5',
                                !isCompleted &&
                                  !isLocked &&
                                  'border-0 bg-brand-gradient text-primary-foreground shadow-md shadow-primary/25 hover:opacity-[0.96]'
                              )}
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

        {/* Notifications Panel */}
        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Notifications</DialogTitle>
                {notificationCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] space-y-2 py-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faBell} className="text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const handleNotificationClick = async () => {
                    if (!notification.read && user) {
                      // Mark as read
                      try {
                        const token = await getAuthToken();
                        if (token) {
                          await fetch(getApiUrl(`notifications/${notification.id}/read`), {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                          });
                          setNotifications(prev =>
                            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                          );
                          setNotificationCount(prev => Math.max(0, prev - 1));
                        }
                      } catch (error) {
                        console.error('Error marking notification as read:', error);
                      }
                    }
                    if (notification.discussionId) {
                      setShowNotifications(false);
                      toast.info('Community discussions are no longer in the app; this update was marked as read.');
                    }
                  };

                  return (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow border-blue-100 relative ${
                        !notification.read ? 'bg-blue-50/50' : 'bg-white'
                      }`}
                      onClick={handleNotificationClick}
                    >
                      <CardContent className="p-3 sm:p-4">
                        {!notification.read && (
                          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faBell} className="text-white text-xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm mb-1">{notification.title}</h4>
                            <p className="text-slate-600 text-xs sm:text-sm mb-1">{notification.message}</p>
                            <span className="text-xs text-slate-500">{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
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
                    <Badge
                      variant="secondary"
                      className="rounded-full border border-primary/12 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm"
                    >
                      {tier}
                    </Badge>
                  </div>
                </div>
                {/* Search Input with Refresh Button */}
                <div className="w-full flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      reloadModules();
                      toast.info('🔄 Refreshing courses...');
                    }}
                    disabled={modulesLoading}
                    className="px-3"
                  >
                    <FontAwesomeIcon 
                      icon={faRotateLeft} 
                      className={modulesLoading ? 'animate-spin' : ''} 
                    />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredModules.map((module) => {
                    const { percent, done } = moduleStatus(module);
                    const isExpanded = expandedLessons.has(module.id);
                    
                    // Group lessons by level
                    const lessonsByLevel = module.lessons.reduce((acc, lesson) => {
                      const level = (lesson as any).level || Math.floor(module.lessons.indexOf(lesson) / 5) + 1;
                      if (!acc[level]) {
                        acc[level] = [];
                      }
                      acc[level].push(lesson);
                      return acc;
                    }, {} as Record<number, typeof module.lessons>);
                    
                    const levels = Object.keys(lessonsByLevel).map(Number).sort((a, b) => a - b);
                    const visibleLevels = isExpanded ? levels : levels.slice(0, 1); // Show first level by default
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
                              {module.isSelfStudy && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete "${module.title}"? This action cannot be undone.`)) {
                                      setIsDeletingModule(module.id);
                                      try {
                                        const token = await getAuthToken();
                                        if (!token) {
                                          toast.error('Please sign in to delete modules');
                                          return;
                                        }
                                        
                                        const response = await fetch(getApiUrl(`self-study/modules/${module.id}`), {
                                          method: 'DELETE',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json',
                                          },
                                        });

                                        if (!response.ok) {
                                          const error = await response.json();
                                          throw new Error(error.error || 'Failed to delete module');
                                        }

                                        toast.success('Module deleted successfully');
                                        await reloadModules();
                                      } catch (error) {
                                        console.error('Error deleting module:', error);
                                        toast.error(error instanceof Error ? error.message : 'Failed to delete module');
                                      } finally {
                                        setIsDeletingModule(null);
                                      }
                                    }
                                  }}
                                  disabled={isDeletingModule === module.id}
                                  title="Delete self-study module"
                                >
                                  {isDeletingModule === module.id ? (
                                    <FontAwesomeIcon icon={faSpinner} className="text-lg animate-spin" />
                                  ) : (
                                    <FontAwesomeIcon icon={faTrashCan} className="text-lg" />
                                  )}
                                </Button>
                              )}
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
                            <div className="mt-3 space-y-4">
                              {visibleLevels.map((level) => {
                                const levelLessons = lessonsByLevel[level] || [];
                                
                                return (
                                  <div key={level} className="space-y-3">
                                    {/* Level Header */}
                                    <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-sm font-semibold border-blue-300 text-blue-700 bg-blue-50">
                                          Level {level}
                                        </Badge>
                                        <span className="text-xs text-slate-500">
                                          {levelLessons.length} lesson{levelLessons.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Lessons in this level */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                      {levelLessons.map((lesson) => {
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
                                          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="capitalize text-[11px] sm:text-xs border-blue-200 text-blue-700 bg-blue-50">
                                              {lesson.tier || 'basic'}
                                            </Badge>
                                            {(lesson as any).difficulty && (
                                              <Badge 
                                                variant="outline" 
                                                className={`capitalize text-[11px] sm:text-xs ${
                                                  (lesson as any).difficulty === 'simple' ? 'border-green-200 text-green-700 bg-green-50' :
                                                  (lesson as any).difficulty === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                                  'border-red-200 text-red-700 bg-red-50'
                                                }`}
                                              >
                                                {(lesson as any).difficulty}
                                              </Badge>
                                            )}
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
                                  </div>
                                );
                              })}
                              
                              {/* Expand/Collapse Button */}
                              {levels.length > 1 && (
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
                                      Show All {levels.length} Level{levels.length !== 1 ? 's' : ''} ({module.lessons.length} Lessons)
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


