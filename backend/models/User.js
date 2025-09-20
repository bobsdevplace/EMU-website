import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  visitedRestaurants: [{
    restaurantId: {
      type: String,
      required: true
    },
    visitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  interestedRestaurants: [{
    restaurantId: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notInterestedRestaurants: [{
    restaurantId: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedLocations: [{
    name: {
      type: String,
      required: true
    },
    coordinates: [{
      type: Number,
      required: true
    }],
    savedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ 'visitedRestaurants.restaurantId': 1 });

export default mongoose.model('User', userSchema);