import express from 'express';
import User from '../models/User.js';
import SocialFeed from '../models/SocialFeed.js';
import { ensureRestaurantExists } from '../utils/restaurantHelper.js';

const router = express.Router();

// Get or create user
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    let user = await User.findOne({ username });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({ username });
      await user.save();
    }

    res.json({
      success: true,
      data: {
        username: user.username,
        visitedRestaurants: user.visitedRestaurants.map(v => v.restaurantId),
        interestedRestaurants: user.interestedRestaurants.map(i => i.restaurantId),
        notInterestedRestaurants: user.notInterestedRestaurants.map(n => n.restaurantId),
        savedLocations: user.savedLocations
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle visited restaurant
router.post('/:username/visited/:restaurantId', async (req, res) => {
  try {
    const { username, restaurantId } = req.params;
    const { restaurantName, restaurantData, action = 'toggle' } = req.body;

    // Ensure restaurant exists in database when user interacts with it
    if (restaurantData) {
      await ensureRestaurantExists(restaurantData);
    }

    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
    }

    const isCurrentlyVisited = user.visitedRestaurants.some(v => v.restaurantId === restaurantId);

    if (action === 'toggle') {
      if (isCurrentlyVisited) {
        // Remove from visited
        user.visitedRestaurants = user.visitedRestaurants.filter(v => v.restaurantId !== restaurantId);
      } else {
        // Add to visited
        user.visitedRestaurants.push({ restaurantId });

        // Add to social feed
        if (restaurantName) {
          const feedEntry = new SocialFeed({
            user: username,
            restaurantName,
            restaurantId,
            action: 'visited'
          });
          await feedEntry.save();
        }
      }
    } else if (action === 'add' && !isCurrentlyVisited) {
      user.visitedRestaurants.push({ restaurantId });

      if (restaurantName) {
        const feedEntry = new SocialFeed({
          user: username,
          restaurantName,
          restaurantId,
          action: 'visited'
        });
        await feedEntry.save();
      }
    } else if (action === 'remove' && isCurrentlyVisited) {
      user.visitedRestaurants = user.visitedRestaurants.filter(v => v.restaurantId !== restaurantId);
    }

    await user.save();

    res.json({
      success: true,
      visited: user.visitedRestaurants.some(v => v.restaurantId === restaurantId)
    });
  } catch (error) {
    console.error('Error updating visited restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle interested restaurant
router.post('/:username/interested/:restaurantId', async (req, res) => {
  try {
    const { username, restaurantId } = req.params;
    const { restaurantData, action = 'toggle' } = req.body;

    // Ensure restaurant exists in database when user interacts with it
    if (restaurantData) {
      await ensureRestaurantExists(restaurantData);
    }

    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
    }

    const isCurrentlyInterested = user.interestedRestaurants.some(i => i.restaurantId === restaurantId);

    if (action === 'toggle') {
      if (isCurrentlyInterested) {
        user.interestedRestaurants = user.interestedRestaurants.filter(i => i.restaurantId !== restaurantId);
      } else {
        user.interestedRestaurants.push({ restaurantId });
        // Remove from not interested if it was there
        user.notInterestedRestaurants = user.notInterestedRestaurants.filter(n => n.restaurantId !== restaurantId);
      }
    } else if (action === 'add' && !isCurrentlyInterested) {
      user.interestedRestaurants.push({ restaurantId });
      user.notInterestedRestaurants = user.notInterestedRestaurants.filter(n => n.restaurantId !== restaurantId);
    } else if (action === 'remove' && isCurrentlyInterested) {
      user.interestedRestaurants = user.interestedRestaurants.filter(i => i.restaurantId !== restaurantId);
    }

    await user.save();

    res.json({
      success: true,
      interested: user.interestedRestaurants.some(i => i.restaurantId === restaurantId)
    });
  } catch (error) {
    console.error('Error updating interested restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle not interested restaurant
router.post('/:username/not-interested/:restaurantId', async (req, res) => {
  try {
    const { username, restaurantId } = req.params;
    const { restaurantData, action = 'toggle' } = req.body;

    // Ensure restaurant exists in database when user interacts with it
    if (restaurantData) {
      await ensureRestaurantExists(restaurantData);
    }

    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
    }

    const isCurrentlyNotInterested = user.notInterestedRestaurants.some(n => n.restaurantId === restaurantId);

    if (action === 'toggle') {
      if (isCurrentlyNotInterested) {
        user.notInterestedRestaurants = user.notInterestedRestaurants.filter(n => n.restaurantId !== restaurantId);
      } else {
        user.notInterestedRestaurants.push({ restaurantId });
        // Remove from interested if it was there
        user.interestedRestaurants = user.interestedRestaurants.filter(i => i.restaurantId !== restaurantId);
      }
    } else if (action === 'add' && !isCurrentlyNotInterested) {
      user.notInterestedRestaurants.push({ restaurantId });
      user.interestedRestaurants = user.interestedRestaurants.filter(i => i.restaurantId !== restaurantId);
    } else if (action === 'remove' && isCurrentlyNotInterested) {
      user.notInterestedRestaurants = user.notInterestedRestaurants.filter(n => n.restaurantId !== restaurantId);
    }

    await user.save();

    res.json({
      success: true,
      notInterested: user.notInterestedRestaurants.some(n => n.restaurantId === restaurantId)
    });
  } catch (error) {
    console.error('Error updating not interested restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save location
router.post('/:username/locations', async (req, res) => {
  try {
    const { username } = req.params;
    const { name, coordinates } = req.body;

    if (!name || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: 'Valid name and coordinates [lat, lng] are required' });
    }

    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
    }

    // Remove existing location with same name
    user.savedLocations = user.savedLocations.filter(loc => loc.name !== name);

    // Add new location
    user.savedLocations.unshift({ name, coordinates });

    // Keep only last 10 locations
    user.savedLocations = user.savedLocations.slice(0, 10);

    await user.save();

    res.json({
      success: true,
      savedLocations: user.savedLocations
    });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove saved location
router.delete('/:username/locations/:locationId', async (req, res) => {
  try {
    const { username, locationId } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.savedLocations = user.savedLocations.filter(loc => loc._id.toString() !== locationId);
    await user.save();

    res.json({
      success: true,
      savedLocations: user.savedLocations
    });
  } catch (error) {
    console.error('Error removing saved location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for user switcher)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username').sort({ username: 1 });

    res.json({
      success: true,
      data: users.map(user => user.username)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;