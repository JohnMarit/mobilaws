import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { ChatHistory } from '@/components/Sidebar';
import { chatStorage, StoredChat } from '@/lib/chat-storage';

interface ChatContextType {
  chatHistory: ChatHistory[];
  currentChatId: string | null;
  addChat: (title: string) => string;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  updateCurrentChat: (title: string) => void;
  saveChat: (chatId: string, messages: any[], conversationContext: any, expandedArticles: Set<number>) => void;
  loadChat: (chatId: string) => StoredChat | null;
  saveEditedMessage: (messageId: string, editedContent: string) => void;
  getEditedMessage: (messageId: string) => string | null;
  clearEditedMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const previousChatIdRef = useRef<string | null>(null);

  // Load chat data from storage on mount
  useEffect(() => {
    // Clean up any empty chats from storage
    chatStorage.cleanupEmptyChats();
    
    const storedHistory = chatStorage.getChatHistory();
    
    // Load chat history but don't restore currentChatId
    // This ensures a fresh start on page refresh
    setChatHistory(storedHistory);
    setCurrentChatId(null);
    
    // Clear the stored currentChatId so next refresh also starts fresh
    chatStorage.saveCurrentChatId(null);
  }, []);

  // Clean up empty chats when navigating away
  useEffect(() => {
    // Cleanup function that runs when currentChatId is about to change
    return () => {
      if (previousChatIdRef.current) {
        const prevChat = chatStorage.loadChat(previousChatIdRef.current);
        if (!prevChat || !prevChat.messages || prevChat.messages.length === 0) {
          chatStorage.deleteChat(previousChatIdRef.current);
          setChatHistory(prev => prev.filter(chat => chat.id !== previousChatIdRef.current));
        }
      }
    };
  }, [currentChatId]);

  const addChat = useCallback((title: string): string => {
    // Clean up current chat if it's empty before creating new one
    if (currentChatId) {
      const currentChat = chatStorage.loadChat(currentChatId);
      if (!currentChat || !currentChat.messages || currentChat.messages.length === 0) {
        chatStorage.deleteChat(currentChatId);
        setChatHistory(prev => prev.filter(chat => chat.id !== currentChatId));
      }
    }
    
    const newChatId = `chat-${Date.now()}`;
    
    // Don't add to chat history yet - will be added when first message is sent
    // This prevents empty chats from appearing in the sidebar
    
    previousChatIdRef.current = currentChatId;
    setCurrentChatId(newChatId);
    
    // Save to storage (but not to chatHistory yet)
    chatStorage.saveCurrentChatId(newChatId);
    
    return newChatId;
  }, [currentChatId]);

  const selectChat = useCallback((chatId: string, previousChatId?: string | null) => {
    // Use the provided previousChatId, or currentChatId, or the ref as fallback
    const prevId = previousChatId !== undefined ? previousChatId : (currentChatId || previousChatIdRef.current);
    
    // Clean up previous chat if it was empty
    if (prevId && prevId !== chatId) {
      const previousChat = chatStorage.loadChat(prevId);
      
      if (!previousChat || !previousChat.messages || previousChat.messages.length === 0) {
        // Delete empty chat
        chatStorage.deleteChat(prevId);
        setChatHistory(prev => prev.filter(chat => chat.id !== prevId));
      }
    }
    
    // Update current and previous
    previousChatIdRef.current = currentChatId;
    setCurrentChatId(chatId);
    chatStorage.saveCurrentChatId(chatId);
  }, [currentChatId]);

  const deleteChat = useCallback((chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      chatStorage.saveCurrentChatId(null);
    }
    chatStorage.deleteChat(chatId);
  }, [currentChatId]);

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
    chatStorage.updateChatTitle(chatId, newTitle);
  }, []);

  const updateCurrentChat = useCallback((title: string) => {
    if (currentChatId) {
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentChatId ? { ...chat, title } : chat
        )
      );
      chatStorage.updateChatTitle(currentChatId, title);
    }
  }, [currentChatId]);

  const saveChat = useCallback((chatId: string, messages: any[], conversationContext: any, expandedArticles: Set<number>) => {
    // Don't save empty chats (chats with no messages)
    if (messages.length === 0) {
      return;
    }
    
    // Get the first user message timestamp (time of the question)
    const firstUserMessage = messages.find(m => m.type === 'user');
    const chatTimestamp = firstUserMessage?.timestamp || new Date();
    
    // Generate title from first user message (truncate if too long)
    const generateTitle = (userMessage: string): string => {
      const maxLength = 50;
      if (userMessage.length > maxLength) {
        return userMessage.substring(0, maxLength) + '...';
      }
      return userMessage;
    };
    
    // Check if chat exists in history
    let chat = chatHistory.find(c => c.id === chatId);
    
    // If chat doesn't exist in history (new chat with first message), add it
    if (!chat) {
      const chatTitle = firstUserMessage ? generateTitle(firstUserMessage.content) : 'New Chat';
      const newChatHistoryEntry: ChatHistory = {
        id: chatId,
        title: chatTitle, // Use first question as title
        timestamp: chatTimestamp, // Use timestamp from first question
        messageCount: messages.filter(m => m.type === 'user').length,
      };
      setChatHistory(prev => [newChatHistoryEntry, ...prev]);
      chat = newChatHistoryEntry;
    }
    
    // Load existing edited messages to preserve them
    const existingChat = chatStorage.loadChat(chatId);
    const editedMessages = existingChat?.editedMessages || {};
    
    const storedChat: StoredChat = {
      id: chatId,
      title: chat.title, // Use the title from chat history (which may have been updated)
      timestamp: chatTimestamp, // Use timestamp from first question
      messageCount: messages.filter(m => m.type === 'user').length,
      messages,
      conversationContext,
      expandedArticles: Array.from(expandedArticles),
      editedMessages // Preserve existing edited messages
    };
    chatStorage.saveChat(storedChat);
  }, [chatHistory]);

  const loadChat = useCallback((chatId: string) => {
    return chatStorage.loadChat(chatId);
  }, []);

  const saveEditedMessage = useCallback((messageId: string, editedContent: string) => {
    if (currentChatId) {
      chatStorage.saveEditedMessage(currentChatId, messageId, editedContent);
    }
  }, [currentChatId]);

  const getEditedMessage = useCallback((messageId: string) => {
    if (currentChatId) {
      return chatStorage.getEditedMessage(currentChatId, messageId);
    }
    return null;
  }, [currentChatId]);

  const clearEditedMessage = useCallback((messageId: string) => {
    if (currentChatId) {
      chatStorage.removeEditedMessage(currentChatId, messageId);
    }
  }, [currentChatId]);

  const value: ChatContextType = {
    chatHistory,
    currentChatId,
    addChat,
    selectChat,
    deleteChat,
    renameChat,
    updateCurrentChat,
    saveChat,
    loadChat,
    saveEditedMessage,
    getEditedMessage,
    clearEditedMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
