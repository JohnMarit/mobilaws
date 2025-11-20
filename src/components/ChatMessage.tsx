import { useState, useEffect } from 'react';
import { Copy, ExternalLink, ChevronDown, ChevronUp, User, FileText, Check, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { SearchResult, highlightSearchTerms } from '@/lib/search';
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import ResponseEditor from './ResponseEditor';
import './ResponseEditor.css';

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
  currentChatId?: string | null;
  saveEditedMessage?: (messageId: string, editedContent: string) => void;
  getEditedMessage?: (messageId: string) => string | null;
  clearEditedMessage?: (messageId: string) => void;
}

export default function ChatMessage({ 
  message, 
  onToggleExpand,
  expandedArticles = new Set(),
  currentChatId,
  saveEditedMessage,
  getEditedMessage,
  clearEditedMessage
}: ChatMessageProps) {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);
  
  // Helper function to normalize content for comparison (strip HTML tags)
  const normalizeContent = (content: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return tempDiv.textContent || tempDiv.innerText || '';
  };
  
  // Convert markdown to HTML (handles **bold**, paragraphs, line breaks)
  const markdownToHtml = (text: string): string => {
    // If already HTML, return as is
    if (text.includes('<') && text.includes('>')) {
      return text;
    }
    
    // First, split by double newlines to create major paragraph breaks
    const majorSections = text.split(/\n\n+/);
    
    // Process each section
    const htmlParagraphs = majorSections.map(section => {
      // Trim whitespace
      let trimmed = section.trim();
      if (!trimmed.length) return '';
      
      // Split by single newlines within the section
      // This handles cases where AI uses single newlines for paragraph breaks
      const lines = trimmed.split(/\n/);
      
      // If we have multiple lines, treat each as a separate paragraph
      if (lines.length > 1) {
        return lines
          .map(line => {
            const processed = line
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .trim();
            return processed ? `<p>${processed}</p>` : '';
          })
          .filter(p => p.length > 0)
          .join('');
      } else {
        // Single line - just process markdown
        const processed = trimmed
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return `<p>${processed}</p>`;
      }
    }).filter(p => p.length > 0);
    
    // If no paragraphs were created, fallback to treating entire text as one paragraph
    if (htmlParagraphs.length === 0) {
      const processed = text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .trim();
      return processed ? `<p>${processed}</p>` : '';
    }
    
    return htmlParagraphs.join('');
  };
  
  // Get original content in HTML format
  const getOriginalContentHtml = (): string => {
    if (message.content.includes('<')) {
      return message.content;
    }
    // Use markdown converter for better formatting
    return markdownToHtml(message.content);
  };
  
  const [editedContent, setEditedContent] = useState(() => {
    // Check if there's saved edited content
    if (getEditedMessage && currentChatId && message.id) {
      const savedContent = getEditedMessage(message.id);
      if (savedContent) {
        // Compare normalized content to see if it's actually different
        const originalNormalized = normalizeContent(getOriginalContentHtml());
        const savedNormalized = normalizeContent(savedContent);
        if (originalNormalized !== savedNormalized) {
          setHasUserMadeChanges(true);
        }
        return savedContent;
      }
    }
    // Convert plain text to HTML with proper paragraph tags if it's not already HTML
    return getOriginalContentHtml();
  });

  // Update edited content when switching chats or when storage functions become available
  useEffect(() => {
    if (getEditedMessage && currentChatId && message.id) {
      const savedContent = getEditedMessage(message.id);
      if (savedContent) {
        // Compare normalized content to see if it's actually different
        const originalNormalized = normalizeContent(getOriginalContentHtml());
        const savedNormalized = normalizeContent(savedContent);
        if (originalNormalized !== savedNormalized) {
          setHasUserMadeChanges(true);
        } else {
          setHasUserMadeChanges(false);
        }
        setEditedContent(savedContent);
      } else {
        // No saved edits, reset to original
        setEditedContent(getOriginalContentHtml());
        setHasUserMadeChanges(false);
      }
    }
  }, [currentChatId, message.id, getEditedMessage]);

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

  const parseHtmlToWordParagraphs = (htmlContent: string) => {
    const paragraphs: any[] = [];
    
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Process each element
    const processElement = (element: Element): any[] => {
      const results: any[] = [];
      
      if (element.tagName === 'P') {
        // Process paragraph content
        const children = Array.from(element.childNodes);
        const textRuns: any[] = [];
        
        const processNode = (node: ChildNode): void => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) {
              textRuns.push(new TextRun(text));
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const text = element.textContent?.trim();
            if (text) {
              let formatting: any = {};
              
              if (element.tagName === 'STRONG' || element.tagName === 'B') {
                formatting.bold = true;
              }
              if (element.tagName === 'EM' || element.tagName === 'I') {
                formatting.italics = true;
              }
              if (element.tagName === 'U') {
                formatting.underline = {};
              }
              
              textRuns.push(new TextRun({ text, ...formatting }));
            }
          }
        };
        
        children.forEach(processNode);
        
        if (textRuns.length > 0) {
          // Check for text alignment
          const style = element.getAttribute('style') || '';
          let alignment: any = {};
          
          if (style.includes('text-align: center')) {
            alignment.alignment = 'center';
          } else if (style.includes('text-align: right')) {
            alignment.alignment = 'right';
          } else if (style.includes('text-align: left')) {
            alignment.alignment = 'left';
          }
          
          results.push(new Paragraph({
            children: textRuns,
            spacing: { after: 120 },
            ...alignment,
          }));
        }
      } else if (element.tagName === 'UL') {
        // Process unordered list
        const listItems = Array.from(element.children).filter(child => child.tagName === 'LI');
        listItems.forEach(item => {
          const text = item.textContent?.trim();
          if (text) {
            results.push(new Paragraph({
              children: [new TextRun(`• ${text}`)],
              spacing: { after: 80 },
              indent: { left: 360 }, // Indent for list items
            }));
          }
        });
      } else if (element.tagName === 'OL') {
        // Process ordered list
        const listItems = Array.from(element.children).filter(child => child.tagName === 'LI');
        listItems.forEach((item, index) => {
          const text = item.textContent?.trim();
          if (text) {
            results.push(new Paragraph({
              children: [new TextRun(`${index + 1}. ${text}`)],
              spacing: { after: 80 },
              indent: { left: 360 }, // Indent for list items
            }));
          }
        });
      } else if (element.tagName === 'BR') {
        // Handle line breaks
        results.push(new Paragraph({
          children: [new TextRun(' ')],
          spacing: { after: 60 },
        }));
      } else {
        // Process other elements recursively
        const children = Array.from(element.children);
        children.forEach(child => {
          results.push(...processElement(child));
        });
      }
      
      return results;
    };
    
    // Process all top-level elements
    const children = Array.from(tempDiv.children);
    if (children.length === 0) {
      // If no block elements, treat as plain text
      const text = tempDiv.textContent?.trim();
      if (text) {
        paragraphs.push(new Paragraph({
          children: [new TextRun(text)],
          spacing: { after: 120 },
        }));
      }
    } else {
      children.forEach(child => {
        paragraphs.push(...processElement(child));
      });
    }
    
    return paragraphs;
  };

  const copyMessage = async () => {
    try {
      // Try to copy both HTML and plain text formats
      const htmlContent = editedContent;
      const textContent = editedContent.replace(/<[^>]*>/g, '');
      
      // Create clipboard item with both formats
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([textContent], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Formatted response copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      // Fallback to plain text if HTML copy fails
      try {
        const textContent = editedContent.replace(/<[^>]*>/g, '');
        await navigator.clipboard.writeText(textContent);
        setIsCopied(true);
        toast({
          title: "Copied!",
          description: "Response copied to clipboard (plain text)",
        });
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Failed to copy message:', fallbackError);
        toast({
          title: "Failed to copy",
          description: "Could not copy response to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      // Parse HTML content and create formatted paragraphs
      const contentParagraphs = parseHtmlToWordParagraphs(editedContent);

      // Create sections array
      const sections = [
        new Paragraph({
          text: "AI Legal Assistant Response",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: `Generated on: ${new Date().toLocaleString()}`,
          spacing: { after: 400 },
        }),
        ...contentParagraphs,
      ];

      // Add search results if available
      if (message.searchResults && message.searchResults.length > 0) {
        sections.push(
          new Paragraph({
            text: "",
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "Related Legal Articles",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          })
        );

        message.searchResults.forEach(result => {
          sections.push(
            new Paragraph({
              text: `Article ${result.article} — ${result.title}`,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 120 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Source: ${result.lawSource || 'N/A'}`,
                  italics: true,
                }),
              ],
              spacing: { after: 120 },
            })
          );

          // Add article text paragraphs
          const articleParagraphs = result.text.split('\n').map(line =>
            new Paragraph({
              children: [new TextRun(line || ' ')],
              spacing: { after: 120 },
            })
          );
          sections.push(...articleParagraphs);
        });
      }

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: sections,
        }],
      });

      // Generate and save the document
      const blob = await Packer.toBlob(doc);
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(blob, `legal-response-${timestamp}.docx`);

      toast({
        title: "Exported!",
        description: "Response exported as Word document",
      });
    } catch (error) {
      console.error('Failed to export to Word:', error);
      toast({
        title: "Export failed",
        description: "Could not export response to Word",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEditSave = (newContent: string) => {
    // Compare normalized content to see if it's actually different
    const originalNormalized = normalizeContent(getOriginalContentHtml());
    const newNormalized = normalizeContent(newContent);
    const hasChanges = originalNormalized !== newNormalized;
    
    setEditedContent(newContent);
    setHasUserMadeChanges(hasChanges);
    
    // Save to persistent storage only if there are actual changes
    if (saveEditedMessage && currentChatId) {
      if (hasChanges) {
        saveEditedMessage(message.id, newContent);
      } else {
        // If no actual changes, clear any saved edits
        if (clearEditedMessage) {
          clearEditedMessage(message.id);
        }
      }
    }
    
    setIsEditing(false);
    if (hasChanges) {
      toast({
        title: "Response updated",
        description: "Your edits have been saved and will persist across page refreshes",
      });
    } else {
      toast({
        title: "No changes detected",
        description: "The content is the same as the original response",
      });
    }
  };

  const handleEditCancel = () => {
    // Restore to saved content if available, otherwise use original
    if (getEditedMessage && currentChatId) {
      const savedContent = getEditedMessage(message.id);
      if (savedContent) {
        setEditedContent(savedContent);
      } else {
        setEditedContent(message.content);
      }
    } else {
      setEditedContent(message.content);
    }
    setIsEditing(false);
  };

  const handleEditReset = () => {
    // Reset to original content and clear saved edits
    const originalContent = getOriginalContentHtml();
    
    setEditedContent(originalContent);
    setHasUserMadeChanges(false);
    
    // Clear saved edits from storage
    if (clearEditedMessage) {
      clearEditedMessage(message.id);
    }
    
    toast({
      title: "Response reset",
      description: "Response has been reset to original content and edits cleared",
    });
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
                <div 
                  className={`formatted-content ${hasUserMadeChanges ? 'border-l-2 border-blue-200 pl-3' : ''}`}
                  dangerouslySetInnerHTML={{ __html: editedContent }}
                />
                
                {/* Edited indicator - only show when user has actually made changes */}
                {hasUserMadeChanges && (
                  <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <Edit3 className="h-3 w-3" />
                    <span>Response has been edited</span>
                  </div>
                )}
                
                {/* Action buttons for response */}
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-xs h-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit response</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyMessage}
                    className="flex items-center gap-2 text-xs h-8 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy response</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToWord}
                    disabled={isExporting}
                    className="flex items-center gap-2 text-xs h-8 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{isExporting ? 'Exporting...' : 'Export to Word'}</span>
                  </Button>
                </div>
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

      {/* Response Editor Modal */}
      <ResponseEditor
        initialContent={editedContent}
        onSave={handleEditSave}
        onCancel={handleEditCancel}
        onReset={handleEditReset}
        isOpen={isEditing}
      />
    </div>
  );
}
