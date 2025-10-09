import { useState } from 'react';
import { Copy, ExternalLink, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { SearchResult, highlightSearchTerms } from '@/lib/search';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  searchResults?: SearchResult[];
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: ChatMessage;
  onToggleExpand?: (articleNumber: number) => void;
  expandedArticles?: Set<number>;
}

export default function ChatMessage({ 
  message, 
  onToggleExpand,
  expandedArticles = new Set()
}: ChatMessageProps) {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggleExpand = (articleNumber: number) => {
    if (!onToggleExpand) return;
    
    setIsAnimating(true);
    onToggleExpand(articleNumber);
    
    // Update URL hash when expanding
    if (!expandedArticles.has(articleNumber)) {
      window.history.replaceState(
        null, 
        '', 
        `${window.location.pathname}${window.location.search}#article-${articleNumber}`
      );
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Text copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareWebsite = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'South Sudan Laws Finder',
          text: 'Find and search South Sudan laws and legal documents',
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Website link copied",
          description: "Website link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast({
        title: "Failed to share",
        description: "Could not share website link",
        variant: "destructive",
      });
    }
  };

  const getSnippet = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[85%] bg-[#f7f7f8] text-gray-900 rounded-2xl rounded-br-md px-4 py-3">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-xs">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[85%] space-y-3">
        {/* Assistant avatar and message */}
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-[#10a37f] text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 flex-1">
            {message.isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap text-gray-900 leading-relaxed">{message.content}</p>
              </>
            )}
          </div>
        </div>

        {/* Search Results */}
        {message.searchResults && message.searchResults.length > 0 && (
          <div className="ml-11 space-y-3">
            {message.searchResults.map((result) => (
              <Card 
                key={result.article}
                id={`article-${result.article}`}
                className={`group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer hover:border-primary/20 ${
                  isAnimating ? 'scale-[0.99]' : ''
                }`}
                onClick={() => handleToggleExpand(result.article)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors"
                        dangerouslySetInnerHTML={{
                          __html: `Article ${result.article} — ${highlightSearchTerms(result.title, '')}`
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.lawSource && <span className="font-medium text-blue-600">{result.lawSource}</span>}
                        {result.lawSource && result.part && <span> • </span>}
                        {result.part && <span className="font-medium">{result.part}</span>}
                        {result.part && result.chapter && <span> • </span>}
                        {result.chapter}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExpand(result.article);
                      }}
                      className="shrink-0"
                      aria-label={expandedArticles.has(result.article) ? "Collapse article" : "Expand article"}
                    >
                      {expandedArticles.has(result.article) ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Article Text */}
                  <div 
                    className={`prose prose-xs max-w-none transition-all duration-300 mt-2 ${
                      expandedArticles.has(result.article) ? 'line-clamp-none' : 'line-clamp-2'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerms(
                        expandedArticles.has(result.article) ? result.text : getSnippet(result.text, 150),
                        ''
                      )
                    }}
                  />

                  {/* Action Buttons */}
                  {expandedArticles.has(result.article) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(`Article ${result.article}: ${result.title}\n\n${result.text}`);
                        }}
                        className="flex items-center gap-1 text-xs h-7"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareWebsite();
                        }}
                        className="flex items-center gap-1 text-xs h-7"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Share
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
