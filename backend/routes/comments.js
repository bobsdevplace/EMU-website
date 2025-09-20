import express from 'express';
import Comment from '../models/Comment.js';

const router = express.Router();

// Get comments for a specific restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const comments = await Comment.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Comment.countDocuments({ restaurantId });

    res.json({
      success: true,
      data: comments,
      total,
      hasMore: (parseInt(offset) + comments.length) < total
    });
  } catch (error) {
    console.error('Error fetching restaurant comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

// Get comments by a specific user
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const comments = await Comment.find({ username })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Comment.countDocuments({ username });

    res.json({
      success: true,
      data: comments,
      total,
      hasMore: (parseInt(offset) + comments.length) < total
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user comments'
    });
  }
});

// Add a new comment
router.post('/', async (req, res) => {
  try {
    const { restaurantId, username, comment, rating } = req.body;

    // Validate required fields
    if (!restaurantId || !username || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID, username, and comment are required'
      });
    }

    // Validate comment length
    if (comment.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be 500 characters or less'
      });
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const newComment = new Comment({
      restaurantId,
      username,
      comment: comment.trim(),
      rating: rating || null
    });

    await newComment.save();

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// Update a comment (only by the original author)
router.put('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { username, comment, rating } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Only allow the original author to edit
    if (existingComment.username !== username) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own comments'
      });
    }

    // Update fields if provided
    if (comment !== undefined) {
      if (comment.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Comment must be 500 characters or less'
        });
      }
      existingComment.comment = comment.trim();
    }

    if (rating !== undefined) {
      if (rating !== null && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }
      existingComment.rating = rating;
    }

    existingComment.updatedAt = new Date();
    await existingComment.save();

    res.json({
      success: true,
      data: existingComment,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
});

// Delete a comment (only by the original author)
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Only allow the original author to delete
    if (existingComment.username !== username) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own comments'
      });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

// Get comment statistics for a restaurant
router.get('/stats/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const stats = await Comment.aggregate([
      { $match: { restaurantId } },
      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingsCount: {
            $sum: {
              $cond: [{ $ne: ['$rating', null] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalComments: 0,
      averageRating: null,
      ratingsCount: 0
    };

    // Round average rating to 1 decimal place
    if (result.averageRating) {
      result.averageRating = Math.round(result.averageRating * 10) / 10;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comment statistics'
    });
  }
});

export default router;