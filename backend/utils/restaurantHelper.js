import Restaurant from '../models/Restaurant.js';

/**
 * Ensures a restaurant exists in the database when a user interacts with it
 * Uses the external Overpass API ID as the unique identifier
 */
export const ensureRestaurantExists = async (restaurantData) => {
  try {
    if (!restaurantData || !restaurantData.id) {
      throw new Error('Restaurant data or ID is missing');
    }

    const externalId = restaurantData.id.toString();

    // Check if restaurant already exists
    let restaurant = await Restaurant.findOne({ externalId });

    if (!restaurant) {
      // Create new restaurant record
      restaurant = new Restaurant({
        externalId,
        name: restaurantData.name || 'Unknown Restaurant',
        type: restaurantData.type || 'restaurant',
        cuisine: restaurantData.cuisine || 'Not specified',
        address: restaurantData.address || 'Address not available',
        location: {
          type: 'Point',
          coordinates: [restaurantData.lng, restaurantData.lat] // [longitude, latitude]
        },
        phone: restaurantData.phone || null,
        website: restaurantData.website || null,
        opening_hours: restaurantData.opening_hours || null,
        takeaway: restaurantData.takeaway || null,
        delivery: restaurantData.delivery || null,
        lastUpdated: new Date()
      });

      await restaurant.save();
      console.log(`Saved new restaurant: ${restaurant.name} (ID: ${externalId})`);
    } else {
      // Update existing restaurant with any new data
      const updates = {};
      let hasUpdates = false;

      // Only update if the new data is different and not null/undefined
      if (restaurantData.name && restaurantData.name !== restaurant.name) {
        updates.name = restaurantData.name;
        hasUpdates = true;
      }
      if (restaurantData.type && restaurantData.type !== restaurant.type) {
        updates.type = restaurantData.type;
        hasUpdates = true;
      }
      if (restaurantData.cuisine && restaurantData.cuisine !== restaurant.cuisine) {
        updates.cuisine = restaurantData.cuisine;
        hasUpdates = true;
      }
      if (restaurantData.address && restaurantData.address !== restaurant.address) {
        updates.address = restaurantData.address;
        hasUpdates = true;
      }
      if (restaurantData.phone && restaurantData.phone !== restaurant.phone) {
        updates.phone = restaurantData.phone;
        hasUpdates = true;
      }
      if (restaurantData.website && restaurantData.website !== restaurant.website) {
        updates.website = restaurantData.website;
        hasUpdates = true;
      }

      if (hasUpdates) {
        updates.lastUpdated = new Date();
        await Restaurant.findOneAndUpdate({ externalId }, updates);
        console.log(`Updated restaurant: ${restaurant.name} (ID: ${externalId})`);
      }
    }

    return restaurant;
  } catch (error) {
    console.error('Error ensuring restaurant exists:', error);
    throw error;
  }
};

/**
 * Get restaurant by external ID
 */
export const getRestaurantByExternalId = async (externalId) => {
  try {
    return await Restaurant.findOne({ externalId: externalId.toString() });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    throw error;
  }
};