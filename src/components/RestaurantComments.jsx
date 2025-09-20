import React, { useState, useEffect } from 'react';
import apiService from '../services/api.js';

const RestaurantComments = ({ restaurantId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(null);
  const [addingComment, setAddingComment] = useState(false);
  const [editingComment, setEditingComment] = useState(null);

  useEffect(() => {
    loadCommentStats();
  }, [restaurantId]);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, restaurantId]);

  const loadCommentStats = async () => {
    try {
      const response = await apiService.getCommentStats(restaurantId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading comment stats:', error);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await apiService.getRestaurantComments(restaurantId);
      if (response.success) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    setAddingComment(true);
    try {
      const response = await apiService.addComment(
        restaurantId,
        currentUser,
        newComment.trim(),
        newRating
      );

      if (response.success) {
        setNewComment('');
        setNewRating(null);
        await loadComments();
        await loadCommentStats();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await apiService.deleteComment(commentId, currentUser);
      if (response.success) {
        await loadComments();
        await loadCommentStats();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= (rating || 0) ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={interactive && onRatingChange ? () => onRatingChange(i === rating ? null : i) : undefined}
        >
          ★
        </span>
      );
    }
    return <div className="stars">{stars}</div>;
  };

  return (
    <div className="restaurant-comments">
      <div className="comments-summary">
        <button
          className="comments-toggle"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comments ({stats?.totalComments || 0})
          {stats?.averageRating && (
            <span className="average-rating">
              {renderStars(stats.averageRating)} ({stats.averageRating}/5)
            </span>
          )}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {currentUser && (
            <div className="add-comment">
              <h4>Add a comment</h4>
              <div className="rating-input">
                <label>Rating:</label>
                {renderStars(newRating, true, setNewRating)}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder=""
                maxLength={500}
                rows={3}
              />
              <div className="comment-actions">
                <span className="char-count">{newComment.length}/500</span>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                  className="add-comment-btn"
                >
                  {addingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>
          )}

          <div className="comments-list">
            {loading ? (
              <p>Loading comments...</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.username}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  {comment.rating && (
                    <div className="comment-rating">
                      {renderStars(comment.rating)}
                    </div>
                  )}
                  <p className="comment-text">{comment.comment}</p>
                  {comment.username === currentUser && (
                    <div className="comment-actions">
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="delete-comment-btn"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantComments;