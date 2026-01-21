import { useState } from 'react';
import { FileCode, Loader2, Download, Copy, Check } from 'lucide-react';
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

export default function TemplateGenerator() {
  const [templateType, setTemplateType] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canSendPrompt, incrementPromptCount, showLoginModal, setShowLoginModal } = usePromptLimit();

  const templateTypes = [
    { value: 'contract', label: 'Contract Template' },
    { value: 'clause', label: 'Legal Clause' },
    { value: 'letter', label: 'Legal Letter Template' },
    { value: 'notice', label: 'Legal Notice Template' },
    { value: 'agreement', label: 'Agreement Template' },
    { value: 'memo', label: 'Legal Memorandum Template' },
    { value: 'petition', label: 'Petition Template' },
    { value: 'affidavit', label: 'Affidavit Template' },
    { value: 'power-of-attorney', label: 'Power of Attorney Template' },
    { value: 'lease', label: 'Lease Agreement Template' },
  ];

  const handleGenerate = async () => {
    if (!templateType) {
      toast({
        title: 'Template type required',
        description: 'Please select a template type.',
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
    setGeneratedTemplate('');

    try {
      const selectedTemplate = templateTypes.find(t => t.value === templateType);
      const prompt = `Generate a professional South Sudan legal ${selectedTemplate?.label.toLowerCase()} template. 

${templateName ? `Template name/purpose: ${templateName}\n` : ''}
${customInstructions ? `Custom requirements: ${customInstructions}\n` : ''}

The template should:
1. Be compliant with South Sudan laws and legal practices
2. Include all standard sections and clauses
3. Have placeholders for parties, dates, amounts, and other variable information
4. Include clear instructions on where to fill in specific details
5. Use proper legal terminology appropriate for South Sudan jurisdiction
6. Be professionally formatted and ready to use

Please provide a complete, well-structured template.`;

      let fullResponse = '';
      for await (const chunk of backendService.streamChat(
        prompt,
        undefined,
        user.uid
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setGeneratedTemplate(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to generate template');
        }
      }

      incrementPromptCount();
      toast({
        title: 'Template generated',
        description: 'Your legal template has been generated successfully.',
      });
    } catch (error) {
      console.error('Error generating template:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedTemplate) return;

    const blob = new Blob([generatedTemplate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = templateName || templateType;
    a.download = `south-sudan-${fileName}-template-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template downloaded',
      description: 'Your template has been downloaded.',
    });
  };

  const handleCopy = async () => {
    if (!generatedTemplate) return;

    try {
      await navigator.clipboard.writeText(generatedTemplate);
      setCopied(true);
      toast({
        title: 'Template copied',
        description: 'Template has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy template to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Template Generator</h1>
            <p className="text-gray-600">
              Generate professional legal templates and clauses for South Sudan. Create ready-to-use templates for contracts, letters, notices, and more.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Select template type and provide any custom requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger id="template-type">
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name/Purpose (Optional)</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Employment Contract, Rental Agreement, etc."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Specify any particular clauses, terms, or requirements you want included in the template..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !templateType}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Template...
                  </>
                ) : (
                  <>
                    <FileCode className="mr-2 h-4 w-4" />
                    Generate Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Template</CardTitle>
                    <CardDescription>
                      Review, copy, or download your legal template
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
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
                    <Button onClick={handleDownload} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                    {generatedTemplate}
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
