import { useState, useEffect, useRef } from 'react';
import { Heart, GraduationCap, Bot, Bug, Scale, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage, { ChatMessage as ChatMessageType } from './ChatMessage';
import ChatInput from './ChatInput';
import CountrySelector from './CountrySelector';
import UserProfileNav from './UserProfileNav';
import LoginModal from './LoginModal';
import LearningHub from './LearningHub';
import { BookCounsel } from './BookCounsel';
import { DonationDialog } from './DonationDialog';
import SelfStudy from './SelfStudy';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { conversationalLawSearch, ConversationContext } from '@/lib/search';
import { backendService } from '@/lib/backend-service';
import { useToast } from '@/hooks/use-toast';
import SubscriptionStatus from './SubscriptionStatus';

interface ChatInterfaceProps {
  className?: string;
  onShowDonation?: () => void;
  onToggleDebug?: () => void;
  onOpenLearningPath?: () => void;
}

export default function ChatInterface({ className = '', onShowDonation, onToggleDebug, onOpenLearningPath }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    previousQueries: [],
    mentionedArticles: [],
  });
  const [aiConnected, setAiConnected] = useState(false);
  const [showLearningHub, setShowLearningHub] = useState(false);
  const [showBookCounsel, setShowBookCounsel] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [showSelfStudy, setShowSelfStudy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentChatId, addChat, updateCurrentChat, saveChat, loadChat, saveEditedMessage, getEditedMessage, clearEditedMessage } = useChatContext();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const {
    promptCount,
    maxPrompts,
    canSendPrompt,
    incrementPromptCount,
    showLoginModal,
    setShowLoginModal,
    setShowSubscriptionModal,
    dailyTokensUsed,
    maxDailyTokens,
    tokensResetDate
  } = usePromptLimit();
  const { userSubscription, isLoading: subscriptionLoading } = useSubscription();

  // Create a new chat if none exists
  useEffect(() => {
    if (!currentChatId) {
      addChat('New Chat');
    }
  }, [currentChatId, addChat]);

  // Load chat data when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      const storedChat = loadChat(currentChatId);

      if (storedChat && storedChat.messages && storedChat.messages.length > 0) {
        // Load existing chat with messages
        setMessages(storedChat.messages);
        setConversationContext(storedChat.conversationContext);
        setExpandedArticles(new Set(storedChat.expandedArticles));
      } else {
        // New chat - reset everything immediately
        setMessages([]);

        // Reset conversation context
        setConversationContext({
          previousQueries: [],
          mentionedArticles: [],
        });
        conversationalLawSearch.clearConversationContext();

        // Reset expanded articles
        setExpandedArticles(new Set());
      }
    }
  }, [currentChatId, loadChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save chat when messages change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      saveChat(currentChatId, messages, conversationContext, expandedArticles);
    }
  }, [messages, conversationContext, expandedArticles, currentChatId, saveChat]);

  // Test backend connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      const connected = await backendService.testConnection();
      setAiConnected(connected);
      if (connected) {
        console.log('✅ Secure backend connected - no API keys exposed!');
      } else {
        console.warn('⚠️ Backend not available - falling back to local search');
      }
    };
    testConnection();
  }, []);

  // Open learning path modal when triggered externally (e.g., mobile header button)
  useEffect(() => {
    const handleOpenLearningPath = () => setShowLearningHub(true);
    window.addEventListener('open-learning-path', handleOpenLearningPath);
    return () => window.removeEventListener('open-learning-path', handleOpenLearningPath);
  }, []);

  // No longer needed - backend handles RAG context automatically

  const handleSendMessage = async (userMessage: string, files?: File[]) => {
    if ((!userMessage.trim() && (!files || files.length === 0)) || isLoading) return;

    // Check if user can send prompt
    if (!canSendPrompt) {
      // Don't show modals while auth is still loading
      if (authLoading) {
        console.log('⏳ Auth still loading, waiting before showing modal...');
        return;
      }

      if (isAuthenticated && (!userSubscription || !userSubscription.isActive)) {
        // Authenticated user without active subscription - show subscription modal
        setShowSubscriptionModal(true);
      } else if (isAuthenticated && userSubscription && userSubscription.isActive && !canSendPrompt) {
        // Authenticated user with subscription but no tokens - show subscription modal
        setShowSubscriptionModal(true);
      } else {
        // Anonymous user - show login modal
        setShowLoginModal(true);
      }
      return;
    }

    // Increment prompt count/token usage
    const tokenUsed = await incrementPromptCount();
    if (!Boolean(tokenUsed)) {
      // Token usage failed - show appropriate modal
      if (isAuthenticated) {
        // Authenticated user ran out of tokens
        setShowSubscriptionModal(true);
        toast({
          title: "No tokens remaining",
          description: userSubscription?.isFree
            ? "You've used all your free daily tokens. Upgrade to get more!"
            : "Purchase a plan to continue using the chatbot.",
          variant: "default",
        });
      } else {
        // Anonymous user with no tokens or an error: show login modal to encourage signup
        setShowLoginModal(true);
        toast({
          title: "Free limit reached",
          description: "You have used all 3 free daily tokens. They reset at midnight.",
          variant: "default",
        });
      }
      return;
    }

    // Update chat title if this is the first user message in the conversation
    const userMessages = messages.filter(msg => msg.type === 'user');
    if (userMessages.length === 0) {
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
      updateCurrentChat(title);
    }

    // Add user message (include file info if present)
    let messageContent = userMessage;
    if (files && files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      messageContent = userMessage ? `${userMessage}\n\n[Attached: ${fileNames}]` : `[Attached: ${fileNames}]`;
    }

    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Add typing indicator
    const typingMsg: ChatMessageType = {
      id: `typing-${Date.now()}`,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, typingMsg]);

    try {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMsg.id));

      if (aiConnected) {
        // Use secure backend for AI responses (RAG-powered with citations)
        let aiResponse = '';
        let citations: Array<{ source: string; page: number | string }> = [];

        // Add streaming AI response message
        const streamingMsg: ChatMessageType = {
          id: `assistant-streaming-${Date.now()}`,
          type: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, streamingMsg]);

        try {
          let streamComplete = false;

          // Build conversation history for context (last 5 messages, excluding current)
          // Strip HTML tags from content to keep it clean
          const stripHtml = (html: string): string => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
          };

          const conversationHistory = messages
            .filter(msg => msg.type !== 'system') // Exclude system messages
            .slice(-5) // Get last 5 messages
            .map(msg => ({
              role: msg.type as 'user' | 'assistant',
              content: stripHtml(msg.content).substring(0, 500) // Limit to 500 chars per message
            }));

          // Log conversation history for debugging
          if (conversationHistory.length > 0) {
            console.log(`📜 Sending ${conversationHistory.length} messages as conversation history`);
          }

          // Pass userId for admin prompt tracking, and files if present
          // Check if this is a modification request (make shorter, summarize, etc.)
          // Include both American and British spellings
          const isModificationRequest = /make\s+(it|the\s+reply)\s+shorter|shorten|summari[sz]e|summary|make\s+it\s+longer|expand|simpler|simplify|clarify|rephrase|rewrite|condense|brief/i.test(userMessage);

          // Get the last assistant message if this is a modification request
          let previousResponse: string | undefined;
          if (isModificationRequest) {
            const lastAssistantMsg = [...messages].reverse().find(msg => msg.type === 'assistant');
            if (lastAssistantMsg) {
              previousResponse = lastAssistantMsg.content;
            }
          }

          for await (const chunk of backendService.streamChat(
            userMessage,
            currentChatId || undefined,
            user?.id || null,
            files || [],
            previousResponse,
            conversationHistory // Pass conversation history for context
          )) {
            if (chunk.type === 'token' && chunk.text) {
              aiResponse += chunk.text;
              // Update the streaming message in real-time
              setMessages(prev => prev.map(msg =>
                msg.id === streamingMsg.id
                  ? { ...msg, content: aiResponse }
                  : msg
              ));
            } else if (chunk.type === 'done' && chunk.citations) {
              citations = chunk.citations;
              streamComplete = true;
            } else if (chunk.type === 'error') {
              console.error('Backend error:', chunk.error);

              // If backend is not available, fall back to local search
              if (chunk.error?.includes('Cannot reach backend')) {
                console.log('Falling back to local search - backend unavailable');
                setAiConnected(false);
                setMessages(prev => prev.filter(msg => msg.id !== streamingMsg.id));

                const response = await conversationalLawSearch.processChatQuery(userMessage, conversationContext);
                const assistantMsg: ChatMessageType = {
                  id: `assistant-${Date.now()}`,
                  type: 'assistant',
                  content: response.message,
                  timestamp: new Date(),
                  searchResults: response.searchResults,
                };
                setMessages(prev => [...prev, assistantMsg]);
                setConversationContext(conversationalLawSearch.getConversationContext());
                return;
              }

              throw new Error(chunk.error || 'Backend service error');
            }
          }

          // Finalize the message after streaming completes
          if (streamComplete && aiResponse) {
            // Clean up any inline citations that might have been included
            let cleanedResponse = aiResponse
              .replace(/\(Source:[^)]+\)/gi, '') // Remove (Source: ...) patterns
              .replace(/Source:\s*[^,]+,\s*Page\s*\d+/gi, '') // Remove Source: ..., Page X patterns
              .replace(/\s+/g, ' ') // Clean up extra whitespace
              .trim();

            // Determine source name from citations
            let sourceName = 'South Sudan Law';
            if (citations.length > 0) {
              const hasPenalCode = citations.some(c =>
                c.source.toLowerCase().includes('penal')
              );
              sourceName = hasPenalCode ? 'Penal Code' : 'South Sudan Law';
            }

            const citationsText = citations.length > 0
              ? `\n\n**Source:** ${sourceName}`
              : '';

            // Replace streaming message with final message (new ID to force re-render)
            setMessages(prev => prev.map(msg =>
              msg.id === streamingMsg.id
                ? {
                  ...msg,
                  id: `assistant-${Date.now()}`, // New ID to ensure re-render
                  content: cleanedResponse + citationsText,
                }
                : msg
            ));
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);
          // Remove streaming message and show error
          setMessages(prev => prev.filter(msg => msg.id !== streamingMsg.id));
          throw streamError;
        }
      } else {
        // Fallback to local search if backend is not available
        const response = await conversationalLawSearch.processChatQuery(userMessage, conversationContext);

        // Add assistant response
        const assistantMsg: ChatMessageType = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: response.message,
          timestamp: new Date(),
          searchResults: response.searchResults,
        };

        setMessages(prev => [...prev, assistantMsg]);

        // Update conversation context
        setConversationContext(conversationalLawSearch.getConversationContext());
      }


    } catch (error) {
      console.error('Failed to process message:', error);

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMsg.id));

      // Add error message
      const errorMsg: ChatMessageType = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMsg]);

      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleToggleExpand = (articleNumber: number) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleNumber)) {
      newExpanded.delete(articleNumber);
    } else {
      newExpanded.add(articleNumber);
    }
    setExpandedArticles(newExpanded);
  };

  const handleShowHelp = () => {
    const helpMessage: ChatMessageType = {
      id: `help-${Date.now()}`,
      type: 'assistant',
      content: conversationalLawSearch.getHelpMessage(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, helpMessage]);
  };


  // Check if there are any user messages (excluding welcome message)
  const hasUserMessages = messages.some(msg => msg.type === 'user');

  return (
    <div className={`flex flex-col h-full md:h-screen bg-white ${className} overflow-hidden`}>
      {/* Top Bar with Actions - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm flex-shrink-0">
        {/* AI Status and User Info */}
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">Mobilaws</span>
          <CountrySelector />
          {aiConnected ? (
            <span className="text-xs text-green-600">● Secure Backend Online</span>
          ) : (
            <span className="text-xs text-orange-500">● Backend Offline</span>
          )}
          {isAuthenticated && userSubscription ? (
            <span className="text-xs text-gray-500 ml-4">
              ● {userSubscription.tokensRemaining}/{userSubscription.totalTokens} tokens
              {userSubscription.isFree === true ? ' (daily)' : ''}
              {userSubscription.planId === 'admin_granted' ? ' (granted)' : ''}
            </span>
          ) : !isAuthenticated ? (
            <span className="text-xs text-gray-500 ml-4">
              ● {promptCount}/{maxPrompts} free prompts
            </span>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === 'development' && onToggleDebug && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDebug}
              className="h-8 px-2 text-gray-600 hover:bg-gray-100"
              title="Toggle Debug Panel"
            >
              <Bug className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBookCounsel(true)}
            className="h-8 px-2 text-gray-600 hover:bg-gray-100"
            title="Book a Counsel"
          >
            <Scale className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onShowDonation) {
                onShowDonation();
              } else {
                setShowDonationDialog(true);
              }
            }}
            className="h-8 px-2 text-gray-600 hover:bg-gray-100"
            title="Donate"
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onOpenLearningPath) {
                onOpenLearningPath();
              } else {
                setShowLearningHub(true);
              }
            }}
            className="h-8 px-2 text-gray-600 hover:bg-gray-100"
            title="Open Learning Paths"
          >
            <GraduationCap className="h-4 w-4" />
          </Button>
          <UserProfileNav
            onManageSubscription={() => setShowSubscriptionModal(true)}
            compact={false}
          />
        </div>
      </div>

      {!hasUserMessages ? (
        /* Centered Search Bar - No Chat Yet */
        <div className="flex-1 flex flex-col justify-center bg-white md:pt-0 pt-8 min-h-0 overflow-y-auto">
          <div className="max-w-5xl w-full px-4 mx-auto">
            <div className="text-center mb-8 md:mb-12 min-h-[120px] md:min-h-[200px] flex flex-col items-center justify-center">
              <div className="space-y-4">
                <p className="text-lg text-gray-600">
                  I am Your South Sudan Legal Assistant
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
                  <Button
                    onClick={() => setShowBookCounsel(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg shadow-md"
                  >
                    <Scale className="h-4 w-4 mr-2" />
                    Book a Counsel
                  </Button>
                  <Button
                    onClick={() => setShowLearningHub(true)}
                    variant="outline"
                    className="px-6 py-2 rounded-lg shadow-md"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Study Law
                  </Button>
                  <Button
                    onClick={() => setShowSelfStudy(true)}
                    variant="outline"
                    className="px-6 py-2 rounded-lg shadow-md border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Self Study
                  </Button>
                </div>
              </div>
            </div>
            <div className="pb-6 md:pb-8 safe-area-inset-bottom">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={aiConnected ? "Ask me anything about South Sudan laws..." : "Backend offline - using local search"}
                disabled={isLoading}
                enableAttachments={true}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Chat Interface - Messages and Bottom Input */
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 bg-white min-h-0">
            <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pt-6 pt-16">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onToggleExpand={handleToggleExpand}
                  expandedArticles={expandedArticles}
                  currentChatId={currentChatId}
                  saveEditedMessage={saveEditedMessage}
                  getEditedMessage={getEditedMessage}
                  clearEditedMessage={clearEditedMessage}
                />
              ))}


              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area - Bottom */}
          <div className="border-t border-gray-200 bg-white p-4 pb-6 md:pb-4 sticky bottom-0 z-30 flex-shrink-0 safe-area-inset-bottom">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={aiConnected ? "Ask me anything about South Sudan laws..." : "Backend offline - using local search"}
                disabled={isLoading}
                enableAttachments={true}
              />
            </div>
          </div>
        </>
      )}

      <LearningHub open={showLearningHub} onOpenChange={setShowLearningHub} fullscreen={true} />

      {/* Book Counsel Dialog */}
      <BookCounsel
        open={showBookCounsel}
        onOpenChange={setShowBookCounsel}
      />

      {/* Self Study Dialog */}
      <SelfStudy
        open={showSelfStudy}
        onOpenChange={setShowSelfStudy}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}

      {/* Donation Dialog */}
      <DonationDialog open={showDonationDialog} onOpenChange={setShowDonationDialog} />
    </div>
  );
}
