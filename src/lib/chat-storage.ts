import { ChatMessage } from '@/components/ChatMessage';
import { ChatHistory } from '@/components/Sidebar';
import { ConversationContext } from '@/lib/search';

export interface StoredChat {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  messages: ChatMessage[];
  conversationContext: ConversationContext;
  expandedArticles: number[];
  editedMessages: { [messageId: string]: string }; // Store edited content by message ID
}

export interface ChatStorageData {
  chats: StoredChat[];
  currentChatId: string | null;
}

const STORAGE_KEY = 'mobilaws-chat-storage';
const MAX_CHATS = 50; // Limit number of stored chats

export const chatStorage = {
  /**
   * Save chat data to localStorage
   */
  saveChat(chat: StoredChat): void {
    try {
      const data = this.loadAllChats();
      
      // Update or add the chat
      const existingIndex = data.chats.findIndex(c => c.id === chat.id);
      if (existingIndex >= 0) {
        data.chats[existingIndex] = chat;
      } else {
        data.chats.unshift(chat); // Add to beginning
      }
      
      // Limit number of chats
      if (data.chats.length > MAX_CHATS) {
        data.chats = data.chats.slice(0, MAX_CHATS);
      }
      
      // Sort by timestamp (newest first)
      data.chats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat to storage:', error);
    }
  },

  /**
   * Load a specific chat by ID
   */
  loadChat(chatId: string): StoredChat | null {
    try {
      const data = this.loadAllChats();
      const chat = data.chats.find(c => c.id === chatId);
      
      if (chat) {
        // Convert timestamp strings back to Date objects
        chat.timestamp = new Date(chat.timestamp);
        chat.messages.forEach(msg => {
          msg.timestamp = new Date(msg.timestamp);
        });
      }
      
      return chat || null;
    } catch (error) {
      console.error('Error loading chat from storage:', error);
      return null;
    }
  },

  /**
   * Load all chats
   */
  loadAllChats(): ChatStorageData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { chats: [], currentChatId: null };
      }
      
      const data: ChatStorageData = JSON.parse(stored);
      
      // Convert timestamp strings back to Date objects
      data.chats.forEach(chat => {
        chat.timestamp = new Date(chat.timestamp);
        chat.messages.forEach(msg => {
          msg.timestamp = new Date(msg.timestamp);
        });
      });
      
      return data;
    } catch (error) {
      console.error('Error loading chats from storage:', error);
      return { chats: [], currentChatId: null };
    }
  },

  /**
   * Save current chat ID
   */
  saveCurrentChatId(chatId: string | null): void {
    try {
      const data = this.loadAllChats();
      data.currentChatId = chatId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving current chat ID:', error);
    }
  },

  /**
   * Get current chat ID
   */
  getCurrentChatId(): string | null {
    try {
      const data = this.loadAllChats();
      return data.currentChatId;
    } catch (error) {
      console.error('Error getting current chat ID:', error);
      return null;
    }
  },

  /**
   * Delete a chat
   */
  deleteChat(chatId: string): void {
    try {
      const data = this.loadAllChats();
      data.chats = data.chats.filter(c => c.id !== chatId);
      
      // If we deleted the current chat, clear current chat ID
      if (data.currentChatId === chatId) {
        data.currentChatId = null;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error deleting chat from storage:', error);
    }
  },

  /**
   * Update chat title
   */
  updateChatTitle(chatId: string, newTitle: string): void {
    try {
      const data = this.loadAllChats();
      const chat = data.chats.find(c => c.id === chatId);
      if (chat) {
        chat.title = newTitle;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  },

  /**
   * Clear all chat data
   */
  clearAllChats(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing chat storage:', error);
    }
  },

  /**
   * Get chat history for sidebar
   */
  getChatHistory(): ChatHistory[] {
    try {
      const data = this.loadAllChats();
      return data.chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        timestamp: chat.timestamp,
        messageCount: chat.messageCount
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  },

  /**
   * Save edited message content
   */
  saveEditedMessage(chatId: string, messageId: string, editedContent: string): void {
    try {
      const data = this.loadAllChats();
      const chat = data.chats.find(c => c.id === chatId);
      
      if (chat) {
        if (!chat.editedMessages) {
          chat.editedMessages = {};
        }
        chat.editedMessages[messageId] = editedContent;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving edited message:', error);
    }
  },

  /**
   * Get edited message content
   */
  getEditedMessage(chatId: string, messageId: string): string | null {
    try {
      const data = this.loadAllChats();
      const chat = data.chats.find(c => c.id === chatId);
      
      if (chat && chat.editedMessages) {
        return chat.editedMessages[messageId] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting edited message:', error);
      return null;
    }
  },

  /**
   * Remove edited message content
   */
  removeEditedMessage(chatId: string, messageId: string): void {
    try {
      const data = this.loadAllChats();
      const chat = data.chats.find(c => c.id === chatId);
      
      if (chat && chat.editedMessages) {
        delete chat.editedMessages[messageId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error removing edited message:', error);
    }
  },

  /**
   * Clear all edited messages for a chat
   */
  clearEditedMessages(chatId: string): void {
    try {
      const data = this.loadAllChats();
      const chat = data.chats.find(c => c.id === chatId);
      
      if (chat) {
        chat.editedMessages = {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error clearing edited messages:', error);
    }
  },

  /**
   * Clean up empty chats (chats with no messages)
   */
  cleanupEmptyChats(): void {
    try {
      const data = this.loadAllChats();
      
      // Filter out chats with no messages
      data.chats = data.chats.filter(chat => 
        chat.messages && chat.messages.length > 0
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error cleaning up empty chats:', error);
    }
  }
};
