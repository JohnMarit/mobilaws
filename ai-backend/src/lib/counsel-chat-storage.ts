/**
 * Counsel Chat Storage
 * Handles real-time chat between users and counselors
 */

import { getFirebaseAuth, admin } from './firebase-admin';

const COUNSEL_CHATS_COLLECTION = 'counselChats';
const CHAT_MESSAGES_COLLECTION = 'messages';

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
  lastMessageAt?: admin.firestore.Timestamp;
  unreadCountUser: number;
  unreadCountCounselor: number;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
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
  createdAt: admin.firestore.Timestamp;
}

function getFirestore(): admin.firestore.Firestore | null {
  try {
    return admin.firestore();
  } catch (error) {
    console.error('❌ Error getting Firestore:', error);
    return null;
  }
}

/**
 * Create a chat session when counselor accepts request
 */
export async function createChatSession(
  requestId: string | null,
  appointmentId: string | null,
  userId: string,
  userName: string,
  counselorId: string,
  counselorName: string
): Promise<string | null> {
  console.log(`📝 createChatSession called with:`, {
    requestId,
    appointmentId,
    userId,
    userName,
    counselorId,
    counselorName
  });
  
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return null;
  }
  
  console.log('✅ Firestore connection OK');

  try {
    const chatRef = db.collection(COUNSEL_CHATS_COLLECTION).doc();
    console.log(`📄 Creating chat document with ID: ${chatRef.id}`);
    
    const now = admin.firestore.Timestamp.now();

    const chatSession: any = {
      id: chatRef.id,
      userId,
      userName,
      counselorId,
      counselorName,
      status: 'active',
      unreadCountUser: 0,
      unreadCountCounselor: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    // Only add requestId/appointmentId if they exist (Firestore doesn't allow undefined)
    if (requestId) {
      chatSession.requestId = requestId;
    }
    if (appointmentId) {
      chatSession.appointmentId = appointmentId;
    }

    console.log('📤 Saving chat session to Firestore...');
    await chatRef.set(chatSession);
    console.log('✅ Chat session saved!');

    // Send initial system message
    console.log('📤 Sending system message...');
    await sendSystemMessage(
      chatRef.id,
      `Chat session started between ${userName} and ${counselorName}`
    );
    console.log('✅ System message sent!');

    console.log(`✅ Chat session created successfully: ${chatRef.id}`);
    return chatRef.id;
  } catch (error) {
    console.error('❌ Error creating chat session:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    return null;
  }
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
  const db = getFirestore();
  if (!db) return false;

  try {
    const messageRef = db
      .collection(COUNSEL_CHATS_COLLECTION)
      .doc(chatId)
      .collection(CHAT_MESSAGES_COLLECTION)
      .doc();

    const now = admin.firestore.Timestamp.now();

    const chatMessage: any = {
      id: messageRef.id,
      chatId,
      senderId,
      senderName,
      senderRole,
      message,
      messageType,
      read: false,
      createdAt: now,
    };
    
    // Only add voice fields if they exist (Firestore doesn't allow undefined)
    if (voiceUrl) {
      chatMessage.voiceUrl = voiceUrl;
    }
    if (voiceDuration !== undefined && voiceDuration !== null) {
      chatMessage.voiceDuration = voiceDuration;
    }

    await messageRef.set(chatMessage);

    // Update chat session
    const chatRef = db.collection(COUNSEL_CHATS_COLLECTION).doc(chatId);
    const updateData: any = {
      lastMessage: messageType === 'voice' ? '🎤 Voice message' : message.substring(0, 100),
      lastMessageAt: now,
      updatedAt: now,
    };

    // Increment unread count for recipient
    if (senderRole === 'user') {
      updateData.unreadCountCounselor = admin.firestore.FieldValue.increment(1);
    } else {
      updateData.unreadCountUser = admin.firestore.FieldValue.increment(1);
    }

    await chatRef.update(updateData);

    console.log(`✅ Message sent in chat ${chatId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return false;
  }
}

/**
 * Send system message
 */
export async function sendSystemMessage(
  chatId: string,
  message: string
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const messageRef = db
      .collection(COUNSEL_CHATS_COLLECTION)
      .doc(chatId)
      .collection(CHAT_MESSAGES_COLLECTION)
      .doc();

    const now = admin.firestore.Timestamp.now();

    const chatMessage: any = {
      id: messageRef.id,
      chatId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'user', // arbitrary
      message,
      messageType: 'system',
      read: true,
      createdAt: now,
    };

    await messageRef.set(chatMessage);
    return true;
  } catch (error) {
    console.error('❌ Error sending system message:', error);
    return false;
  }
}

/**
 * Get chat messages
 */
export async function getChatMessages(
  chatId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COUNSEL_CHATS_COLLECTION)
      .doc(chatId)
      .collection(CHAT_MESSAGES_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as ChatMessage).reverse();
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
  const db = getFirestore();
  if (!db) return false;

  try {
    // Update chat unread count
    const chatRef = db.collection(COUNSEL_CHATS_COLLECTION).doc(chatId);
    const updateData: any = {
      [userRole === 'user' ? 'unreadCountUser' : 'unreadCountCounselor']: 0,
    };
    await chatRef.update(updateData);

    // Mark messages as read
    const messagesSnapshot = await db
      .collection(COUNSEL_CHATS_COLLECTION)
      .doc(chatId)
      .collection(CHAT_MESSAGES_COLLECTION)
      .where('read', '==', false)
      .where('senderRole', '==', userRole === 'user' ? 'counselor' : 'user')
      .get();

    const batch = db.batch();
    messagesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    return false;
  }
}

/**
 * Get chat session by request ID
 */
export async function getChatByRequestId(requestId: string): Promise<CounselChatSession | null> {
  console.log(`🔍 getChatByRequestId called with requestId: ${requestId}`);
  
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return null;
  }

  try {
    console.log(`📡 Querying counselChats collection for requestId: ${requestId}`);
    const snapshot = await db
      .collection(COUNSEL_CHATS_COLLECTION)
      .where('requestId', '==', requestId)
      .limit(1)
      .get();

    console.log(`📊 Query result: ${snapshot.size} document(s) found`);
    
    if (snapshot.empty) {
      console.log(`⚠️ No chat found for requestId: ${requestId}`);
      return null;
    }
    
    const chat = snapshot.docs[0].data() as CounselChatSession;
    console.log(`✅ Chat found:`, { id: chat.id, requestId: chat.requestId, status: chat.status });
    return chat;
  } catch (error) {
    console.error('❌ Error getting chat by request:', error);
    return null;
  }
}

/**
 * Get chat session by appointment ID
 */
export async function getChatByAppointmentId(appointmentId: string): Promise<CounselChatSession | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    const snapshot = await db
      .collection(COUNSEL_CHATS_COLLECTION)
      .where('appointmentId', '==', appointmentId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as CounselChatSession;
  } catch (error) {
    console.error('❌ Error getting chat by appointment:', error);
    return null;
  }
}

/**
 * Get user's active chats
 */
export async function getUserChats(userId: string): Promise<CounselChatSession[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COUNSEL_CHATS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as CounselChatSession);
  } catch (error) {
    console.error('❌ Error getting user chats:', error);
    return [];
  }
}

/**
 * Get counselor's active chats
 */
export async function getCounselorChats(counselorId: string): Promise<CounselChatSession[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COUNSEL_CHATS_COLLECTION)
      .where('counselorId', '==', counselorId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as CounselChatSession);
  } catch (error) {
    console.error('❌ Error getting counselor chats:', error);
    return [];
  }
}

/**
 * End chat session
 */
export async function endChatSession(chatId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    await db.collection(COUNSEL_CHATS_COLLECTION).doc(chatId).update({
      status: 'ended',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    await sendSystemMessage(chatId, 'Chat session ended');
    return true;
  } catch (error) {
    console.error('❌ Error ending chat:', error);
    return false;
  }
}

