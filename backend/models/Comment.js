import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  restaurantId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null // Optional rating
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
commentSchema.index({ restaurantId: 1, createdAt: -1 });
commentSchema.index({ username: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);