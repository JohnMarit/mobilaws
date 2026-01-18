/**
 * Notifications Storage
 * Handles user notifications for posts, comments, and other activities
 */

import { getFirebaseAuth, admin } from './firebase-admin';

const NOTIFICATIONS_COLLECTION = 'notifications';

export interface Notification {
  id: string;
  userId: string;
  type: 'new_post' | 'new_comment' | 'new_like' | 'system';
  title: string;
  message: string;
  discussionId?: string;
  commentId?: string;
  authorId?: string;
  authorName?: string;
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
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: 'new_post' | 'new_comment' | 'new_like' | 'system',
  title: string,
  message: string,
  discussionId?: string,
  commentId?: string,
  authorId?: string,
  authorName?: string
): Promise<string | null> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return null;
  }

  try {
    const notificationRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
    const now = admin.firestore.Timestamp.now();

    const notification: any = {
      id: notificationRef.id,
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: now,
    };

    if (discussionId) notification.discussionId = discussionId;
    if (commentId) notification.commentId = commentId;
    if (authorId) notification.authorId = authorId;
    if (authorName) notification.authorName = authorName;

    await notificationRef.set(notification);
    console.log(`✅ Notification created: ${notificationRef.id} for user ${userId}`);
    return notificationRef.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
}

/**
 * Create notifications for all users (except the author) when a post is created
 */
export async function notifyAllUsersNewPost(
  authorId: string,
  authorName: string,
  discussionId: string,
  content: string
): Promise<void> {
  const db = getFirestore();
  if (!db) return;

  try {
    // Get all user IDs from users collection
    const usersSnapshot = await db.collection('users').get();
    const userIds: string[] = [];

    usersSnapshot.forEach((doc) => {
      const userId = doc.id;
      // Don't notify the author
      if (userId !== authorId) {
        userIds.push(userId);
      }
    });

    // Create notifications for all users
    const notificationPromises = userIds.map(userId =>
      createNotification(
        userId,
        'new_post',
        'New Discussion Post',
        `${authorName} posted a new discussion: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        discussionId,
        undefined,
        authorId,
        authorName
      )
    );

    await Promise.all(notificationPromises);
    console.log(`✅ Sent notifications to ${userIds.length} users about new post`);
  } catch (error) {
    console.error('❌ Error notifying users about new post:', error);
  }
}

/**
 * Create notifications for all users (except the author) when a comment is created
 */
export async function notifyAllUsersNewComment(
  authorId: string,
  authorName: string,
  discussionId: string,
  commentContent: string
): Promise<void> {
  const db = getFirestore();
  if (!db) return;

  try {
    // Get all user IDs from users collection
    const usersSnapshot = await db.collection('users').get();
    const userIds: string[] = [];

    usersSnapshot.forEach((doc) => {
      const userId = doc.id;
      // Don't notify the comment author
      if (userId !== authorId) {
        userIds.push(userId);
      }
    });

    // Create notifications for all users
    const notificationPromises = userIds.map(userId =>
      createNotification(
        userId,
        'new_comment',
        'New Comment',
        `${authorName} commented: ${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}`,
        discussionId,
        undefined,
        authorId,
        authorName
      )
    );

    await Promise.all(notificationPromises);
    console.log(`✅ Sent notifications to ${userIds.length} users about new comment`);
  } catch (error) {
    console.error('❌ Error notifying users about new comment:', error);
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      notifications.push(doc.data() as Notification);
    });

    return notifications;
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const db = getFirestore();
  if (!db) {
    return 0;
  }

  try {
    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    await db
      .collection(NOTIFICATIONS_COLLECTION)
      .doc(notificationId)
      .update({ read: true });
    return true;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const snapshot = await db
      .collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    console.log(`✅ Marked ${snapshot.size} notifications as read for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return false;
  }
}
