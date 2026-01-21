import { useState, useRef } from 'react';
import { Scan, Upload, Loader2, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { backendService } from '@/lib/backend-service';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import LoginModal from './LoginModal';

export default function OCRConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canSendPrompt, incrementPromptCount, showLoginModal, setShowLoginModal } = usePromptLimit();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|jpg|jpeg|png|gif|webp)$/i)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PDF or image files (JPG, PNG, GIF, WEBP) only.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setExtractedText('');
  };

  const handleExtract = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to extract text from.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!canSendPrompt) {
      toast({
        title: 'Prompt limit reached',
        description: 'Please upgrade your plan or wait for your limit to reset.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setExtractedText('');

    try {
      const prompt = `Extract all text from this document/image. Provide the text in a clean, readable format. Preserve the structure and formatting as much as possible. If this is a legal document from South Sudan, maintain legal terminology and formatting.`;

      let fullResponse = '';
      for await (const chunk of backendService.streamChat(
        prompt,
        undefined,
        user.uid,
        [file]
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setExtractedText(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to extract text');
        }
      }

      incrementPromptCount();
      toast({
        title: 'Text extracted',
        description: 'Text has been successfully extracted from your document.',
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'Failed to extract text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!extractedText) return;

    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast({
        title: 'Text copied',
        description: 'Extracted text has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy text to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">OCR Text Converter</h1>
            <p className="text-gray-600">
              Convert images and PDFs into editable text. Extract text from scanned documents, photos, and PDF files.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Document or Image</CardTitle>
              <CardDescription>
                Select a PDF or image file to extract text from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Scan className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setExtractedText('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔵 Extract button clicked!', { file: !!file, isProcessing });
                      handleExtract();
                    }}
                    disabled={isProcessing}
                    className="w-full"
                    type="button"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting Text...
                      </>
                    ) : (
                      <>
                        <Scan className="mr-2 h-4 w-4" />
                        Extract Text
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
                    PDF, JPG, PNG, GIF, or WEBP (max 20MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {extractedText && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extracted Text</CardTitle>
                    <CardDescription>
                      Editable text extracted from your document
                    </CardDescription>
                  </div>
                  <Button onClick={handleCopy} variant="outline" size="sm">
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
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
