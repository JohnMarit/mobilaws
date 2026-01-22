import { useState, useRef } from 'react';
import { GitCompare, Upload, Loader2, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { backendService } from '@/lib/backend-service';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import LoginModal from './LoginModal';

export default function ContractComparison() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState<string>('');
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canSendPrompt, incrementPromptCount, showLoginModal, setShowLoginModal } = usePromptLimit();
  const { userSubscription } = useSubscription();

  const handleFileSelect = (fileNumber: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PDF, DOC, DOCX, or TXT files only.',
        variant: 'destructive',
      });
      return;
    }

    if (fileNumber === 1) {
      setFile1(file);
    } else {
      setFile2(file);
    }
  };

  const handleCompare = async () => {
    if (!file1 || !file2) {
      toast({
        title: 'Both files required',
        description: 'Please upload both contracts to compare.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!canSendPrompt) {
      const planId = userSubscription?.planId?.toLowerCase() || 'free';
      const isPremium = planId === 'premium';
      
      let description = 'Please upgrade your plan or wait for your limit to reset.';
      if (isPremium) {
        description = 'Unable to send request. Please try again or contact support.';
      } else if (planId === 'free') {
        description = 'Please upgrade your plan to Basic, Standard, or Premium for more tokens.';
      } else if (planId === 'basic' || planId === 'standard') {
        description = 'You have reached your token limit. Upgrade to Premium for unlimited tokens or wait for your tokens to reset.';
      }
      
      toast({
        title: 'Prompt limit reached',
        description,
        variant: 'destructive',
      });
      return;
    }

    setIsComparing(true);
    setComparison('');

    try {
      const prompt = `Compare these two South Sudan legal contracts/documents and provide a detailed analysis highlighting:
1. Key differences in terms and conditions
2. Differences in legal language and clauses
3. Missing or additional provisions in each document
4. Potential legal implications of the differences
5. Recommendations for which version might be more favorable

Please provide a side-by-side comparison with clear sections for each difference.`;

      let fullResponse = '';
      for await (const chunk of backendService.streamChat(
        prompt,
        undefined,
        user.uid,
        [file1, file2]
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setComparison(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to compare contracts');
        }
      }

      incrementPromptCount();
      toast({
        title: 'Comparison completed',
        description: 'The contracts have been compared successfully.',
      });
    } catch (error) {
      console.error('Error comparing contracts:', error);
      toast({
        title: 'Comparison failed',
        description: error instanceof Error ? error.message : 'Failed to compare contracts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleDownload = () => {
    if (!comparison) return;

    const blob = new Blob([comparison], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-comparison-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Comparison downloaded',
      description: 'Your comparison report has been downloaded.',
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Comparison</h1>
            <p className="text-gray-600">
              Compare two contracts or legal documents side-by-side. Identify differences, missing clauses, and legal implications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Contract 1</CardTitle>
                <CardDescription>Upload the first contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {file1 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <GitCompare className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file1.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file1.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile1(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => file1InputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload</p>
                    <input
                      ref={file1InputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect(1)}
                      className="hidden"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract 2</CardTitle>
                <CardDescription>Upload the second contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {file2 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <GitCompare className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file2.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file2.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile2(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => file2InputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload</p>
                    <input
                      ref={file2InputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect(2)}
                      className="hidden"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔵 Compare button clicked!', { file1: !!file1, file2: !!file2, isComparing });
              handleCompare();
            }}
            disabled={isComparing || !file1 || !file2}
            className="w-full"
            size="lg"
            type="button"
          >
            {isComparing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing Contracts...
              </>
            ) : (
              <>
                <GitCompare className="mr-2 h-4 w-4" />
                Compare Contracts
              </>
            )}
          </Button>

          {comparison && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Comparison Results</CardTitle>
                    <CardDescription>
                      Detailed analysis of differences between the two contracts
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800">
                    {comparison}
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
