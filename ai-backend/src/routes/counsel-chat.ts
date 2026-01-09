/**
 * Counsel Chat API Routes
 * Real-time chat between users and counselors
 */

import { Router, Request, Response } from 'express';
import {
  sendChatMessage,
  getChatMessages,
  markMessagesAsRead,
  getChatByRequestId,
  getChatByAppointmentId,
  getUserChats,
  getCounselorChats,
  endChatSession,
  dismissChatSession,
  reactivateChatSession,
} from '../lib/counsel-chat-storage';
import { getFirebaseAuth, admin } from '../lib/firebase-admin';

const router = Router();

/**
 * Send a chat message
 * POST /api/counsel/chat/:chatId/message
 */
router.post('/chat/:chatId/message', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { senderId, senderName, senderRole, message, messageType, voiceUrl, voiceDuration } = req.body;

    if (!senderId || !senderName || !senderRole || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: senderId, senderName, senderRole, message' 
      });
    }

    const success = await sendChatMessage(
      chatId,
      senderId,
      senderName,
      senderRole,
      message,
      messageType || 'text',
      voiceUrl,
      voiceDuration
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Get chat messages
 * GET /api/counsel/chat/:chatId/messages
 */
router.get('/chat/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await getChatMessages(chatId, limit);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * Mark messages as read
 * POST /api/counsel/chat/:chatId/read
 */
router.post('/chat/:chatId/read', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { userId, userRole } = req.body;

    if (!userId || !userRole) {
      return res.status(400).json({ error: 'Missing userId or userRole' });
    }

    const success = await markMessagesAsRead(chatId, userId, userRole);

    if (!success) {
      return res.status(500).json({ error: 'Failed to mark messages as read' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/**
 * Get chat by request ID
 * GET /api/counsel/chat/by-request/:requestId
 */
router.get('/chat/by-request/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const chat = await getChatByRequestId(requestId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('❌ Error getting chat:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

/**
 * Get chat by appointment ID
 * GET /api/counsel/chat/by-appointment/:appointmentId
 */
router.get('/chat/by-appointment/:appointmentId', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const chat = await getChatByAppointmentId(appointmentId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('❌ Error getting chat:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

/**
 * Get chat by chat ID
 * GET /api/counsel/chat/:chatId
 */
router.get('/chat/:chatId', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const auth = getFirebaseAuth();
    if (!auth) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const db = admin.firestore();
    const chatDoc = await db.collection('counselChats').doc(chatId).get();
    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatDoc.data() as any;
    res.json({ success: true, chat });
  } catch (error) {
    console.error('❌ Error getting chat:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

/**
 * Get user's chats
 * GET /api/counsel/chat/user/:userId
 */
router.get('/chat/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const chats = await getUserChats(userId);

    res.json({ success: true, chats });
  } catch (error) {
    console.error('❌ Error getting user chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

/**
 * Get counselor's chats
 * GET /api/counsel/chat/counselor/:counselorId
 */
router.get('/chat/counselor/:counselorId', async (req: Request, res: Response) => {
  try {
    const { counselorId } = req.params;
    console.log(`📥 [API] GET /chat/counselor/${counselorId} - Request received`);
    
    const chats = await getCounselorChats(counselorId);
    
    console.log(`📤 [API] Returning ${chats.length} chats for counselor ${counselorId}`);
    if (chats.length > 0) {
      console.log(`   📋 [API] Chat summary:`);
      chats.forEach((chat, i) => {
        console.log(`      ${i + 1}. Chat ${chat.id}: ${chat.userName} (${chat.status}, unread: ${chat.unreadCountCounselor})`);
      });
    } else {
      console.log(`   ⚠️ [API] No chats found for counselor ${counselorId}`);
    }

    res.json({ success: true, chats });
  } catch (error) {
    console.error('❌ [API] Error getting counselor chats:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
    }
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

/**
 * Delete messages (counselor only)
 * POST /api/counsel/chat/:chatId/messages/delete
 */
router.post('/chat/:chatId/messages/delete', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'messageIds array is required' });
    }

    console.log(`🗑️ [API] Deleting ${messageIds.length} messages from chat ${chatId}`);

    const { deleteMessages } = await import('../lib/counsel-chat-storage');
    const success = await deleteMessages(chatId, messageIds);

    if (success) {
      console.log(`✅ [API] Deleted ${messageIds.length} messages from chat ${chatId}`);
      res.json({ success: true, message: `Deleted ${messageIds.length} messages` });
    } else {
      res.status(500).json({ error: 'Failed to delete messages' });
    }
  } catch (error) {
    console.error('❌ [API] Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

/**
 * Delete chat conversations (counselor only)
 * POST /api/counsel/chat/delete
 */
router.post('/chat/delete', async (req: Request, res: Response) => {
  try {
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ error: 'chatIds array is required' });
    }

    console.log(`🗑️ [API] Deleting ${chatIds.length} chat conversation(s)`);

    const { deleteChatConversations } = await import('../lib/counsel-chat-storage');
    const success = await deleteChatConversations(chatIds);

    if (success) {
      console.log(`✅ [API] Deleted ${chatIds.length} chat conversation(s)`);
      res.json({ success: true, message: `Deleted ${chatIds.length} conversation(s)` });
    } else {
      res.status(500).json({ error: 'Failed to delete conversations' });
    }
  } catch (error) {
    console.error('❌ [API] Error deleting conversations:', error);
    res.status(500).json({ error: 'Failed to delete conversations' });
  }
});

/**
 * End chat session
 * POST /api/counsel/chat/:chatId/end
 */
router.post('/chat/:chatId/end', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const success = await endChatSession(chatId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to end chat' });
    }

    res.json({ success: true, message: 'Chat ended' });
  } catch (error) {
    console.error('❌ Error ending chat:', error);
    res.status(500).json({ error: 'Failed to end chat' });
  }
});

/**
 * Dismiss chat session (counselor only)
 * POST /api/counsel/chat/:chatId/dismiss
 */
router.post('/chat/:chatId/dismiss', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { counselorId } = req.body;

    if (!counselorId) {
      return res.status(400).json({ error: 'Counselor ID is required' });
    }

    const success = await dismissChatSession(chatId, counselorId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to dismiss chat' });
    }

    res.json({ success: true, message: 'Chat dismissed. User needs to pay again to continue.' });
  } catch (error) {
    console.error('❌ Error dismissing chat:', error);
    res.status(500).json({ error: 'Failed to dismiss chat' });
  }
});

/**
 * Reactivate chat after payment
 * POST /api/counsel/chat/:chatId/reactivate
 */
router.post('/chat/:chatId/reactivate', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const success = await reactivateChatSession(chatId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to reactivate chat' });
    }

    res.json({ success: true, message: 'Chat reactivated' });
  } catch (error) {
    console.error('❌ Error reactivating chat:', error);
    res.status(500).json({ error: 'Failed to reactivate chat' });
  }
});

export default router;

