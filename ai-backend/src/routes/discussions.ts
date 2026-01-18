/**
 * Discussions API Routes
 * Handles community discussions, posts, likes, and comments
 */

import express, { Request, Response } from 'express';
import { optionalFirebaseAuth } from '../middleware/auth';
import {
  createDiscussion,
  getDiscussions,
  addComment,
  getComments,
  toggleLike,
  getLikesForDiscussions,
  Discussion,
  Comment,
} from '../lib/discussions-storage';

const router = express.Router();

/**
 * GET /api/discussions
 * Get all discussions
 */
router.get('/', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const discussions = await getDiscussions(limit);
    const userId = (req as any).user?.uid;

    // Get like status for all discussions if user is authenticated
    let likesMap: Record<string, boolean> = {};
    if (userId && discussions.length > 0) {
      const discussionIds = discussions.map(d => d.id);
      likesMap = await getLikesForDiscussions(discussionIds, userId);
    }

    // Format discussions with like status
    const formattedDiscussions = discussions.map(discussion => ({
      ...discussion,
      isLiked: userId ? (likesMap[discussion.id] || false) : false,
    }));

    res.json({
      success: true,
      discussions: formattedDiscussions,
    });
  } catch (error: any) {
    console.error('❌ Error getting discussions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get discussions',
      message: error.message,
    });
  }
});

/**
 * POST /api/discussions
 * Create a new discussion post
 */
router.post('/', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { content, title } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Content must be less than 5000 characters',
      });
    }

    const discussionId = await createDiscussion(
      user.uid,
      user.name || user.email?.split('@')[0] || 'Anonymous',
      content.trim(),
      title?.trim(),
      user.email,
      user.picture
    );

    if (!discussionId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create discussion',
      });
    }

    res.json({
      success: true,
      discussionId,
      message: 'Discussion created successfully',
    });
  } catch (error: any) {
    console.error('❌ Error creating discussion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create discussion',
      message: error.message,
    });
  }
});

/**
 * POST /api/discussions/:discussionId/comments
 * Add a comment to a discussion
 */
router.post('/:discussionId/comments', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { discussionId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be less than 2000 characters',
      });
    }

    const commentId = await addComment(
      discussionId,
      user.uid,
      user.name || user.email?.split('@')[0] || 'Anonymous',
      content.trim(),
      user.email,
      user.picture
    );

    if (!commentId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add comment',
      });
    }

    res.json({
      success: true,
      commentId,
      message: 'Comment added successfully',
    });
  } catch (error: any) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
      message: error.message,
    });
  }
});

/**
 * GET /api/discussions/:discussionId/comments
 * Get comments for a discussion
 */
router.get('/:discussionId/comments', async (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    const comments = await getComments(discussionId);

    res.json({
      success: true,
      comments,
    });
  } catch (error: any) {
    console.error('❌ Error getting comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comments',
      message: error.message,
    });
  }
});

/**
 * POST /api/discussions/:discussionId/like
 * Toggle like on a discussion
 */
router.post('/:discussionId/like', optionalFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { discussionId } = req.params;
    const result = await toggleLike(discussionId, user.uid);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to toggle like',
      });
    }

    res.json({
      success: true,
      liked: result.liked,
      message: result.liked ? 'Liked successfully' : 'Unliked successfully',
    });
  } catch (error: any) {
    console.error('❌ Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like',
      message: error.message,
    });
  }
});

export default router;
