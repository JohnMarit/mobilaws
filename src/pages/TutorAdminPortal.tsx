import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorAdmin } from '@/contexts/TutorAdminContext';
import { getApiUrl } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  BookOpen,
  MessageSquare,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  GraduationCap,
  Sparkles,
  Send,
  Eye,
  Edit,
  Trash2,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import ModuleManager from '@/components/admin/ModuleManager';

interface UploadedContent {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  accessLevels: string[];
  category: string;
  status: 'processing' | 'ready' | 'failed';
  uploadedAt: any;
  generatedModuleId?: string;
  published?: boolean;
}

interface TutorMessage {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: any;
  moduleId?: string;
  replies?: { from: string; message: string; timestamp: any }[];
}

interface QuizRequest {
  id: string;
  userName: string;
  userEmail: string;
  moduleId: string;
  message: string;
  numberOfQuizzes: number;
  difficulty: string;
  status: string;
  createdAt: any;
}

export default function TutorAdminPortal() {
  const navigate = useNavigate();
  const { isTutorAdmin, tutor, isLoading } = useTutorAdmin();
  
  const [uploadedContent, setUploadedContent] = useState<UploadedContent[]>([]);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [quizRequests, setQuizRequests] = useState<QuizRequest[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  
  // Upload form state
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [accessLevels, setAccessLevels] = useState<string[]>(['free']);

  // Edit dialog state
  const [editingContent, setEditingContent] = useState<UploadedContent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editAccessLevels, setEditAccessLevels] = useState<string[]>(['free']);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [deletingContent, setDeletingContent] = useState<UploadedContent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isTutorAdmin) {
      console.error('═══════════════════════════════════════════════');
      console.error('❌ ACCESS DENIED TO TUTOR ADMIN PORTAL');
      console.error('═══════════════════════════════════════════════');
      console.error('User is trying to access /tutor-admin but is not authorized.');
      console.error('');
      console.error('TO FIX THIS:');
      console.error('1. Open check-tutor-status.html to diagnose the issue');
      console.error('2. Verify your tutor admin account exists');
      console.error('3. Make sure you\'re signed in with the correct Google account');
      console.error('4. Sign out and sign in again');
      console.error('5. Check browser console for detailed error messages');
      console.error('═══════════════════════════════════════════════');
      
      toast.error('Access denied. Tutor admin privileges required. Check browser console for details (F12).');
      
      // Redirect after 3 seconds to give user time to see the message
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [isTutorAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isTutorAdmin && tutor) {
      loadTutorData();
    }
  }, [isTutorAdmin, tutor]);

  const loadTutorData = async () => {
    if (!tutor) {
      console.warn('⚠️ No tutor object available');
      return;
    }

    try {
      console.log('═══════════════════════════════════════════════');
      console.log('📥 LOADING TUTOR DATA');
      console.log('═══════════════════════════════════════════════');
      console.log('👤 Tutor object:', JSON.stringify(tutor, null, 2));
      console.log('🆔 Tutor ID:', tutor.id);
      console.log('📧 Tutor email:', tutor.email);
      
      if (!tutor.id) {
        console.error('❌ CRITICAL: tutor.id is undefined!');
        console.error('This will cause API calls to fail.');
        toast.error('Tutor ID is missing. Please contact support.');
        return;
      }
      
      console.log('✅ Tutor ID is valid, proceeding with data load...');
      
      // Load uploaded content
      const contentRes = await fetch(getApiUrl(`tutor-admin/content/${tutor.id}`));
      const contentData = await contentRes.json();
      console.log('📦 Content response:', contentData);
      
      // Validate it's an array before setting
      if (Array.isArray(contentData)) {
        setUploadedContent(contentData);
      } else {
        console.error('❌ Content data is not an array:', contentData);
        setUploadedContent([]);
        if (contentData?.error) {
          toast.error(`Failed to load content: ${contentData.error}`);
        }
      }

      // Load messages
      const messagesRes = await fetch(getApiUrl(`tutor-admin/messages/${tutor.id}`));
      const messagesData = await messagesRes.json();
      console.log('💬 Messages response:', messagesData);
      
      // Validate it's an array before setting
      if (Array.isArray(messagesData)) {
        setMessages(messagesData);
      } else {
        console.error('❌ Messages data is not an array:', messagesData);
        setMessages([]);
        if (messagesData?.error) {
          toast.error(`Failed to load messages: ${messagesData.error}`);
        }
      }

      // Load quiz requests
      const quizRes = await fetch(getApiUrl('tutor-admin/quiz-requests'));
      const quizData = await quizRes.json();
      console.log('📝 Quiz requests response:', quizData);
      
      // Validate it's an array before setting
      if (Array.isArray(quizData)) {
        setQuizRequests(quizData);
      } else {
        console.error('❌ Quiz data is not an array:', quizData);
        setQuizRequests([]);
        if (quizData?.error) {
          toast.error(`Failed to load quiz requests: ${quizData.error}`);
        }
      }
      
      console.log('✅ Tutor data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load tutor data:', error);
      toast.error('Failed to load tutor data. Check console for details.');
      // Ensure state is set to empty arrays to prevent .map() errors
      setUploadedContent([]);
      setMessages([]);
      setQuizRequests([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, TXT, DOC, or DOCX files.');
        return;
      }

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 100MB.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !tutor) {
      toast.error('Please fill in all required fields and select a file.');
      return;
    }

    if (accessLevels.length === 0) {
      toast.error('Please select at least one access level.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tutorId', tutor.id);
      formData.append('tutorName', tutor.name);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('accessLevels', JSON.stringify(accessLevels));
      formData.append('category', category);

      const response = await fetch(getApiUrl('tutor-admin/upload'), {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🎉 Document uploaded! AI is generating learning content...', {
          description: 'This may take 1-2 minutes. You can check the status in the My Content tab.',
        });

        // Reset form
        setSelectedFile(null);
        setTitle('');
        setDescription('');
        setCategory('general');
        setAccessLevels(['free']);

        // Reload content
        loadTutorData();
      } else {
        toast.error('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleAccessLevel = (level: string) => {
    setAccessLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const handlePublishModule = async (contentId: string, moduleId: string) => {
    try {
      const response = await fetch(getApiUrl(`tutor-admin/modules/${moduleId}/publish`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Module published successfully! Users can now see this course.');
        loadTutorData();
      } else {
        toast.error('Failed to publish module');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish module');
    }
  };

  const handleEditClick = (content: UploadedContent) => {
    setEditingContent(content);
    setEditTitle(content.title);
    setEditDescription(content.description);
    setEditCategory(content.category);
    setEditAccessLevels(content.accessLevels);
    setEditFile(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingContent || !editTitle || !tutor) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (editAccessLevels.length === 0) {
      toast.error('Please select at least one access level.');
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('category', editCategory);
      formData.append('accessLevels', JSON.stringify(editAccessLevels));
      formData.append('tutorId', tutor.id);
      formData.append('tutorName', tutor.name);
      
      // Only append file if a new one was selected
      if (editFile) {
        formData.append('file', editFile);
      }

      const response = await fetch(getApiUrl(`tutor-admin/content/${editingContent.id}`), {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.moduleUpdated 
          ? '✅ Content and module updated successfully! AI is regenerating the course...'
          : '✅ Content metadata updated successfully!'
        );
        setIsEditDialogOpen(false);
        setEditingContent(null);
        loadTutorData();
      } else {
        toast.error('Failed to update content: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update content. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (content: UploadedContent) => {
    setDeletingContent(content);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContent) return;

    setIsDeleting(true);

    try {
      const response = await fetch(getApiUrl(`tutor-admin/content/${deletingContent.id}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Content and all associated course material deleted successfully!');
        setIsDeleteDialogOpen(false);
        setDeletingContent(null);
        loadTutorData();
      } else {
        toast.error('Failed to delete content: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete content. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await fetch(getApiUrl(`tutor-admin/messages/${messageId}/status`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      });

      loadTutorData();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading tutor portal...</p>
        </div>
      </div>
    );
  }

  if (!isTutorAdmin || !tutor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Tutor Admin Portal
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Create & Manage Learning Content</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{tutor.name}</p>
                <p className="text-xs text-gray-600">{tutor.email}</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/')} size="sm">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit Portal</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Content</CardDescription>
              <CardTitle className="text-3xl">{uploadedContent.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Documents uploaded</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ready Modules</CardDescription>
              <CardTitle className="text-3xl">
                {uploadedContent.filter(c => c.status === 'ready').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>AI generated</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unread Messages</CardDescription>
              <CardTitle className="text-3xl">
                {messages.filter(m => m.status === 'unread').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <MessageSquare className="h-4 w-4" />
                <span>From learners</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Quiz Requests</CardDescription>
              <CardTitle className="text-3xl">{quizRequests.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <Sparkles className="h-4 w-4" />
                <span>Pending</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Content
            </TabsTrigger>
            <TabsTrigger value="content">
              <BookOpen className="h-4 w-4 mr-2" />
              My Content
            </TabsTrigger>
            <TabsTrigger value="modules">
              <Settings className="h-4 w-4 mr-2" />
              Manage Modules
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages ({messages.filter(m => m.status === 'unread').length})
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              <Sparkles className="h-4 w-4 mr-2" />
              Quiz Requests
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Learning Material
                </CardTitle>
                <CardDescription>
                  Upload documents and AI will generate Duolingo-style learning content automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="file">Document File *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handleFileSelect}
                        className="flex-1"
                      />
                      {selectedFile && (
                        <Badge variant="secondary">
                          {formatFileSize(selectedFile.size)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, TXT, DOC, DOCX (Max 100MB)
                    </p>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Module Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Introduction to Constitutional Law"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of what learners will learn..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="general">General</option>
                      <option value="constitutional-law">Constitutional Law</option>
                      <option value="international-law">International Law</option>
                      <option value="criminal-law">Criminal Law</option>
                      <option value="public-law">Public Law</option>
                      <option value="civil-law">Civil Law</option>
                      <option value="commercial-law">Commercial Law</option>
                    </select>
                  </div>

                  {/* Access Levels */}
                  <div className="space-y-3">
                    <Label>Access Levels * (Select at least one)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {['free', 'basic', 'standard', 'premium'].map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            id={level}
                            checked={accessLevels.includes(level)}
                            onCheckedChange={() => toggleAccessLevel(level)}
                          />
                          <Label
                            htmlFor={level}
                            className="text-sm font-normal cursor-pointer capitalize"
                          >
                            {level} tier
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select which subscription tiers can access this content
                    </p>
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile || !title}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Uploading & Generating Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Upload & Generate Learning Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>My Uploaded Content</CardTitle>
                <CardDescription>
                  Manage your uploaded documents and AI-generated modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {uploadedContent.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No content uploaded yet</p>
                        <p className="text-sm">Upload your first document to get started!</p>
                      </div>
                    ) : (
                      uploadedContent.map((content) => (
                        <Card key={content.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{content.title}</h3>
                                {content.status === 'ready' && (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Ready
                                  </Badge>
                                )}
                                {content.status === 'processing' && (
                                  <Badge variant="secondary">
                                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                                    Processing
                                  </Badge>
                                )}
                                {content.status === 'failed' && (
                                  <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                                {content.published && (
                                  <Badge variant="default" className="bg-blue-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Published
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{content.description}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>📄 {content.fileName}</span>
                                <span>• {formatFileSize(content.fileSize)}</span>
                                <span>• 📂 {content.category}</span>
                                <span>• 🗓️ {formatDate(content.uploadedAt)}</span>
                              </div>
                              <div className="flex gap-1 mt-2">
                                {content.accessLevels.map((level) => (
                                  <Badge key={level} variant="outline" className="text-xs capitalize">
                                    {level}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(content)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClick(content)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {content.status === 'ready' && content.generatedModuleId && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // TODO: Preview module
                                      toast.info('Module preview coming soon!');
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handlePublishModule(content.id, content.generatedModuleId!)}
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    Publish
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Modules Tab */}
          <TabsContent value="modules">
            {tutor && <ModuleManager tutorId={tutor.id} tutorName={tutor.name} />}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Learner Messages</CardTitle>
                <CardDescription>
                  Questions and messages from learners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <Card 
                          key={message.id} 
                          className={`p-4 ${message.status === 'unread' ? 'border-primary' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{message.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                From: {message.userName} ({message.userEmail})
                              </p>
                            </div>
                            <Badge variant={message.status === 'unread' ? 'default' : 'secondary'}>
                              {message.status}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{message.message}</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {formatDate(message.createdAt)}
                          </p>
                          {message.status === 'unread' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkAsRead(message.id)}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Requests Tab */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Requests</CardTitle>
                <CardDescription>
                  Learners requesting additional practice quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {quizRequests.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No quiz requests yet</p>
                      </div>
                    ) : (
                      quizRequests.map((request) => (
                        <Card key={request.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {request.numberOfQuizzes} {request.difficulty} quiz(zes)
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                From: {request.userName} ({request.userEmail})
                              </p>
                            </div>
                            <Badge>{request.status}</Badge>
                          </div>
                          <p className="text-sm mb-2">{request.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(request.createdAt)}
                          </p>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
              Update the content details. Upload a new file to regenerate the entire course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter content title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter content description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="e.g., constitutional-law"
              />
            </div>
            <div className="space-y-2">
              <Label>Access Levels *</Label>
              <div className="flex gap-2 flex-wrap">
                {['free', 'basic', 'standard', 'premium'].map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${level}`}
                      checked={editAccessLevels.includes(level)}
                      onCheckedChange={() => {
                        setEditAccessLevels(prev =>
                          prev.includes(level)
                            ? prev.filter(l => l !== level)
                            : [...prev, level]
                        );
                      }}
                    />
                    <Label htmlFor={`edit-${level}`} className="text-sm font-normal capitalize">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-file">New File (Optional)</Label>
              <Input
                id="edit-file"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload a new file to regenerate the entire course with updated content
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingContent(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the content "{deletingContent?.title}" and all associated course material, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The uploaded document</li>
                <li>All generated lessons</li>
                <li>All quizzes and assessments</li>
                <li>All module data</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

