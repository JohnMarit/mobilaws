import { useState, useEffect } from 'react';
import { FileCode, Loader2, Download, Copy, Check, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3 } from 'lucide-react';
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
import { useSubscription } from '@/contexts/SubscriptionContext';
import { computeSidebarTaskTokens } from '@/lib/sidebar-tokens';
import LoginModal from './LoginModal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline as UnderlineExtension } from '@tiptap/extension-underline';
import { Document, Paragraph, Packer, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import './ResponseEditor.css';

export default function TemplateGenerator() {
  const [templateType, setTemplateType] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { useTokensForSidebarTask, canAffordTokens, showLoginModal, setShowLoginModal } = usePromptLimit();
  const { userSubscription } = useSubscription();

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

    const minTokens = 5;
    if (!canAffordTokens(minTokens)) {
      const planId = userSubscription?.planId?.toLowerCase() || 'free';
      const isPremium = planId === 'premium';
      let description = 'This task uses at least 5 tokens. Please upgrade or wait for your limit to reset.';
      if (isPremium) description = 'Unable to send request. Please try again or contact support.';
      else if (planId === 'free') description = 'Please upgrade to Basic, Standard, or Premium for more tokens.';
      else if (planId === 'basic' || planId === 'standard') description = 'You need at least 5 tokens. Upgrade to Premium for unlimited or wait for reset.';
      toast({ title: 'Not enough tokens', description, variant: 'destructive' });
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
          // Update editor content
          if (editor) {
            const htmlContent = fullResponse
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br>');
            editor.commands.setContent(`<p>${htmlContent}</p>`);
          }
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to generate template');
        }
      }

      const tokens = computeSidebarTaskTokens(fullResponse.length);
      const ok = await useTokensForSidebarTask(tokens);
      if (!ok) {
        toast({ title: 'Token deduction failed', description: 'Template generated but we could not deduct tokens. You may need more tokens for this length.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Template generated', description: 'Your legal template has been generated successfully.' });
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

  const handleDownload = async () => {
    if (!generatedTemplate && !editor?.getHTML()) return;

    const content = editor?.getHTML() || generatedTemplate;
    const fileName = `south-sudan-${templateName || templateType}-template-${Date.now()}`;

    try {
      if (downloadFormat === 'txt') {
        const textContent = editor?.getText() || generatedTemplate;
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (downloadFormat === 'html') {
        const htmlContent = editor?.getHTML() || `<pre>${generatedTemplate}</pre>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (downloadFormat === 'docx') {
        const paragraphs: Paragraph[] = [];
        const textContent = editor?.getText() || generatedTemplate;
        const lines = textContent.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
          const isHeading = line.trim().length < 100 && (index === 0 || lines[index - 1].trim() === '');
          paragraphs.push(
            new Paragraph({
              text: line.trim(),
              heading: isHeading ? HeadingLevel.HEADING_1 : undefined,
              spacing: { after: 200 },
              alignment: AlignmentType.LEFT,
            })
          );
        });

        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs,
          }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fileName}.docx`);
      } else if (downloadFormat === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = editor?.getHTML() || `<pre>${generatedTemplate}</pre>`;
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${fileName}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                  pre { white-space: pre-wrap; }
                </style>
              </head>
              <body>${htmlContent}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        } else {
          toast({
            title: 'Download failed',
            description: 'Please allow pop-ups to download PDF.',
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: 'Template downloaded',
        description: `Your template has been downloaded as ${downloadFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download template. Please try again.',
        variant: 'destructive',
      });
    }
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔵 Template generate button clicked!', { templateType, isGenerating });
                  handleGenerate();
                }}
                disabled={isGenerating || !templateType}
                className="w-full"
                type="button"
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
                      Review, edit, copy, or download your legal template
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
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
                    <Select value={downloadFormat} onValueChange={(value: 'txt' | 'docx' | 'pdf' | 'html') => setDownloadFormat(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docx">DOCX</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="txt">TXT</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleDownload} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 p-3 border border-gray-200 rounded-lg bg-gray-50 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
                    title="Underline"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                    className={`h-8 w-8 p-0 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Rich Text Editor */}
                <div className="border border-gray-200 rounded-lg">
                  <EditorContent editor={editor} />
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
