import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  BookOpen,
  Clock,
  Trophy,
  Users,
  Eye,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Lock,
  Unlock,
  GraduationCap,
  FileQuestion,
  Sparkles
} from 'lucide-react';

interface GeneratedQuiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  accessLevels?: ('free' | 'basic' | 'standard' | 'premium')[];
}

interface GeneratedLesson {
  id: string;
  title: string;
  content: string;
  summary: string;
  xpReward: number;
  estimatedMinutes: number;
  quiz: GeneratedQuiz[];
  tips: string[];
  examples: string[];
  keyTerms: { term: string; definition: string }[];
  hasAudio: boolean;
  accessLevels?: ('free' | 'basic' | 'standard' | 'premium')[];
}

interface GeneratedModule {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  lessons: GeneratedLesson[];
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[];
  tutorId: string;
  tutorName: string;
  sourceContentId: string;
  createdAt: any;
  updatedAt: any;
  totalXp: number;
  totalLessons: number;
  estimatedHours: number;
  published: boolean;
}

interface ModuleManagerProps {
  tutorId: string;
  tutorName: string;
}

const tierColors: Record<string, string> = {
  free: 'bg-gray-500',
  basic: 'bg-blue-500',
  standard: 'bg-purple-500',
  premium: 'bg-yellow-500',
};

const tierLabels: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

export default function ModuleManager({ tutorId, tutorName }: ModuleManagerProps) {
  const [modules, setModules] = useState<GeneratedModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<GeneratedModule | null>(null);
  const [generateModuleId, setGenerateModuleId] = useState<string>('');
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [generateDifficulty, setGenerateDifficulty] = useState<'simple' | 'medium' | 'hard'>('medium');
  const [isGeneratingShared, setIsGeneratingShared] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccessLevels, setEditingAccessLevels] = useState<{
    moduleAccessLevels: string[];
    lessonUpdates: Map<string, string[]>;
    quizUpdates: Map<string, { lessonId: string; quizId: string; accessLevels: string[] }>;
  }>({
    moduleAccessLevels: [],
    lessonUpdates: new Map(),
    quizUpdates: new Map(),
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadModules();
  }, [tutorId]);

  const loadModules = async () => {
    setLoading(true);
    console.log('🔍 Loading modules for tutor:', tutorId);
    try {
      const url = getApiUrl(`tutor-admin/modules/tutor/${tutorId}`);
      console.log('📡 Fetching from:', url);
      const response = await fetch(url);
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Response not OK:', response.statusText);
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Received modules:', data);
      console.log('📊 Number of modules:', data?.length || 0);
      
      setModules(data || []);
      if (data && data.length > 0 && !generateModuleId) {
        setGenerateModuleId(data[0].id);
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No modules found for tutor:', tutorId);
        toast.info('No modules found yet. Upload a document first.');
      } else {
        console.log('✅ Loaded', data.length, 'module(s)');
      }
    } catch (error) {
      console.error('❌ Failed to load modules:', error);
      toast.error('Failed to load modules: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module: GeneratedModule) => {
    setSelectedModule(module);
    
    // Initialize editing state with current access levels
    const lessonUpdates = new Map<string, string[]>();
    module.lessons.forEach(lesson => {
      if (lesson.accessLevels) {
        lessonUpdates.set(lesson.id, lesson.accessLevels);
      } else {
        lessonUpdates.set(lesson.id, module.accessLevels);
      }
    });

    const quizUpdates = new Map<string, { lessonId: string; quizId: string; accessLevels: string[] }>();
    module.lessons.forEach(lesson => {
      lesson.quiz.forEach(quiz => {
        const key = `${lesson.id}-${quiz.id}`;
        const quizAccess = quiz.accessLevels || lesson.accessLevels || module.accessLevels;
        quizUpdates.set(key, {
          lessonId: lesson.id,
          quizId: quiz.id,
          accessLevels: quizAccess,
        });
      });
    });

    setEditingAccessLevels({
      moduleAccessLevels: module.accessLevels,
      lessonUpdates,
      quizUpdates,
    });
    
    setIsEditDialogOpen(true);
  };

  const toggleModuleAccessLevel = (level: string) => {
    setEditingAccessLevels(prev => ({
      ...prev,
      moduleAccessLevels: prev.moduleAccessLevels.includes(level)
        ? prev.moduleAccessLevels.filter(l => l !== level)
        : [...prev.moduleAccessLevels, level],
    }));
  };

  const toggleLessonAccessLevel = (lessonId: string, level: string) => {
    setEditingAccessLevels(prev => {
      const newLessonUpdates = new Map(prev.lessonUpdates);
      const currentLevels = newLessonUpdates.get(lessonId) || [];
      const newLevels = currentLevels.includes(level)
        ? currentLevels.filter(l => l !== level)
        : [...currentLevels, level];
      newLessonUpdates.set(lessonId, newLevels);
      return { ...prev, lessonUpdates: newLessonUpdates };
    });
  };

  const toggleQuizAccessLevel = (lessonId: string, quizId: string, level: string) => {
    setEditingAccessLevels(prev => {
      const key = `${lessonId}-${quizId}`;
      const newQuizUpdates = new Map(prev.quizUpdates);
      const currentUpdate = newQuizUpdates.get(key)!;
      const currentLevels = currentUpdate.accessLevels;
      const newLevels = currentLevels.includes(level)
        ? currentLevels.filter(l => l !== level)
        : [...currentLevels, level];
      newQuizUpdates.set(key, { ...currentUpdate, accessLevels: newLevels });
      return { ...prev, quizUpdates: newQuizUpdates };
    });
  };

  const applyToAll = (type: 'lessons' | 'quizzes', accessLevels: string[]) => {
    if (!selectedModule) return;

    if (type === 'lessons') {
      const newLessonUpdates = new Map<string, string[]>();
      selectedModule.lessons.forEach(lesson => {
        newLessonUpdates.set(lesson.id, accessLevels);
      });
      setEditingAccessLevels(prev => ({ ...prev, lessonUpdates: newLessonUpdates }));
      toast.success('Applied to all lessons');
    } else {
      const newQuizUpdates = new Map<string, { lessonId: string; quizId: string; accessLevels: string[] }>();
      selectedModule.lessons.forEach(lesson => {
        lesson.quiz.forEach(quiz => {
          const key = `${lesson.id}-${quiz.id}`;
          newQuizUpdates.set(key, {
            lessonId: lesson.id,
            quizId: quiz.id,
            accessLevels,
          });
        });
      });
      setEditingAccessLevels(prev => ({ ...prev, quizUpdates: newQuizUpdates }));
      toast.success('Applied to all quizzes');
    }
  };

  const handleSaveAccessLevels = async () => {
    if (!selectedModule) return;

    if (editingAccessLevels.moduleAccessLevels.length === 0) {
      toast.error('Module must have at least one access level');
      return;
    }

    setIsSaving(true);
    try {
      const lessonUpdates = Array.from(editingAccessLevels.lessonUpdates.entries()).map(
        ([lessonId, accessLevels]) => ({ lessonId, accessLevels })
      );

      const quizUpdates = Array.from(editingAccessLevels.quizUpdates.values());

      const response = await fetch(
        getApiUrl(`tutor-admin/modules/${selectedModule.id}/access/bulk`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleAccessLevels: editingAccessLevels.moduleAccessLevels,
            lessonUpdates,
            quizUpdates,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Access levels updated successfully!');
        setIsEditDialogOpen(false);
        loadModules();
      } else {
        toast.error('Failed to update access levels');
      }
    } catch (error) {
      console.error('Error updating access levels:', error);
      toast.error('Failed to update access levels');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleGenerateSharedLessons = async () => {
    if (!generateModuleId) {
      toast.error('Please select a module');
      return;
    }

    if (generateCount < 1) {
      toast.error('Number of lessons must be at least 1');
      return;
    }

    setIsGeneratingShared(true);
    try {
      const response = await fetch(getApiUrl('tutor-admin/generate-public-lessons'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: generateModuleId,
          numberOfLessons: generateCount,
          difficulty: generateDifficulty,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to generate lessons');
      }

      // Show detailed progress message
      if (data.currentPage && data.totalPages) {
        const progressPercent = Math.round((data.currentPage / data.totalPages) * 100);
        toast.success(
          `✅ Generated ${data.added} lesson(s)! Progress: ${progressPercent}% (page ${data.currentPage}/${data.totalPages})`,
          { duration: 5000 }
        );
      } else {
        toast.success(`✅ Generated ${data.added || generateCount} shared lesson(s)!`);
      }
      
      // Reload modules to show new lessons
      await loadModules();
      
      // Notify all users to reload modules
      window.dispatchEvent(new Event('modules-updated'));
      
      console.log('📚 Shared lessons generated and modules refreshed');
    } catch (error) {
      console.error('Error generating shared lessons:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate shared lessons');
    } finally {
      setIsGeneratingShared(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <BookOpen className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Modules Yet</h3>
            <p className="text-gray-600 mb-4">
              Upload a document to generate your first learning module
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Modules</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage access levels for your learning content</p>
        </div>
        <Badge variant="outline" className="text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 flex-shrink-0 self-start sm:self-auto">
          {modules.length} Module{modules.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Shared Lessons Generator */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Generate Shared Lessons (All Users)
          </CardTitle>
          <CardDescription>
            Quickly generate lessons once and make them available to every learner. Faster load, no per-user generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Module</Label>
              <select
                value={generateModuleId}
                onChange={(e) => setGenerateModuleId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.totalLessons} lessons)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Number of Lessons</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Recommended: 3-10</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-gray-700">Difficulty</Label>
              <select
                value={generateDifficulty}
                onChange={(e) => setGenerateDifficulty(e.target.value as 'simple' | 'medium' | 'hard')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="simple">Simple</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Shared lessons are stored on the module and load instantly for all users. Perfect to reduce per-user generation time.
            </p>
            <Button
              onClick={handleGenerateSharedLessons}
              disabled={isGeneratingShared || !generateModuleId}
              className="gap-2"
            >
              {isGeneratingShared ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Shared Lessons
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4">
        {modules.map((module) => (
          <Card key={module.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl flex-shrink-0">{module.icon}</span>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-xl leading-tight">{module.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">{module.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                    {module.accessLevels.map((level) => (
                      <Badge key={level} className={`${tierColors[level]} text-white text-xs`}>
                        {tierLabels[level]}
                      </Badge>
                    ))}
                    {module.published && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleEditModule(module)}
                  size="sm"
                  variant="outline"
                  className="gap-2 w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm"
                >
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Manage Access</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Lessons</p>
                    <p className="font-semibold text-sm sm:text-base">{module.totalLessons}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Total XP</p>
                    <p className="font-semibold text-sm sm:text-base">{module.totalXp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-sm sm:text-base">{module.estimatedHours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-sm sm:text-base truncate">{module.category}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-gray-600">
                Created: {formatDate(module.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Access Levels Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <span className="truncate">Manage Access: {selectedModule?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Control which subscription tiers can access each part of this module
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2 sm:pr-4">
            <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
              {/* Module-Level Access */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Module Access</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Default access levels for this module (can be overridden per lesson/quiz)
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {['free', 'basic', 'standard', 'premium'].map((level) => (
                    <div key={level} className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        id={`module-${level}`}
                        checked={editingAccessLevels.moduleAccessLevels.includes(level)}
                        onCheckedChange={() => toggleModuleAccessLevel(level)}
                        className="flex-shrink-0"
                      />
                      <Label htmlFor={`module-${level}`} className="cursor-pointer flex-shrink-0">
                        <Badge className={`${tierColors[level]} text-white text-xs sm:text-sm`}>
                          {tierLabels[level]}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lessons */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>Lessons ({selectedModule?.lessons.length || 0})</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyToAll('lessons', editingAccessLevels.moduleAccessLevels)}
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Apply Module Access to All
                  </Button>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {selectedModule?.lessons.map((lesson, index) => {
                    const lessonAccess = editingAccessLevels.lessonUpdates.get(lesson.id) || [];
                    return (
                      <AccordionItem key={lesson.id} value={lesson.id}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-2 sm:gap-3 w-full pr-2">
                            <span className="font-mono text-xs sm:text-sm text-gray-500 flex-shrink-0">
                              L{index + 1}
                            </span>
                            <span className="flex-1 text-left text-sm sm:text-base truncate pr-2">{lesson.title}</span>
                            <div className="flex gap-1 flex-shrink-0">
                              {lessonAccess.map((level) => (
                                <Badge
                                  key={level}
                                  className={`${tierColors[level]} text-white text-xs px-1`}
                                >
                                  {tierLabels[level][0]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 sm:pl-8 space-y-3 sm:space-y-4">
                            {/* Lesson Access */}
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                              {['free', 'basic', 'standard', 'premium'].map((level) => (
                                <div key={level} className="flex items-center gap-2 min-w-0">
                                  <Checkbox
                                    id={`lesson-${lesson.id}-${level}`}
                                    checked={lessonAccess.includes(level)}
                                    onCheckedChange={() =>
                                      toggleLessonAccessLevel(lesson.id, level)
                                    }
                                    className="flex-shrink-0"
                                  />
                                  <Label
                                    htmlFor={`lesson-${lesson.id}-${level}`}
                                    className="cursor-pointer flex-shrink-0"
                                  >
                                    <Badge className={`${tierColors[level]} text-white text-xs sm:text-sm`}>
                                      {tierLabels[level]}
                                    </Badge>
                                  </Label>
                                </div>
                              ))}
                            </div>

                            {/* Quizzes */}
                            {lesson.quiz.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                  <FileQuestion className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span>Quizzes ({lesson.quiz.length})</span>
                                </div>
                                {lesson.quiz.map((quiz, qIndex) => {
                                  const quizKey = `${lesson.id}-${quiz.id}`;
                                  const quizAccess =
                                    editingAccessLevels.quizUpdates.get(quizKey)
                                      ?.accessLevels || [];
                                  return (
                                    <div
                                      key={quiz.id}
                                      className="pl-3 sm:pl-4 border-l-2 border-gray-200 space-y-2"
                                    >
                                      <p className="text-xs sm:text-sm font-medium leading-tight">
                                        Q{qIndex + 1}: {quiz.question.slice(0, 40)}{quiz.question.length > 40 ? '...' : ''}
                                      </p>
                                      <div className="flex flex-wrap gap-2 sm:gap-4">
                                        {['free', 'basic', 'standard', 'premium'].map((level) => (
                                          <div key={level} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                            <Checkbox
                                              id={`quiz-${quizKey}-${level}`}
                                              checked={quizAccess.includes(level)}
                                              onCheckedChange={() =>
                                                toggleQuizAccessLevel(
                                                  lesson.id,
                                                  quiz.id,
                                                  level
                                                )
                                              }
                                              className="flex-shrink-0"
                                            />
                                            <Label
                                              htmlFor={`quiz-${quizKey}-${level}`}
                                              className="cursor-pointer flex-shrink-0"
                                            >
                                              <Badge
                                                className={`${tierColors[level]} text-white text-xs px-1.5`}
                                              >
                                                {tierLabels[level][0]}
                                              </Badge>
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAccessLevels} 
              disabled={isSaving}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

