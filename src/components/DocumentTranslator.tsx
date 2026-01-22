import { useState, useRef } from 'react';
import { Languages, Upload, Loader2, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { backendService } from '@/lib/backend-service';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { computeSidebarTaskTokens } from '@/lib/sidebar-tokens';
import LoginModal from './LoginModal';

export default function DocumentTranslator() {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('english');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [useFile, setUseFile] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { useTokensForSidebarTask, canAffordTokens, showLoginModal, setShowLoginModal } = usePromptLimit();
  const { userSubscription } = useSubscription();

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'dinka', label: 'Dinka' },
    { value: 'nuer', label: 'Nuer' },
    { value: 'bari', label: 'Bari' },
    { value: 'zande', label: 'Zande' },
    { value: 'shilluk', label: 'Shilluk' },
  ];

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

    setFile(selectedFile);
    setTextInput('');
  };

  const handleTranslate = async () => {
    if (useFile && !file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to translate.',
        variant: 'destructive',
      });
      return;
    }

    if (!useFile && !textInput.trim()) {
      toast({
        title: 'No text entered',
        description: 'Please enter text to translate.',
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

    setIsTranslating(true);
    setTranslatedText('');

    try {
      const targetLangName = languages.find(l => l.value === targetLanguage)?.label || targetLanguage;
      const sourceLangName = sourceLanguage === 'auto' 
        ? 'automatically detected' 
        : languages.find(l => l.value === sourceLanguage)?.label || sourceLanguage;

      const prompt = useFile
        ? `Translate this legal document from ${sourceLangName} to ${targetLangName}. Maintain legal terminology, formatting, and structure. This is a South Sudan legal document, so preserve legal context and terminology appropriately.`
        : `Translate the following legal text from ${sourceLangName} to ${targetLangName}. Maintain legal terminology and formatting. This is South Sudan legal content, so preserve legal context appropriately:\n\n${textInput}`;

      let fullResponse = '';
      const filesToSend = useFile && file ? [file] : undefined;
      
      for await (const chunk of backendService.streamChat(
        prompt,
        undefined,
        user.uid,
        filesToSend
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setTranslatedText(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to translate document');
        }
      }

      const tokens = computeSidebarTaskTokens(fullResponse.length);
      const ok = await useTokensForSidebarTask(tokens);
      if (!ok) {
        toast({ title: 'Token deduction failed', description: 'Translation completed but we could not deduct tokens. You may need more tokens for this length.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Translation completed', description: 'Your document has been translated successfully.' });
    } catch (error) {
      console.error('Error translating document:', error);
      toast({
        title: 'Translation failed',
        description: error instanceof Error ? error.message : 'Failed to translate document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = () => {
    if (!translatedText) return;

    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated-document-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Translation downloaded',
      description: 'Your translated document has been downloaded.',
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Translator</h1>
            <p className="text-gray-600">
              Translate legal documents between English, Arabic, and South Sudan languages. Maintains legal terminology and context.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
              <CardDescription>
                Select source and target languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source-language">Source Language</Label>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger id="source-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-language">Target Language</Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger id="target-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document or Text to Translate</CardTitle>
              <CardDescription>
                Upload a document or paste text to translate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={useFile ? 'default' : 'outline'}
                  onClick={() => setUseFile(true)}
                  size="sm"
                >
                  Upload File
                </Button>
                <Button
                  variant={!useFile ? 'default' : 'outline'}
                  onClick={() => setUseFile(false)}
                  size="sm"
                >
                  Paste Text
                </Button>
              </div>

              {useFile ? (
                file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Languages className="h-6 w-6 text-gray-400" />
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
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, or TXT (max 20MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )
              ) : (
                <Textarea
                  placeholder="Paste or type the text you want to translate..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              )}

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔵 Translate button clicked!', { useFile, file: !!file, textInput: textInput.length, isTranslating });
                  handleTranslate();
                }}
                disabled={isTranslating || (useFile && !file) || (!useFile && !textInput.trim())}
                className="w-full"
                type="button"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="mr-2 h-4 w-4" />
                    Translate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {translatedText && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Translated Document</CardTitle>
                    <CardDescription>
                      Translation in {languages.find(l => l.value === targetLanguage)?.label}
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
                    {translatedText}
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
