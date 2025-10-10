import { useState, useEffect, useRef } from 'react';
import { HelpCircle, RotateCcw, Bot, LogOut, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage, { ChatMessage as ChatMessageType } from './ChatMessage';
import ChatInput from './ChatInput';
import CounselNameSelector from './CounselNameSelector';
import LoginModal from './LoginModal';
import AnimatedCounselIntroduction from './AnimatedCounselIntroduction';
import { useChatContext } from '@/contexts/ChatContext';
import { useCounselName } from '@/contexts/CounselNameContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { conversationalLawSearch, ConversationContext } from '@/lib/search';
import { backendService } from '@/lib/backend-service';
import { useToast } from '@/hooks/use-toast';
import SubscriptionStatus from './SubscriptionStatus';
import SubscriptionManager from './SubscriptionManager';

interface ChatInterfaceProps {
  className?: string;
  onShowHelp?: () => void;
  onClearChat?: () => void;
  onToggleDebug?: () => void;
}

export default function ChatInterface({ className = '', onShowHelp, onClearChat, onToggleDebug }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    previousQueries: [],
    mentionedArticles: [],
  });
  const [aiConnected, setAiConnected] = useState(false);
  const [showAnimatedIntro, setShowAnimatedIntro] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentChatId, addChat, updateCurrentChat } = useChatContext();
  const { selectedName } = useCounselName();
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    promptCount, 
    maxPrompts, 
    canSendPrompt, 
    incrementPromptCount, 
    showLoginModal, 
    setShowLoginModal,
    showSubscriptionModal,
    setShowSubscriptionModal,
    dailyTokensUsed,
    maxDailyTokens,
    tokensResetDate
  } = usePromptLimit();
  const { userSubscription } = useSubscription();

  // Initialize with welcome message after animated intro completes
  const handleAnimatedIntroComplete = () => {
    setShowAnimatedIntro(false);
    // Don't add welcome message to chat - just show the static message
    // The static message will appear after animation completes
  };

  // Show animated intro on initial load
  useEffect(() => {
    console.log('Initial load effect - messages.length:', messages.length, 'selectedName:', selectedName, 'showAnimatedIntro:', showAnimatedIntro);
    // Show animation on initial load when there are no messages
    if (messages.length === 0 && !showAnimatedIntro) {
      console.log('Setting showAnimatedIntro to true on initial load');
      setShowAnimatedIntro(true);
    }
  }, [selectedName]);

  // Initialize animation on component mount
  useEffect(() => {
    console.log('Component mounted - setting up initial animation');
    setShowAnimatedIntro(true);
  }, []);

  // Create a new chat if none exists
  useEffect(() => {
    if (!currentChatId) {
      addChat('New Chat');
    }
  }, [currentChatId, addChat]);

  // Reset chat when currentChatId changes (new chat selected)
  useEffect(() => {
    if (currentChatId) {
      // Reset to show animated intro again for new chats
      setShowAnimatedIntro(true);
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
  }, [currentChatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // No longer needed - backend handles RAG context automatically

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Check if user can send prompt
    if (!canSendPrompt) {
      if (isAuthenticated && (!userSubscription || !userSubscription.isActive)) {
        // Authenticated user without subscription - show subscription modal
        setShowSubscriptionModal(true);
      } else {
        // Anonymous user or user with expired subscription - show login modal
        setShowLoginModal(true);
      }
      return;
    }

    // Increment prompt count/token usage
    const tokenUsed = await incrementPromptCount();
    if (!tokenUsed) {
      // Token usage failed, don't proceed with the message
      return;
    }

    // Update chat title if this is the first user message
    if (messages.length === 1) {
      const title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
      updateCurrentChat(title);
    }

    // Add user message
    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
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
          for await (const chunk of backendService.streamChat(userMessage, currentChatId || undefined)) {
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
              // Add citations to the final message
              const citationsText = citations.length > 0
                ? `\n\n**Sources:**\n${citations.map(c => `- ${c.source} (Page ${c.page})`).join('\n')}`
                : '';
              
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMsg.id 
                  ? { ...msg, content: aiResponse + citationsText }
                  : msg
              ));
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

  const handleClearChat = () => {
    // Reset messages to show only welcome message
    const welcomeMessage: ChatMessageType = {
      id: 'welcome',
      type: 'assistant',
      content: conversationalLawSearch.getWelcomeMessage(selectedName),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Reset conversation context
    setConversationContext({
      previousQueries: [],
      mentionedArticles: [],
    });
    conversationalLawSearch.clearConversationContext();
    
    // Reset expanded articles
    setExpandedArticles(new Set());
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
    <div className={`flex flex-col h-screen bg-white ${className}`}>
      {/* Top Bar with Actions - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        {/* AI Status and User Info */}
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600" />
          <CounselNameSelector />
          {aiConnected ? (
            <span className="text-xs text-green-600">● Secure Backend Online</span>
          ) : (
            <span className="text-xs text-orange-500">● Backend Offline</span>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-4">
              {user?.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-xs text-blue-600">● {user?.name}</span>
              <span className="text-xs text-gray-500">
                ● {dailyTokensUsed}/{maxDailyTokens} tokens today
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500 ml-4">
              ● {promptCount}/{maxPrompts} free prompts
            </span>
          )}
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
            onClick={onShowHelp || handleShowHelp}
            className="h-8 px-2 text-gray-600 hover:bg-gray-100"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearChat || handleClearChat}
            className="h-8 px-2 text-gray-600 hover:bg-gray-100"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 px-2 text-gray-600 hover:bg-gray-100"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!hasUserMessages ? (
        /* Centered Search Bar - No Chat Yet */
        <div className="flex-1 flex items-center justify-center bg-white md:pt-0 pt-16">
          <div className="max-w-2xl w-full px-4">
            <div className="text-center mb-8">
              {showAnimatedIntro ? (
                <div className="flex justify-center">
                  <AnimatedCounselIntroduction
                    counselName={selectedName}
                    onComplete={handleAnimatedIntroComplete}
                  />
                </div>
              ) : (
                <p className="text-lg text-gray-600 mb-4">
                  I am Counsel {selectedName}, let's address your legal matter.
                  {aiConnected ? (
                    <span className="block text-sm text-green-600 mt-2">
                      🤖 Secure AI Backend Online - RAG-powered with legal document citations
                    </span>
                  ) : (
                    <span className="block text-sm text-orange-500 mt-2">
                      ⚠️ Backend Offline - Using local search. Start the backend server for AI responses
                    </span>
                  )}
                </p>
              )}
              
              {/* Mobile User Status */}
              <div className="md:hidden mb-4">
                {isAuthenticated ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      {user?.picture && (
                        <img 
                          src={user.picture} 
                          alt={user.name} 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-blue-600">Signed in as {user?.name}</span>
                    </div>
                    <SubscriptionStatus 
                      compact={true}
                      onManageSubscription={() => setShowSubscriptionModal(true)}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    {promptCount}/{maxPrompts} free prompts remaining
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-4 z-20">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={aiConnected ? "Ask me anything about South Sudan laws..." : "Backend offline - using local search"}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Chat Interface - Messages and Bottom Input */
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 bg-white">
            <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pt-6 pt-16">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onToggleExpand={handleToggleExpand}
                  expandedArticles={expandedArticles}
                />
              ))}
              
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area - Bottom */}
          <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0 z-20">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={aiConnected ? "Ask me anything about South Sudan laws..." : "Backend offline - using local search"}
                disabled={isLoading}
              />
            </div>
          </div>
        </>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Subscription Plans</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubscriptionModal(false)}
              >
                ✕
              </Button>
            </div>
            <SubscriptionManager onClose={() => setShowSubscriptionModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
