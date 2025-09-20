import express from 'express';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// Get restaurants near a location
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, cuisine } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius);

    // Build query
    let query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: searchRadius
        }
      }
    };

    // Add cuisine filter if provided
    if (cuisine && cuisine !== 'all') {
      query.cuisine = { $regex: cuisine, $options: 'i' };
    }

    // Increase limit but keep it reasonable to avoid overwhelming results
    const restaurants = await Restaurant.find(query).limit(500);

    res.json({
      success: true,
      count: restaurants.length,
      data: restaurants.map(restaurant => ({
        id: restaurant.externalId,
        name: restaurant.name,
        type: restaurant.type,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        lat: restaurant.location.coordinates[1],
        lng: restaurant.location.coordinates[0],
        phone: restaurant.phone,
        website: restaurant.website,
        opening_hours: restaurant.opening_hours,
        takeaway: restaurant.takeaway,
        delivery: restaurant.delivery
      }))
    });
  } catch (error) {
    console.error('Error searching restaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cache restaurants endpoint removed - restaurants are now saved only when users interact with them

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ externalId: req.params.id });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({
      success: true,
      data: {
        id: restaurant.externalId,
        name: restaurant.name,
        type: restaurant.type,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        lat: restaurant.location.coordinates[1],
        lng: restaurant.location.coordinates[0],
        phone: restaurant.phone,
        website: restaurant.website,
        opening_hours: restaurant.opening_hours,
        takeaway: restaurant.takeaway,
        delivery: restaurant.delivery
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;