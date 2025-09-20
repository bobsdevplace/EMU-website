import mongoose from 'mongoose';

const socialFeedSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  restaurantId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['visited', 'interested', 'not_interested'],
    default: 'visited'
  },
  location: {
    name: String,
    coordinates: [Number]
  }
}, {
  timestamps: true
});

// Index for faster queries (most recent first)
socialFeedSchema.index({ createdAt: -1 });
socialFeedSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SocialFeed', socialFeedSchema);