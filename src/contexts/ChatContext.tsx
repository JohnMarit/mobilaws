import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChatHistory } from '@/components/Sidebar';

interface ChatContextType {
  chatHistory: ChatHistory[];
  currentChatId: string | null;
  addChat: (title: string) => string;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  updateCurrentChat: (title: string) => void;
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

  const addChat = useCallback((title: string): string => {
    const newChat: ChatHistory = {
      id: `chat-${Date.now()}`,
      title,
      timestamp: new Date(),
      messageCount: 0,
    };
    
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  }, [currentChatId]);

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  }, []);

  const updateCurrentChat = useCallback((title: string) => {
    if (currentChatId) {
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === currentChatId ? { ...chat, title } : chat
        )
      );
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
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
