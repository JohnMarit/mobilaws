import { useState, useEffect, useRef } from 'react';
import { HelpCircle, RotateCcw, Bot, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage, { ChatMessage as ChatMessageType } from './ChatMessage';
import ChatInput from './ChatInput';
import CounselNameSelector from './CounselNameSelector';
import CountrySelector from './CountrySelector';
import UserProfileNav from './UserProfileNav';
import LoginModal from './LoginModal';
import AnimatedCounselIntroduction from './AnimatedCounselIntroduction';
import { useChatContext } from '@/contexts/ChatContext';
import { useCounselName } from '@/contexts/CounselNameContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
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
  const { currentChatId, addChat, updateCurrentChat, saveChat, loadChat, saveEditedMessage, getEditedMessage, clearEditedMessage } = useChatContext();
  const { selectedName } = useCounselName();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
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
  const { userSubscription, isLoading: subscriptionLoading } = useSubscription();

  // Initialize with welcome message after animated intro completes
  const handleAnimatedIntroComplete = () => {
    setShowAnimatedIntro(false);
    // Don't add welcome message to chat - just show the static message
    // The static message will appear after animation completes
  };

  // Show animated intro on initial load
  useEffect(() => {
    // Show animation on initial load when there are no messages
    if (messages.length === 0 && !showAnimatedIntro) {
      setShowAnimatedIntro(true);
    }
  }, [selectedName, messages.length, showAnimatedIntro]);

  // Initialize animation on component mount
  useEffect(() => {
    setShowAnimatedIntro(true);
  }, []);

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
        setShowAnimatedIntro(false); // Don't show intro for existing chats
      } else {
        // New chat - reset everything immediately
        setMessages([]);
        setShowAnimatedIntro(true);
        
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

  // No longer needed - backend handles RAG context automatically

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Wait for subscription to load before checking limits
    if (isAuthenticated && subscriptionLoading) {
      console.log('⏳ Waiting for subscription to load...');
      return;
    }

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
      }
      return;
    }

    // Update chat title if this is the first user message in the conversation
    const userMessages = messages.filter(msg => msg.type === 'user');
    if (userMessages.length === 0) {
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
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
          let streamComplete = false;
          
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
            const citationsText = citations.length > 0
              ? `\n\n**Sources:**\n${citations.map(c => `- ${c.source} (Page ${c.page})`).join('\n')}`
              : '';
            
            // Replace streaming message with final message (new ID to force re-render)
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMsg.id 
                ? { 
                    ...msg, 
                    id: `assistant-${Date.now()}`, // New ID to ensure re-render
                    content: aiResponse + citationsText,
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
    <div className={`flex flex-col h-full md:h-screen bg-white ${className} overflow-hidden`}>
      {/* Top Bar with Actions - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm flex-shrink-0">
        {/* AI Status and User Info */}
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600" />
          <CounselNameSelector />
          <CountrySelector />
          {aiConnected ? (
            <span className="text-xs text-green-600">● Secure Backend Online</span>
          ) : (
            <span className="text-xs text-orange-500">● Backend Offline</span>
          )}
          {isAuthenticated && userSubscription ? (
            <span className="text-xs text-gray-500 ml-4">
              ● {userSubscription.tokensUsed}/{userSubscription.totalTokens} tokens {userSubscription.isFree ? 'today' : ''}
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
            <div className="text-center mb-8 md:mb-12 min-h-[120px] md:min-h-[200px] flex items-center justify-center">
              {showAnimatedIntro ? (
                <div className="flex justify-center w-full -mt-8 md:mt-0">
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
            </div>
            <div className="pb-6 md:pb-8 safe-area-inset-bottom">
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
