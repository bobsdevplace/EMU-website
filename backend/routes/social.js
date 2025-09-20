import express from 'express';
import SocialFeed from '../models/SocialFeed.js';

const router = express.Router();

// Get social feed
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const feedEntries = await SocialFeed.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const formattedEntries = feedEntries.map(entry => ({
      id: entry._id,
      user: entry.user,
      restaurantName: entry.restaurantName,
      restaurantId: entry.restaurantId,
      action: entry.action,
      timestamp: entry.createdAt.toISOString(),
      date: entry.createdAt.toLocaleDateString()
    }));

    res.json({
      success: true,
      count: formattedEntries.length,
      data: formattedEntries
    });
  } catch (error) {
    console.error('Error fetching social feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get social feed for specific user
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const feedEntries = await SocialFeed.find({ user: username })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const formattedEntries = feedEntries.map(entry => ({
      id: entry._id,
      user: entry.user,
      restaurantName: entry.restaurantName,
      restaurantId: entry.restaurantId,
      action: entry.action,
      timestamp: entry.createdAt.toISOString(),
      date: entry.createdAt.toLocaleDateString()
    }));

    res.json({
      success: true,
      count: formattedEntries.length,
      data: formattedEntries
    });
  } catch (error) {
    console.error('Error fetching user social feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add manual social feed entry (if needed)
router.post('/', async (req, res) => {
  try {
    const { user, restaurantName, restaurantId, action = 'visited', location } = req.body;

    if (!user || !restaurantName || !restaurantId) {
      return res.status(400).json({ error: 'User, restaurant name, and restaurant ID are required' });
    }

    const feedEntry = new SocialFeed({
      user,
      restaurantName,
      restaurantId,
      action,
      location
    });

    await feedEntry.save();

    res.json({
      success: true,
      data: {
        id: feedEntry._id,
        user: feedEntry.user,
        restaurantName: feedEntry.restaurantName,
        restaurantId: feedEntry.restaurantId,
        action: feedEntry.action,
        timestamp: feedEntry.createdAt.toISOString(),
        date: feedEntry.createdAt.toLocaleDateString()
      }
    });
  } catch (error) {
    console.error('Error creating social feed entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete social feed entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await SocialFeed.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: 'Feed entry not found' });
    }

    res.json({
      success: true,
      message: 'Feed entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting social feed entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all social feed entries
router.delete('/', async (req, res) => {
  try {
    const result = await SocialFeed.deleteMany({});

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} social feed entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing social feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;