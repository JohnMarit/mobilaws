/**
 * Notifications API Routes
 * Handles user notifications
 */

import express, { Request, Response } from 'express';
import { optionalFirebaseAuth } from '../middleware/auth';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../lib/notifications-storage';

const router = express.Router();

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
router.get('/', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await getUserNotifications(user.uid, limit);

    res.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error('❌ Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      message: error.message,
    });
  }
});

/**
 * GET /api/notifications/count
 * Get unread notification count for the current user
 */
router.get('/count', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.json({
        success: true,
        count: 0,
      });
    }

    const count = await getUnreadNotificationCount(user.uid);

    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('❌ Error getting notification count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification count',
      message: error.message,
    });
  }
});

/**
 * POST /api/notifications/:notificationId/read
 * Mark a notification as read
 */
router.post('/:notificationId/read', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { notificationId } = req.params;
    const success = await markNotificationAsRead(notificationId);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message,
    });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
router.post('/read-all', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const success = await markAllNotificationsAsRead(user.uid);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read',
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: error.message,
    });
  }
});

export default router;
