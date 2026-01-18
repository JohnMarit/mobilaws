/**
 * Discussions Storage
 * Handles community discussions, posts, likes, and comments
 */

import { getFirebaseAuth, admin } from './firebase-admin';
import { notifyAllUsersNewPost, notifyAllUsersNewComment } from './notifications-storage';

const DISCUSSIONS_COLLECTION = 'discussions';
const COMMENTS_COLLECTION = 'comments';
const LIKES_COLLECTION = 'likes';

export interface Discussion {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPicture?: string;
  userTier?: string; // 'premium' | 'standard' | 'basic' | 'free'
  title?: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface Comment {
  id: string;
  discussionId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPicture?: string;
  userTier?: string; // 'premium' | 'standard' | 'basic' | 'free'
  content: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface Like {
  id: string;
  discussionId: string;
  userId: string;
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
 * Create a new discussion post
 */
export async function createDiscussion(
  userId: string,
  userName: string,
  content: string,
  title?: string,
  userEmail?: string,
  userPicture?: string,
  userTier?: string
): Promise<string | null> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return null;
  }

  try {
    const discussionRef = db.collection(DISCUSSIONS_COLLECTION).doc();
    const now = admin.firestore.Timestamp.now();

    const discussion: any = {
      id: discussionRef.id,
      userId,
      userName,
      content,
      likesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (title) discussion.title = title;
    if (userEmail) discussion.userEmail = userEmail;
    if (userPicture) discussion.userPicture = userPicture;
    if (userTier) discussion.userTier = userTier;

    await discussionRef.set(discussion);
    console.log(`✅ Discussion created: ${discussionRef.id}`);
    
    // Notify all users about the new post (fire and forget)
    notifyAllUsersNewPost(userId, userName, discussionRef.id, content).catch(err => {
      console.error('Failed to send notifications:', err);
    });
    
    return discussionRef.id;
  } catch (error) {
    console.error('❌ Error creating discussion:', error);
    return null;
  }
}

/**
 * Get all discussions, ordered by creation date (newest first)
 */
export async function getDiscussions(limit: number = 50): Promise<Discussion[]> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return [];
  }

  try {
    const snapshot = await db
      .collection(DISCUSSIONS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const discussions: Discussion[] = [];
    snapshot.forEach((doc) => {
      discussions.push(doc.data() as Discussion);
    });

    return discussions;
  } catch (error) {
    console.error('❌ Error getting discussions:', error);
    return [];
  }
}

/**
 * Add a comment to a discussion
 */
export async function addComment(
  discussionId: string,
  userId: string,
  userName: string,
  content: string,
  userEmail?: string,
  userPicture?: string,
  userTier?: string
): Promise<string | null> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return null;
  }

  try {
    // Create comment
    const commentRef = db.collection(DISCUSSIONS_COLLECTION)
      .doc(discussionId)
      .collection(COMMENTS_COLLECTION)
      .doc();
    
    const now = admin.firestore.Timestamp.now();
    const comment: any = {
      id: commentRef.id,
      discussionId,
      userId,
      userName,
      content,
      createdAt: now,
      updatedAt: now,
    };

    if (userEmail) comment.userEmail = userEmail;
    if (userPicture) comment.userPicture = userPicture;
    if (userTier) comment.userTier = userTier;

    await commentRef.set(comment);

    // Update discussion comments count
    const discussionRef = db.collection(DISCUSSIONS_COLLECTION).doc(discussionId);
    await discussionRef.update({
      commentsCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    console.log(`✅ Comment added: ${commentRef.id}`);
    
    // Notify all users about the new comment (fire and forget)
    notifyAllUsersNewComment(userId, userName, discussionId, content).catch(err => {
      console.error('Failed to send notifications:', err);
    });
    
    return commentRef.id;
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    return null;
  }
}

/**
 * Get comments for a discussion
 */
export async function getComments(discussionId: string): Promise<Comment[]> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return [];
  }

  try {
    const snapshot = await db
      .collection(DISCUSSIONS_COLLECTION)
      .doc(discussionId)
      .collection(COMMENTS_COLLECTION)
      .orderBy('createdAt', 'asc')
      .get();

    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      comments.push(doc.data() as Comment);
    });

    return comments;
  } catch (error) {
    console.error('❌ Error getting comments:', error);
    return [];
  }
}

/**
 * Toggle like on a discussion
 * Returns true if liked, false if unliked
 */
export async function toggleLike(
  discussionId: string,
  userId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized!');
    return { success: false, liked: false, error: 'Firestore not initialized' };
  }

  try {
    const likeRef = db.collection(DISCUSSIONS_COLLECTION)
      .doc(discussionId)
      .collection(LIKES_COLLECTION)
      .doc(userId);

    const likeDoc = await likeRef.get();
    const discussionRef = db.collection(DISCUSSIONS_COLLECTION).doc(discussionId);
    const now = admin.firestore.Timestamp.now();

    if (likeDoc.exists) {
      // Unlike: remove like document and decrement count
      await likeRef.delete();
      await discussionRef.update({
        likesCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: now,
      });
      console.log(`✅ Like removed: ${discussionId} by ${userId}`);
      return { success: true, liked: false };
    } else {
      // Like: create like document and increment count
      await likeRef.set({
        id: userId,
        discussionId,
        userId,
        createdAt: now,
      });
      await discussionRef.update({
        likesCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });
      console.log(`✅ Like added: ${discussionId} by ${userId}`);
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('❌ Error toggling like:', error);
    return { success: false, liked: false, error: String(error) };
  }
}

/**
 * Check if a user has liked a discussion
 */
export async function hasUserLiked(discussionId: string, userId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const likeRef = db.collection(DISCUSSIONS_COLLECTION)
      .doc(discussionId)
      .collection(LIKES_COLLECTION)
      .doc(userId);

    const likeDoc = await likeRef.get();
    return likeDoc.exists;
  } catch (error) {
    console.error('❌ Error checking like:', error);
    return false;
  }
}

/**
 * Get like status for multiple discussions
 */
export async function getLikesForDiscussions(
  discussionIds: string[],
  userId: string
): Promise<Record<string, boolean>> {
  const db = getFirestore();
  if (!db) {
    return {};
  }

  const result: Record<string, boolean> = {};

  try {
    const promises = discussionIds.map(async (discussionId) => {
      const liked = await hasUserLiked(discussionId, userId);
      result[discussionId] = liked;
    });

    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error('❌ Error getting likes:', error);
    return {};
  }
}

/**
 * Update a discussion post
 */
export async function updateDiscussion(
  discussionId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const db = getFirestore();
  if (!db) {
    return { success: false, error: 'Firestore not initialized' };
  }

  try {
    const discussionRef = db.collection(DISCUSSIONS_COLLECTION).doc(discussionId);
    const discussionDoc = await discussionRef.get();

    if (!discussionDoc.exists) {
      return { success: false, error: 'Discussion not found' };
    }

    const discussion = discussionDoc.data() as Discussion;
    if (discussion.userId !== userId) {
      return { success: false, error: 'Unauthorized: You can only edit your own posts' };
    }

    await discussionRef.update({
      content: content.trim(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Discussion updated: ${discussionId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating discussion:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Delete a discussion post
 */
export async function deleteDiscussion(
  discussionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getFirestore();
  if (!db) {
    return { success: false, error: 'Firestore not initialized' };
  }

  try {
    const discussionRef = db.collection(DISCUSSIONS_COLLECTION).doc(discussionId);
    const discussionDoc = await discussionRef.get();

    if (!discussionDoc.exists) {
      return { success: false, error: 'Discussion not found' };
    }

    const discussion = discussionDoc.data() as Discussion;
    if (discussion.userId !== userId) {
      return { success: false, error: 'Unauthorized: You can only delete your own posts' };
    }

    // Delete all comments
    const commentsSnapshot = await discussionRef.collection(COMMENTS_COLLECTION).get();
    const deleteCommentsPromises = commentsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteCommentsPromises);

    // Delete all likes
    const likesSnapshot = await discussionRef.collection(LIKES_COLLECTION).get();
    const deleteLikesPromises = likesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteLikesPromises);

    // Delete the discussion itself
    await discussionRef.delete();

    console.log(`✅ Discussion deleted: ${discussionId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting discussion:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  discussionId: string,
  commentId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const db = getFirestore();
  if (!db) {
    return { success: false, error: 'Firestore not initialized' };
  }

  try {
    const commentRef = db.collection(DISCUSSIONS_COLLECTION)
      .doc(discussionId)
      .collection(COMMENTS_COLLECTION)
      .doc(commentId);

    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return { success: false, error: 'Comment not found' };
    }

    const comment = commentDoc.data() as Comment;
    if (comment.userId !== userId) {
      return { success: false, error: 'Unauthorized: You can only edit your own comments' };
    }

    await commentRef.update({
      content: content.trim(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Update discussion updatedAt
    const discussionRef = db.collection(DISCUSSIONS_COLLECTION).doc(discussionId);
    await discussionRef.update({
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Comment updated: ${commentId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating comment:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  discussionId: string,
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getFirestore();
  if (!db) {
    return { success: false, error: 'Firestore not initialized' };
  }

  try {
    const commentRef = db.collection(DISCUSSIONS_COLLECTION)
      .doc(discussionId)
      .collection(COMMENTS_COLLECTION)
      .doc(commentId);

    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return { success: false, error: 'Comment not found' };
    }

    const comment = commentDoc.data() as Comment;
    if (comment.userId !== userId) {
      return { success: false, error: 'Unauthorized: You can only delete your own comments' };
    }

    // Delete the comment
    await commentRef.delete();

    // Update discussion comments count and updatedAt
    const discussionRef = db.collection(DISCUSSIONS_COLLECTION).doc(discussionId);
    await discussionRef.update({
      commentsCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Comment deleted: ${commentId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    return { success: false, error: String(error) };
  }
}
