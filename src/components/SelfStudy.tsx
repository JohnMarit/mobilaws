import { useState, useRef, useEffect } from 'react';
import { Upload, BookOpen, Loader2, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { backendService } from '@/lib/backend-service';
import { getApiUrl } from '@/lib/api';
import { useLearning } from '@/contexts/LearningContext';
import LoginModal from './LoginModal';

interface SelfStudyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelfStudyModule {
  id: string;
  name: string;
  description: string;
  uploadedAt: string;
  lessonCount: number;
  generatedLessonsToday: number;
  dailyLimit: number;
}

export default function SelfStudy({ open, onOpenChange }: SelfStudyProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modules, setModules] = useState<SelfStudyModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<SelfStudyModule | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'simple' | 'medium' | 'hard'>('medium');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const { reloadModules } = useLearning();

  // Get daily lesson generation limits based on tier
  const getDailyLimit = (): number => {
    const tier = userSubscription?.planId?.toLowerCase() || 'free';
    if (tier === 'premium') return Infinity;
    if (tier === 'standard') return 20;
    if (tier === 'basic') return 10;
    return 5; // free
  };

  const dailyLimit = getDailyLimit();

  useEffect(() => {
    if (open && user) {
      fetchSelfStudyModules();
    }
  }, [open, user]);

  const fetchSelfStudyModules = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      if (!token) {
        console.error('Failed to get auth token');
        return;
      }

      const response = await fetch(getApiUrl('self-study/modules'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error fetching self-study modules:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PDF, DOC, DOCX, or TXT files only.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a document to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsUploading(true);

    try {
      const token = await user.getIdToken();
      if (!token) {
        toast({
          title: 'Authentication error',
          description: 'Please sign in to upload documents.',
          variant: 'destructive',
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.uid);
      formData.append('userName', user.displayName || 'User');
      formData.append('userEmail', user.email || '');

      const response = await fetch(getApiUrl('self-study/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Document uploaded',
        description: 'Your document has been processed and is ready for lesson generation.',
      });

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchSelfStudyModules();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateLessons = async () => {
    if (!selectedModule) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Check daily limit
    if (dailyLimit !== Infinity && selectedModule.generatedLessonsToday >= dailyLimit) {
      const tier = userSubscription?.planId?.toLowerCase() || 'free';
      const upgradeMessages: Record<string, string> = {
        free: 'You have reached your daily limit of 5 lessons. Upgrade to Basic for 10 lessons per day!',
        basic: 'You have reached your daily limit of 10 lessons. Upgrade to Standard for 20 lessons per day!',
        standard: 'You have reached your daily limit of 20 lessons. Upgrade to Premium for unlimited lessons!',
      };
      
      toast({
        title: 'Daily limit reached',
        description: upgradeMessages[tier] || 'Daily limit reached. Please try again tomorrow.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const token = await user.getIdToken();
      if (!token) {
        toast({
          title: 'Authentication error',
          description: 'Please sign in to generate lessons.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(getApiUrl('self-study/generate-lessons'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleId: selectedModule.id,
          moduleName: selectedModule.name,
          difficulty: selectedDifficulty,
          numberOfLessons: 5,
          userId: user.uid,
          tier: userSubscription?.planId?.toLowerCase() || 'free',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate lessons');
      }

      const data = await response.json();
      
      toast({
        title: 'Lessons generated',
        description: `${data.lessonsGenerated || data.lessons?.length || 5} lessons have been generated successfully!`,
      });

      setSelectedModule(null);
      await fetchSelfStudyModules();
      await reloadModules(); // Refresh the learning hub
    } catch (error) {
      console.error('Error generating lessons:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate lessons. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getLimitDisplay = () => {
    if (dailyLimit === Infinity) return 'Unlimited';
    const used = selectedModule?.generatedLessonsToday || 0;
    return `${used}/${dailyLimit}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Self Study
            </DialogTitle>
            <DialogDescription>
              Upload your own legal documents and generate personalized lessons. Learn at your own pace with AI-generated content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Daily Limit Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Daily Lesson Generation Limit</p>
                    <p className="text-xs text-blue-700 mt-1">
                      {dailyLimit === Infinity 
                        ? 'Premium: Unlimited lessons' 
                        : `Free: 5 | Basic: 10 | Standard: 20 | Premium: Unlimited`}
                    </p>
                  </div>
                  {selectedModule && dailyLimit !== Infinity && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">{getLimitDisplay()}</p>
                      <p className="text-xs text-blue-700">lessons today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                  Upload a PDF, DOC, DOCX, or TXT file to create your self-study module
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Process Document
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, or TXT (max 50MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Self-Study Modules */}
            {modules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>My Self-Study Modules</CardTitle>
                  <CardDescription>
                    Generate lessons from your uploaded documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{module.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {module.lessonCount} lessons • Uploaded {new Date(module.uploadedAt).toLocaleDateString()}
                          </p>
                          {dailyLimit !== Infinity && (
                            <p className="text-xs text-gray-400 mt-1">
                              Generated today: {module.generatedLessonsToday}/{dailyLimit}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => setSelectedModule(module)}
                          disabled={dailyLimit !== Infinity && module.generatedLessonsToday >= dailyLimit}
                          size="sm"
                        >
                          Generate Lessons
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Lessons Dialog */}
            {selectedModule && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle>Generate Lessons</CardTitle>
                  <CardDescription>
                    Choose difficulty level for {selectedModule.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Select Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setSelectedDifficulty('simple')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedDifficulty === 'simple'
                            ? 'border-blue-400 bg-blue-50 shadow-lg'
                            : 'border-blue-100 hover:border-blue-200 bg-white'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            selectedDifficulty === 'simple' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            Easy
                          </div>
                          <div className="font-semibold text-gray-900 text-sm">Easy</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedDifficulty('medium')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedDifficulty === 'medium'
                            ? 'border-blue-500 bg-blue-100 shadow-lg'
                            : 'border-blue-100 hover:border-blue-200 bg-white'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            selectedDifficulty === 'medium' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            Med
                          </div>
                          <div className="font-semibold text-gray-900 text-sm">Intermediate</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setSelectedDifficulty('hard')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedDifficulty === 'hard'
                            ? 'border-blue-600 bg-blue-50 shadow-lg'
                            : 'border-blue-100 hover:border-blue-200 bg-white'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            selectedDifficulty === 'hard' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            Hard
                          </div>
                          <div className="font-semibold text-gray-900 text-sm">Advanced</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700">
                      <strong>What you'll get:</strong> 5 new AI-generated lessons based on your document at{' '}
                      {selectedDifficulty === 'simple' && 'beginner level with guided conversations.'}
                      {selectedDifficulty === 'medium' && 'intermediate level with interactive case scenarios.'}
                      {selectedDifficulty === 'hard' && 'advanced level with complex legal analysis.'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedModule(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                      onClick={handleGenerateLessons}
                      disabled={isGenerating || (dailyLimit !== Infinity && selectedModule.generatedLessonsToday >= dailyLimit)}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Generate 5 Lessons
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
