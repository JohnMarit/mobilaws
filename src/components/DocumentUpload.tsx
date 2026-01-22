import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { backendService } from '@/lib/backend-service';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { computeSidebarTaskTokens } from '@/lib/sidebar-tokens';
import LoginModal from './LoginModal';

export default function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { useTokensForSidebarTask, canAffordTokens, showLoginModal, setShowLoginModal } = usePromptLimit();
  const { userSubscription } = useSubscription();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
      return validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    });

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PDF, DOC, DOCX, TXT, or image files only.',
        variant: 'destructive',
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndSummarize = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const minTokens = 5;
    if (!canAffordTokens(minTokens)) {
      const planId = userSubscription?.planId?.toLowerCase() || 'free';
      const isPremium = planId === 'premium';
      let description = 'This task uses at least 5 tokens. Please upgrade or wait for your limit to reset.';
      if (isPremium) {
        description = 'Unable to send request. Please try again or contact support.';
      } else if (planId === 'free') {
        description = 'Please upgrade your plan to Basic, Standard, or Premium for more tokens.';
      } else if (planId === 'basic' || planId === 'standard') {
        description = 'You have reached your token limit. Upgrade to Premium for unlimited tokens or wait for your tokens to reset.';
      }
      toast({ title: 'Not enough tokens', description, variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setSummary('');

    try {
      const prompt = `Please analyze and summarize the following legal document(s) from South Sudan. Provide:
1. Document type and purpose
2. Key legal points and provisions
3. Important dates, parties, and terms
4. Legal implications and requirements
5. Any relevant South Sudan legal context

Document(s) to analyze:`;

      let fullResponse = '';
      for await (const chunk of backendService.streamChat(
        prompt,
        undefined,
        user.id,
        files
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setSummary(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to process document');
        }
      }

      const tokens = computeSidebarTaskTokens(fullResponse.length);
      const ok = await useTokensForSidebarTask(tokens);
      if (!ok) {
        toast({ title: 'Token deduction failed', description: 'Document processed but we could not deduct tokens. You may need more tokens for this length.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Document processed', description: 'Your document has been analyzed and summarized successfully.' });
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Upload & Summary</h1>
            <p className="text-gray-600">
              Upload legal documents and get AI-powered summaries. Supports PDF, DOC, DOCX, TXT, and images.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Select one or more legal documents to analyze and summarize
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOC, DOCX, TXT, or images (max 20MB per file)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔵 Upload button clicked!', { files: files.length, isProcessing });
                  handleUploadAndSummarize();
                }}
                disabled={isProcessing || files.length === 0}
                className="w-full"
                type="button"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Documents...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Summarize
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>Document Summary</CardTitle>
                <CardDescription>
                  AI-generated summary and analysis of your uploaded document(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800">
                    {summary}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}
