const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // User methods
  async getUser(username) {
    return this.request(`/users/${encodeURIComponent(username)}`);
  }

  async getAllUsers() {
    return this.request('/users');
  }

  async toggleVisitedRestaurant(username, restaurantId, restaurantName, restaurantData = null) {
    return this.request(`/users/${encodeURIComponent(username)}/visited/${encodeURIComponent(restaurantId)}`, {
      method: 'POST',
      body: { restaurantName, restaurantData, action: 'toggle' }
    });
  }

  async toggleInterestedRestaurant(username, restaurantId, restaurantData = null) {
    return this.request(`/users/${encodeURIComponent(username)}/interested/${encodeURIComponent(restaurantId)}`, {
      method: 'POST',
      body: { restaurantData, action: 'toggle' }
    });
  }

  async toggleNotInterestedRestaurant(username, restaurantId, restaurantData = null) {
    return this.request(`/users/${encodeURIComponent(username)}/not-interested/${encodeURIComponent(restaurantId)}`, {
      method: 'POST',
      body: { restaurantData, action: 'toggle' }
    });
  }

  async saveLocation(username, name, coordinates) {
    return this.request(`/users/${encodeURIComponent(username)}/locations`, {
      method: 'POST',
      body: { name, coordinates }
    });
  }

  async removeSavedLocation(username, locationId) {
    return this.request(`/users/${encodeURIComponent(username)}/locations/${locationId}`, {
      method: 'DELETE'
    });
  }

  // Restaurant methods
  async searchRestaurants(lat, lng, radius, cuisine) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString()
    });

    if (cuisine && cuisine !== 'all') {
      params.append('cuisine', cuisine);
    }

    return this.request(`/restaurants/search?${params}`);
  }

  async getRestaurant(restaurantId) {
    return this.request(`/restaurants/${encodeURIComponent(restaurantId)}`);
  }

  async cacheRestaurants(restaurants, location, radius) {
    return this.request('/restaurants/cache', {
      method: 'POST',
      body: { restaurants, location, radius }
    });
  }

  // Social feed methods
  async getSocialFeed(limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.request(`/social?${params}`);
  }

  async getUserSocialFeed(username, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return this.request(`/social/user/${encodeURIComponent(username)}?${params}`);
  }

  async addSocialFeedEntry(user, restaurantName, restaurantId, action = 'visited', location = null) {
    return this.request('/social', {
      method: 'POST',
      body: { user, restaurantName, restaurantId, action, location }
    });
  }
}

export default new ApiService();