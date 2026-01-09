/**
 * Counsel Chat Service
 * Frontend service for real-time chat between users and counselors
 */

import { getApiUrl } from './api';
import { db } from './firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

export interface CounselChatSession {
  id: string;
  requestId?: string;
  appointmentId?: string;
  userId: string;
  userName: string;
  userEmail?: string; // User's email for gravatar
  counselorId: string;
  counselorName: string;
  counselorEmail?: string; // Counselor's email for gravatar
  status: 'active' | 'ended' | 'scheduled' | 'dismissed';
  paymentPaid?: boolean; // Whether user has paid for this chat
  dismissedAt?: Timestamp; // When counselor dismissed the chat
  dismissedBy?: string; // Counselor ID who dismissed
  endedAt?: Timestamp; // When chat was ended
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCountUser: number;
  unreadCountCounselor: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'counselor';
  message: string;
  messageType: 'text' | 'voice' | 'system';
  voiceUrl?: string;
  voiceDuration?: number;
  read: boolean;
  createdAt: Timestamp;
}

/**
 * Send a chat message
 */
export async function sendChatMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: 'user' | 'counselor',
  message: string,
  messageType: 'text' | 'voice' = 'text',
  voiceUrl?: string,
  voiceDuration?: number
): Promise<boolean> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/${chatId}/message`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId,
        senderName,
        senderRole,
        message,
        messageType,
        voiceUrl,
        voiceDuration,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return false;
  }
}

/**
 * Get chat messages
 */
export async function getChatMessages(chatId: string, messageLimit: number = 50): Promise<ChatMessage[]> {
  try {
    console.log(`📡 [API] Fetching messages for chat ${chatId} (limit: ${messageLimit})`);
    const apiUrl = getApiUrl(`counsel/chat/${chatId}/messages?limit=${messageLimit}`);
    console.log(`   - URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`   - Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ [API] Failed to fetch messages: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`✅ [API] Received ${data.messages?.length || 0} messages from API`);
    
    if (data.messages && data.messages.length > 0) {
      console.log(`   - First message:`, {
        id: data.messages[0].id,
        sender: data.messages[0].senderName,
        role: data.messages[0].senderRole,
        message: data.messages[0].message?.substring(0, 30)
      });
    }
    
    return data.messages || [];
  } catch (error) {
    console.error('❌ [API] Error getting messages:', error);
    return [];
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  chatId: string,
  userId: string,
  userRole: 'user' | 'counselor'
): Promise<boolean> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/${chatId}/read`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userRole }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    return false;
  }
}

/**
 * Get chat by request ID
 */
export async function getChatByRequestId(requestId: string): Promise<CounselChatSession | null> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/by-request/${requestId}`);
    console.log(`🔍 Fetching chat for request ${requestId} from:`, apiUrl);
    
    const response = await fetch(apiUrl);
    console.log(`📡 Chat fetch response status:`, response.status, response.statusText);

    if (!response.ok) {
      console.error(`❌ Chat fetch failed:`, response.status, await response.text());
      return null;
    }

    const data = await response.json();
    console.log(`✅ Chat data received:`, data);
    return data.chat;
  } catch (error) {
    console.error('❌ Error getting chat:', error);
    return null;
  }
}

/**
 * Get chat by appointment ID
 */
export async function getChatByAppointmentId(appointmentId: string): Promise<CounselChatSession | null> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/by-appointment/${appointmentId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) return null;

    const data = await response.json();
    return data.chat;
  } catch (error) {
    console.error('❌ Error getting chat:', error);
    return null;
  }
}

/**
 * Get chat by chat ID
 */
export async function getChatById(chatId: string): Promise<CounselChatSession | null> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/${chatId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) return null;

    const data = await response.json();
    return data.chat;
  } catch (error) {
    console.error('❌ Error getting chat by ID:', error);
    return null;
  }
}

/**
 * Get user's chats
 */
export async function getUserChats(userId: string): Promise<CounselChatSession[]> {
  try {
    console.log(`📡 [API] Fetching chats for user: ${userId}`);
    const apiUrl = getApiUrl(`counsel/chat/user/${userId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`❌ [API] Failed to fetch user chats: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`✅ [API] Received ${data.chats?.length || 0} chats for user ${userId}`);
    return data.chats || [];
  } catch (error) {
    console.error('❌ [API] Error getting user chats:', error);
    return [];
  }
}

/**
 * Get counselor's chats
 */
export async function getCounselorChats(counselorId: string): Promise<CounselChatSession[]> {
  try {
    console.log(`🌐 [CHAT-SERVICE] getCounselorChats called for counselorId: ${counselorId}`);
    const apiUrl = getApiUrl(`counsel/chat/counselor/${counselorId}`);
    console.log(`   - API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`   - Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ [CHAT-SERVICE] Failed to fetch counselor chats: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`✅ [CHAT-SERVICE] Received data:`, data);
    console.log(`   - Chats count: ${data.chats?.length || 0}`);
    
    return data.chats || [];
  } catch (error) {
    console.error('❌ [CHAT-SERVICE] Error getting counselor chats:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
    }
    return [];
  }
}

/**
 * End chat session
 */
export async function endChatSession(chatId: string): Promise<boolean> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/${chatId}/end`);
    const response = await fetch(apiUrl, {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error ending chat:', error);
    return false;
  }
}

/**
 * Dismiss chat session (counselor only)
 */
export async function dismissChatSession(chatId: string, counselorId: string): Promise<boolean> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/${chatId}/dismiss`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counselorId }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error dismissing chat:', error);
    return false;
  }
}

/**
 * Reactivate chat after payment
 */
export async function reactivateChatSession(chatId: string): Promise<boolean> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/${chatId}/reactivate`);
    const response = await fetch(apiUrl, {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error reactivating chat:', error);
    return false;
  }
}

/**
 * Subscribe to real-time messages
 */
export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  if (!db) {
    console.error('❌ Firebase not initialized');
    return () => {};
  }

  console.log(`📡 [SUBSCRIPTION] Setting up real-time listener for chat: ${chatId}`);
  console.log(`   - Firebase path: counselChats/${chatId}/messages`);
  
  const messagesRef = collection(db, 'counselChats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

  let initialLoad = true;
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log(`📨 [SNAPSHOT ${initialLoad ? 'INITIAL' : 'UPDATE'}] Received ${snapshot.docs.length} messages for chat ${chatId}`);
      
      if (snapshot.docs.length === 0) {
        console.warn(`⚠️ No messages found in chat ${chatId}`);
      }
      
      const messages = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const message = { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt || doc.data().createdAt
          } as ChatMessage;
          
          if (initialLoad) {
            console.log(`   📄 Message ${doc.id}:`, {
              sender: message.senderName,
              role: message.senderRole,
              type: message.messageType,
              text: message.message?.substring(0, 30)
            });
          }
          
          return message;
        })
        .reverse(); // Reverse to show oldest first
      
      console.log(`✅ [CALLBACK] Calling callback with ${messages.length} messages`);
      callback(messages);
      
      if (initialLoad) {
        initialLoad = false;
      }
    },
    (error) => {
      console.error(`❌ [SUBSCRIPTION ERROR] Error in message subscription for chat ${chatId}:`, error);
      console.error(`   - Error code:`, error.code);
      console.error(`   - Error message:`, error.message);
      
      // If there's an index error, try without orderBy as fallback
      if (error.code === 'failed-precondition') {
        console.warn('⚠️ Index missing, trying without orderBy...');
        const fallbackQuery = query(messagesRef, limit(50));
        onSnapshot(fallbackQuery, (snapshot) => {
          console.log(`📨 [FALLBACK] Received ${snapshot.docs.length} messages (no ordering)`);
          const messages = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
              const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
              return aTime - bTime;
            });
          callback(messages);
        });
      }
    }
  );

  console.log(`✅ [SUBSCRIPTION] Listener set up successfully for chat ${chatId}`);
  return unsubscribe;
}

/**
 * Subscribe to chat session updates
 */
export function subscribeToChatSession(
  chatId: string,
  callback: (chat: CounselChatSession) => void
): () => void {
  if (!db) {
    console.error('Firebase not initialized');
    return () => {};
  }

  const chatRef = collection(db, 'counselChats');
  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    const chatDoc = snapshot.docs.find(doc => doc.id === chatId);
    if (chatDoc) {
      callback({ id: chatDoc.id, ...chatDoc.data() } as CounselChatSession);
    }
  });

  return unsubscribe;
}

