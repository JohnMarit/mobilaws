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
  status: 'active' | 'ended' | 'scheduled' | 'dismissed';
  paymentPaid: boolean; // Whether user has paid for this chat
  dismissedAt?: admin.firestore.Timestamp; // When counselor dismissed the chat
  dismissedBy?: string; // Counselor ID who dismissed
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
      paymentPaid: true, // Chat is created after payment/acceptance
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

    // Send notification to counselor about new chat
    try {
      console.log('📤 Sending notification to counselor...');
      await sendChatNotificationToCounselor(counselorId, counselorName, userName, chatRef.id);
      console.log('✅ Notification sent to counselor!');
    } catch (notifError) {
      console.error('⚠️ Failed to send notification (non-critical):', notifError);
    }

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

    // Send notification to counselor when user sends a message
    if (senderRole === 'user') {
      const chatDoc = await chatRef.get();
      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        if (chatData?.counselorId) {
          await sendMessageNotificationToCounselor(
            chatData.counselorId,
            chatData.counselorName || 'Counselor',
            senderName,
            chatId,
            message
          );
        }
      }
    }

    console.log(`✅ Message sent in chat ${chatId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return false;
  }
}

/**
 * Send notification to counselor about new chat
 */
async function sendChatNotificationToCounselor(
  counselorId: string,
  counselorName: string,
  userName: string,
  chatId: string
): Promise<void> {
  const db = getFirestore();
  if (!db) return;

  try {
    // Get counselor's push tokens
    const tokensSnap = await db
      .collection('userPushTokens')
      .doc(counselorId)
      .collection('tokens')
      .get();
    
    const tokens = tokensSnap.docs.map(d => d.data().token as string).filter(Boolean);

    if (!tokens.length) {
      console.log('ℹ️ No push tokens found for counselor, skipping notification');
      return;
    }

    const messaging = admin.messaging();
    const title = `💬 New Chat from ${userName}`;
    const body = `${userName} has started a chat with you. Click to respond.`;

    const messages: admin.messaging.TokenMessage[] = tokens.map(token => ({
      token,
      notification: {
        title,
        body,
      },
      data: {
        type: 'new_chat',
        chatId,
        userName,
        counselorName,
        click_action: '/counselor',
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          vibrate: [200, 100, 200],
        },
      },
    }));

    // Send notifications
    const hasSendEach = typeof (messaging as any).sendEach === 'function';
    if (hasSendEach) {
      await (messaging as any).sendEach(messages);
    } else {
      await Promise.all(messages.map(msg => messaging.send(msg).catch(err => {
        console.error('Failed to send notification:', err);
      })));
    }

    console.log(`✅ Sent new chat notification to counselor ${counselorId}`);
  } catch (error) {
    console.error('❌ Error sending chat notification:', error);
    throw error;
  }
}

/**
 * Send notification to counselor about new message
 */
async function sendMessageNotificationToCounselor(
  counselorId: string,
  counselorName: string,
  userName: string,
  chatId: string,
  messageText: string
): Promise<void> {
  const db = getFirestore();
  if (!db) return;

  try {
    // Get counselor's push tokens
    const tokensSnap = await db
      .collection('userPushTokens')
      .doc(counselorId)
      .collection('tokens')
      .get();
    
    const tokens = tokensSnap.docs.map(d => d.data().token as string).filter(Boolean);

    if (!tokens.length) {
      console.log('ℹ️ No push tokens found for counselor, skipping message notification');
      return;
    }

    const messaging = admin.messaging();
    const title = `💬 ${userName}`;
    const body = messageText.substring(0, 100); // Truncate long messages

    const messages: admin.messaging.TokenMessage[] = tokens.map(token => ({
      token,
      notification: {
        title,
        body,
      },
      data: {
        type: 'new_message',
        chatId,
        userName,
        counselorName,
        message: messageText,
        click_action: '/counselor',
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          vibrate: [200, 100, 200],
          tag: chatId, // Group notifications by chat
          renotify: true,
        },
      },
    }));

    // Send notifications (don't await - fire and forget)
    const hasSendEach = typeof (messaging as any).sendEach === 'function';
    if (hasSendEach) {
      (messaging as any).sendEach(messages).catch((err: Error) => {
        console.error('Failed to send message notifications:', err);
      });
    } else {
      Promise.all(messages.map(msg => messaging.send(msg).catch(err => {
        console.error('Failed to send message notification:', err);
      }))).catch((err) => {
        console.error('Failed to send message notifications batch:', err);
      });
    }

    console.log(`✅ Sent message notification to counselor ${counselorId}`);
  } catch (error) {
    console.error('❌ Error sending message notification:', error);
    // Don't throw - notification failure shouldn't block message sending
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
  console.log(`🔍 getCounselorChats called with counselorId: ${counselorId}`);
  
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return [];
  }

  try {
    console.log(`📡 Querying counselChats collection for counselorId: ${counselorId}`);
    const snapshot = await db
      .collection(COUNSEL_CHATS_COLLECTION)
      .where('counselorId', '==', counselorId)
      .orderBy('updatedAt', 'desc')
      .get();

    console.log(`📊 Query result: ${snapshot.size} chat(s) found for counselor ${counselorId}`);
    
    const chats = snapshot.docs.map(doc => {
      const data = doc.data() as CounselChatSession;
      console.log(`  - Chat ${doc.id}: ${data.userName} (${data.status})`);
      return data;
    });
    
    return chats;
  } catch (error) {
    console.error('❌ Error getting counselor chats:', error);
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

/**
 * Dismiss chat session (counselor can dismiss, making it inactive until user pays again)
 */
export async function dismissChatSession(chatId: string, counselorId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const chatRef = db.collection(COUNSEL_CHATS_COLLECTION).doc(chatId);
    const chatDoc = await chatRef.get();
    
    if (!chatDoc.exists) {
      return false;
    }

    const chat = chatDoc.data() as CounselChatSession;
    if (chat.counselorId !== counselorId) {
      return false; // Only the counselor can dismiss
    }

    const now = admin.firestore.Timestamp.now();
    await chatRef.update({
      status: 'dismissed',
      paymentPaid: false, // Mark as unpaid so user needs to pay again
      dismissedAt: now,
      dismissedBy: counselorId,
      updatedAt: now,
    });

    await sendSystemMessage(chatId, 'Chat session dismissed by counselor. Payment required to continue.');
    return true;
  } catch (error) {
    console.error('❌ Error dismissing chat:', error);
    return false;
  }
}

/**
 * Reactivate chat after payment
 */
export async function reactivateChatSession(chatId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    await db.collection(COUNSEL_CHATS_COLLECTION).doc(chatId).update({
      status: 'active',
      paymentPaid: true,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    await sendSystemMessage(chatId, 'Chat session reactivated. You can continue your conversation.');
    return true;
  } catch (error) {
    console.error('❌ Error reactivating chat:', error);
    return false;
  }
}

