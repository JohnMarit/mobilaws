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
  counselorId: string;
  counselorName: string;
  status: 'active' | 'ended' | 'scheduled';
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
    const apiUrl = getApiUrl(`counsel/chat/${chatId}/messages?limit=${messageLimit}`);
    const response = await fetch(apiUrl);

    if (!response.ok) return [];

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('❌ Error getting messages:', error);
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
 * Get user's chats
 */
export async function getUserChats(userId: string): Promise<CounselChatSession[]> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/user/${userId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) return [];

    const data = await response.json();
    return data.chats || [];
  } catch (error) {
    console.error('❌ Error getting user chats:', error);
    return [];
  }
}

/**
 * Get counselor's chats
 */
export async function getCounselorChats(counselorId: string): Promise<CounselChatSession[]> {
  try {
    const apiUrl = getApiUrl(`counsel/chat/counselor/${counselorId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) return [];

    const data = await response.json();
    return data.chats || [];
  } catch (error) {
    console.error('❌ Error getting counselor chats:', error);
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
 * Subscribe to real-time messages
 */
export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  if (!db) {
    console.error('Firebase not initialized');
    return () => {};
  }

  const messagesRef = collection(db, 'counselChats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
      .reverse(); // Reverse to show oldest first
    
    callback(messages);
  });

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

