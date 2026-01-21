import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { backendService } from '@/lib/backend-service';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';

export default function DocumentDrafting() {
  const [documentType, setDocumentType] = useState<string>('');
  const [requirements, setRequirements] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { canSendPrompt, incrementPromptCount, showLoginModal, setShowLoginModal } = usePromptLimit();

  const documentTypes = [
    { value: 'contract', label: 'Contract' },
    { value: 'letter', label: 'Legal Letter' },
    { value: 'notice', label: 'Legal Notice' },
    { value: 'agreement', label: 'Agreement' },
    { value: 'memo', label: 'Legal Memorandum' },
    { value: 'petition', label: 'Petition' },
    { value: 'affidavit', label: 'Affidavit' },
  ];

  const handleGenerate = async () => {
    if (!documentType) {
      toast({
        title: 'Document type required',
        description: 'Please select a document type.',
        variant: 'destructive',
      });
      return;
    }

    if (!requirements.trim()) {
      toast({
        title: 'Requirements required',
        description: 'Please provide details about what you need in the document.',
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

    setIsGenerating(true);
    setGeneratedDocument('');

    try {
      const prompt = `Generate a South Sudan legal ${documentTypes.find(d => d.value === documentType)?.label.toLowerCase()} document based on the following requirements:

${requirements}

Please provide a complete, professionally formatted legal document that complies with South Sudan laws and legal practices. Include all necessary sections, clauses, and legal language appropriate for South Sudan jurisdiction.`;

      let fullResponse = '';
      for await (const chunk of backendService.streamChat(
        prompt,
        undefined,
        user.uid
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setGeneratedDocument(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to generate document');
        }
      }

      incrementPromptCount();
      toast({
        title: 'Document generated',
        description: 'Your legal document has been generated successfully.',
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedDocument) return;

    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `south-sudan-${documentType}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Document downloaded',
      description: 'Your document has been downloaded.',
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Drafting</h1>
            <p className="text-gray-600">
              Generate professional legal documents for South Sudan. Create contracts, letters, notices, and more.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>
                Select the type of document and provide your requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements & Details</Label>
                <Textarea
                  id="requirements"
                  placeholder="Describe what you need in the document. Include parties involved, key terms, dates, amounts, and any specific clauses or requirements..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500">
                  Be as detailed as possible for better results. Include names, dates, amounts, and specific legal requirements.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !documentType || !requirements.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Document...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedDocument && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Document</CardTitle>
                    <CardDescription>
                      Review and download your generated legal document
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                    {generatedDocument}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
