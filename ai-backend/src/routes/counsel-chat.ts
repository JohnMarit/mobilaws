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
} from '../lib/counsel-chat-storage';

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
    const chats = await getCounselorChats(counselorId);

    res.json({ success: true, chats });
  } catch (error) {
    console.error('❌ Error getting counselor chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
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

export default router;

