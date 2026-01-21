import { useState } from 'react';
import { Search, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { backendService } from '@/lib/backend-service';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import LoginModal from './LoginModal';

export default function LegalResearch() {
  const [researchType, setResearchType] = useState<string>('case');
  const [query, setQuery] = useState<string>('');
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { canSendPrompt, incrementPromptCount, showLoginModal, setShowLoginModal } = usePromptLimit();

  const researchTypes = [
    { value: 'case', label: 'Case Law Research' },
    { value: 'statute', label: 'Statute Research' },
    { value: 'general', label: 'General Legal Research' },
  ];

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

    if (!canSendPrompt) {
      toast({
        title: 'Prompt limit reached',
        description: 'Please upgrade your plan or wait for your limit to reset.',
        variant: 'destructive',
      });
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
        user.uid
      )) {
        if (chunk.type === 'token' && chunk.text) {
          fullResponse += chunk.text;
          setResults(fullResponse);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Failed to conduct research');
        }
      }

      incrementPromptCount();
      toast({
        title: 'Research completed',
        description: 'Your legal research has been completed successfully.',
      });
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
                <Textarea
                  id="query"
                  placeholder="Enter your legal research question or topic. For example: 'What are the requirements for contract formation in South Sudan?' or 'Search for cases on property rights'..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
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
