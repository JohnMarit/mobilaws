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
    try {
      const response = await fetch(getApiUrl(`tutor-admin/modules/tutor/${tutorId}`));
      const data = await response.json();
      setModules(data || []);
    } catch (error) {
      console.error('Failed to load modules:', error);
      toast.error('Failed to load modules');
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Modules</h2>
          <p className="text-gray-600">Manage access levels for your learning content</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {modules.length} Module{modules.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {modules.map((module) => (
          <Card key={module.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{module.icon}</span>
                    <div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {module.accessLevels.map((level) => (
                      <Badge key={level} className={`${tierColors[level]} text-white`}>
                        {tierLabels[level]}
                      </Badge>
                    ))}
                    {module.published && (
                      <Badge className="bg-green-500 text-white">
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
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Manage Access
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Lessons</p>
                    <p className="font-semibold">{module.totalLessons}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total XP</p>
                    <p className="font-semibold">{module.totalXp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{module.estimatedHours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold">{module.category}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Created: {formatDate(module.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Access Levels Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Manage Access Levels: {selectedModule?.title}
            </DialogTitle>
            <DialogDescription>
              Control which subscription tiers can access each part of this module
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Module-Level Access */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Module Access
                </h3>
                <p className="text-sm text-gray-600">
                  Default access levels for this module (can be overridden per lesson/quiz)
                </p>
                <div className="flex gap-4">
                  {['free', 'basic', 'standard', 'premium'].map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={`module-${level}`}
                        checked={editingAccessLevels.moduleAccessLevels.includes(level)}
                        onCheckedChange={() => toggleModuleAccessLevel(level)}
                      />
                      <Label htmlFor={`module-${level}`} className="cursor-pointer">
                        <Badge className={`${tierColors[level]} text-white`}>
                          {tierLabels[level]}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lessons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Lessons ({selectedModule?.lessons.length || 0})
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyToAll('lessons', editingAccessLevels.moduleAccessLevels)}
                  >
                    Apply Module Access to All
                  </Button>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {selectedModule?.lessons.map((lesson, index) => {
                    const lessonAccess = editingAccessLevels.lessonUpdates.get(lesson.id) || [];
                    return (
                      <AccordionItem key={lesson.id} value={lesson.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 w-full">
                            <span className="font-mono text-sm text-gray-500">
                              L{index + 1}
                            </span>
                            <span className="flex-1 text-left">{lesson.title}</span>
                            <div className="flex gap-1">
                              {lessonAccess.map((level) => (
                                <Badge
                                  key={level}
                                  className={`${tierColors[level]} text-white text-xs`}
                                >
                                  {tierLabels[level][0]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-8 space-y-4">
                            {/* Lesson Access */}
                            <div className="flex gap-4">
                              {['free', 'basic', 'standard', 'premium'].map((level) => (
                                <div key={level} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`lesson-${lesson.id}-${level}`}
                                    checked={lessonAccess.includes(level)}
                                    onCheckedChange={() =>
                                      toggleLessonAccessLevel(lesson.id, level)
                                    }
                                  />
                                  <Label
                                    htmlFor={`lesson-${lesson.id}-${level}`}
                                    className="cursor-pointer"
                                  >
                                    <Badge className={`${tierColors[level]} text-white`}>
                                      {tierLabels[level]}
                                    </Badge>
                                  </Label>
                                </div>
                              ))}
                            </div>

                            {/* Quizzes */}
                            {lesson.quiz.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <FileQuestion className="h-4 w-4" />
                                  Quizzes ({lesson.quiz.length})
                                </div>
                                {lesson.quiz.map((quiz, qIndex) => {
                                  const quizKey = `${lesson.id}-${quiz.id}`;
                                  const quizAccess =
                                    editingAccessLevels.quizUpdates.get(quizKey)
                                      ?.accessLevels || [];
                                  return (
                                    <div
                                      key={quiz.id}
                                      className="pl-4 border-l-2 border-gray-200 space-y-2"
                                    >
                                      <p className="text-sm font-medium">
                                        Q{qIndex + 1}: {quiz.question.slice(0, 50)}...
                                      </p>
                                      <div className="flex gap-4">
                                        {['free', 'basic', 'standard', 'premium'].map((level) => (
                                          <div key={level} className="flex items-center gap-2">
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
                                            />
                                            <Label
                                              htmlFor={`quiz-${quizKey}-${level}`}
                                              className="cursor-pointer"
                                            >
                                              <Badge
                                                className={`${tierColors[level]} text-white text-xs`}
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveAccessLevels} disabled={isSaving}>
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

