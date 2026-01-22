import { useState, useRef } from 'react';
import { Search, Loader2, FileText, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { backendService } from '@/lib/backend-service';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { computeSidebarTaskTokens, TOKENS_DONE_TITLE, TOKENS_DONE_MESSAGE } from '@/lib/sidebar-tokens';
import LoginModal from './LoginModal';

export default function LegalResearch() {
  const [researchType, setResearchType] = useState<string>('case');
  const [query, setQuery] = useState<string>('');
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const confirmedTextRef = useRef<string>('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { useTokensForSidebarTask, canAffordTokens, showLoginModal, setShowLoginModal, setShowSubscriptionModal } = usePromptLimit();

  const researchTypes = [
    { value: 'case', label: 'Case Law Research' },
    { value: 'statute', label: 'Statute Research' },
    { value: 'general', label: 'General Legal Research' },
  ];

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
        confirmedTextRef.current = query;
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
        setQuery(displayText);
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
        setQuery(confirmedTextRef.current);
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

  const handleResearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Query required',
        description: 'Please enter your research question or topic.',
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
      toast({ title: TOKENS_DONE_TITLE, description: TOKENS_DONE_MESSAGE, variant: 'destructive' });
      setShowSubscriptionModal(true);
      return;
    }

    setIsResearching(true);
    setResults('');

    try {
      const researchPrompt = researchType === 'case'
        ? `Research South Sudan case law related to: ${query}. Provide case summaries, key holdings, and relevant precedents.`
        : researchType === 'statute'
        ? `Research South Sudan statutes and legislation related to: ${query}. Provide statute summaries, relevant sections, and legal provisions.`
        : `Conduct comprehensive legal research on South Sudan law regarding: ${query}. Include relevant cases, statutes, and legal principles.`;

      let fullResponse = '';
      for await (const chunk of backendService.streamChat(
        researchPrompt,
        undefined,
        user.id
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setResults(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to conduct research');
        }
      }

      const tokens = computeSidebarTaskTokens(fullResponse.length);
      const ok = await useTokensForSidebarTask(tokens);
      if (!ok) {
        setResults('');
        toast({ title: TOKENS_DONE_TITLE, description: TOKENS_DONE_MESSAGE, variant: 'destructive' });
        setShowSubscriptionModal(true);
        return;
      }
      toast({ title: 'Research completed', description: 'Your legal research has been completed successfully.' });
    } catch (error) {
      console.error('Error conducting research:', error);
      toast({
        title: 'Research failed',
        description: error instanceof Error ? error.message : 'Failed to conduct research. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Research</h1>
            <p className="text-gray-600">
              Research South Sudan case law, statutes, and legal principles. Get comprehensive summaries and analysis.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Research Query</CardTitle>
              <CardDescription>
                Select research type and enter your question or topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="research-type">Research Type</Label>
                <Select value={researchType} onValueChange={setResearchType}>
                  <SelectTrigger id="research-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {researchTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query">Research Question or Topic</Label>
                <div className="relative">
                  <Textarea
                    id="query"
                    placeholder="Enter your legal research question or topic. For example: 'What are the requirements for contract formation in South Sudan?' or 'Search for cases on property rights'..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={6}
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
              </div>

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔵 Research button clicked!', { query: query.length, isResearching });
                  handleResearch();
                }}
                disabled={isResearching || !query.trim()}
                className="w-full"
                type="button"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Start Research
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Research Results</CardTitle>
                <CardDescription>
                  Summary and analysis of your legal research
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800">
                    {results}
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
