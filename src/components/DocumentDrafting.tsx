import { useState, useEffect, useRef } from 'react';
import { FileText, Download, Loader2, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Mic, Square } from 'lucide-react';
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
import { computeSidebarTaskTokens, TOKENS_DONE_TITLE, TOKENS_DONE_MESSAGE } from '@/lib/sidebar-tokens';
import LoginModal from './LoginModal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline as UnderlineExtension } from '@tiptap/extension-underline';
import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import './ResponseEditor.css';

export default function DocumentDrafting() {
  const [documentType, setDocumentType] = useState<string>('');
  const [requirements, setRequirements] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'docx' | 'pdf' | 'html'>('docx');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const confirmedTextRef = useRef<string>('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { useTokensForSidebarTask, canAffordTokens, showLoginModal, setShowLoginModal, setShowSubscriptionModal } = usePromptLimit();

  // Rich text editor for editing generated document
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      UnderlineExtension,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // Update editor when document is generated
  useEffect(() => {
    if (editor && generatedDocument && !editor.getHTML().includes(generatedDocument.substring(0, 50))) {
      const htmlContent = generatedDocument
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      editor.commands.setContent(`<p>${htmlContent}</p>`);
    }
  }, [generatedDocument, editor]);

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
    console.log('🔵 handleGenerate called', { documentType, requirements: requirements.length, user: !!user });
    
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
      console.log('⚠️ No user, showing login modal');
      setShowLoginModal(true);
      return;
    }

    const minTokens = 5;
    if (!canAffordTokens(minTokens)) {
      toast({ title: TOKENS_DONE_TITLE, description: TOKENS_DONE_MESSAGE, variant: 'destructive' });
      setShowSubscriptionModal(true);
      return;
    }

    console.log('✅ Starting document generation...');
    setIsGenerating(true);
    setGeneratedDocument('');

    try {
      console.log('📤 Sending request to backend...');
      const prompt = `Generate a South Sudan legal ${documentTypes.find(d => d.value === documentType)?.label.toLowerCase()} document based on the following requirements:

${requirements}

Please provide a complete, professionally formatted legal document that complies with South Sudan laws and legal practices. Include all necessary sections, clauses, and legal language appropriate for South Sudan jurisdiction.`;

      let fullResponse = '';
      let chunkCount = 0;
      for await (const chunk of backendService.streamChat(
        prompt,
        undefined,
        user.id
      )) {
        chunkCount++;
        console.log(`📥 Received chunk ${chunkCount}:`, chunk.type);
        
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setGeneratedDocument(fullResponse);
          // Update editor content
          if (editor) {
            const htmlContent = fullResponse
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br>');
            editor.commands.setContent(`<p>${htmlContent}</p>`);
          }
        } else if (chunk.type === 'error') {
          console.error('❌ Backend error:', chunk.error);
          throw new Error(chunk.error || 'Failed to generate document');
        } else if (chunk.type === 'done') {
          console.log('✅ Generation complete');
        }
      }

      console.log(`✅ Document generated successfully (${fullResponse.length} characters)`);
      const tokens = computeSidebarTaskTokens(fullResponse.length);
      const ok = await useTokensForSidebarTask(tokens);
      if (!ok) {
        setGeneratedDocument('');
        if (editor) editor.commands.setContent('<p></p>');
        toast({ title: TOKENS_DONE_TITLE, description: TOKENS_DONE_MESSAGE, variant: 'destructive' });
        setShowSubscriptionModal(true);
        return;
      }
      toast({
        title: 'Document generated',
        description: 'Your legal document has been generated successfully.',
      });
    } catch (error) {
      console.error('❌ Error generating document:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: 'Voice input not supported',
          description: 'Your browser does not support speech recognition.',
          variant: 'destructive',
        });
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        confirmedTextRef.current = requirements;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          confirmedTextRef.current += finalTranscript;
        }

        const displayText = confirmedTextRef.current + interimTranscript;
        setRequirements(displayText);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          stopRecording();
        } else if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone access denied',
            description: 'Please allow microphone access to use voice input.',
            variant: 'destructive',
          });
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
        setRequirements(confirmedTextRef.current);
        confirmedTextRef.current = '';
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition failed:', error);
      setIsRecording(false);
      toast({
        title: 'Voice input failed',
        description: 'Unable to start voice recognition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async () => {
    if (!generatedDocument && !editor?.getHTML()) return;

    const content = editor?.getHTML() || generatedDocument;
    const fileName = `south-sudan-${documentType}-${Date.now()}`;

    try {
      if (downloadFormat === 'txt') {
        // Plain text
        const textContent = editor?.getText() || generatedDocument;
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
        // HTML
        const htmlContent = editor?.getHTML() || `<pre>${generatedDocument}</pre>`;
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
        // DOCX using docx library
        const paragraphs: Paragraph[] = [];
        const textContent = editor?.getText() || generatedDocument;
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
        // For PDF, we'll convert HTML to PDF using browser print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = editor?.getHTML() || `<pre>${generatedDocument}</pre>`;
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
        title: 'Document downloaded',
        description: `Your document has been downloaded as ${downloadFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive',
      });
    }
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
                <div className="relative">
                  <Textarea
                    id="requirements"
                    placeholder="Describe what you need in the document. Include parties involved, key terms, dates, amounts, and any specific clauses or requirements..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    rows={8}
                    className="resize-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`absolute top-2 right-2 p-2 transition-colors rounded-full hover:bg-gray-100 ${isRecording ? 'text-red-600 hover:text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
                    title={isRecording ? 'Stop voice input' : 'Voice input'}
                  >
                    {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Be as detailed as possible for better results. Include names, dates, amounts, and specific legal requirements.
                </p>
              </div>

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔵 Button clicked!', { documentType, requirements: requirements.length, isGenerating });
                  handleGenerate();
                }}
                disabled={isGenerating || !documentType || !requirements.trim()}
                className="w-full"
                type="button"
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
                      Review, edit, and download your generated legal document
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
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
