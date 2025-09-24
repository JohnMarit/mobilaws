import { useState, useEffect, useRef } from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage, { ChatMessage as ChatMessageType } from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatContext } from '@/contexts/ChatContext';
import { conversationalLawSearch, ConversationContext } from '@/lib/search';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  className?: string;
  onShowHelp?: () => void;
  onClearChat?: () => void;
}

export default function ChatInterface({ className = '', onShowHelp, onClearChat }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    previousQueries: [],
    mentionedArticles: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentChatId, addChat, updateCurrentChat } = useChatContext();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: 'welcome',
      type: 'assistant',
      content: conversationalLawSearch.getWelcomeMessage(),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
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
      // Reset messages to show only welcome message
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        type: 'assistant',
        content: conversationalLawSearch.getWelcomeMessage(),
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
    }
  }, [currentChatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

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
      // Process the query with conversational search
      const response = await conversationalLawSearch.processChatQuery(userMessage, conversationContext);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMsg.id));

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
      content: conversationalLawSearch.getWelcomeMessage(),
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
      <div className="hidden md:flex items-center justify-end p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {!hasUserMessages ? (
        /* Centered Search Bar - No Chat Yet */
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="max-w-2xl w-full px-4">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src="/mobilogo.png" alt="Mobilaws Logo" className="h-16 w-16" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Mobilaws
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                I am your mobile law assistant on South Sudan laws and penal codes.
              </p>
            </div>
            <div className="sticky bottom-4 z-20">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ask me anything about South Sudan laws..."
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
            <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
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
                placeholder="Ask me anything about South Sudan laws..."
                disabled={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
