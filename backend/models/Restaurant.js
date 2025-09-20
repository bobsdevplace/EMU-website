import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  // Use the external ID from OSM/Overpass API as our primary ID
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  cuisine: String,
  address: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  phone: String,
  website: String,
  opening_hours: String,
  takeaway: String,
  delivery: String,
  // Cache the data from external API
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Track which searches this restaurant appeared in
  searchLocations: [{
    name: String,
    coordinates: [Number],
    radius: Number,
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Geospatial index for location-based queries
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ externalId: 1 });
restaurantSchema.index({ name: 'text', cuisine: 'text' });

export default mongoose.model('Restaurant', restaurantSchema);