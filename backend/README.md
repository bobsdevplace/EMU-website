# EMU Restaurant Tracker Backend

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up MongoDB Atlas:**
   - Create a free MongoDB Atlas account
   - Create a new cluster
   - Get your connection string
   - Create a `.env` file with your MongoDB URI:

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/emu-restaurants?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:username` - Get or create user
- `POST /api/users/:username/visited/:restaurantId` - Toggle visited restaurant
- `POST /api/users/:username/interested/:restaurantId` - Toggle interested restaurant
- `POST /api/users/:username/not-interested/:restaurantId` - Toggle not interested restaurant
- `POST /api/users/:username/locations` - Save location
- `DELETE /api/users/:username/locations/:locationId` - Remove saved location

### Restaurants
- `GET /api/restaurants/search?lat=&lng=&radius=&cuisine=` - Search restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `POST /api/restaurants/cache` - Cache restaurants from external API

### Social Feed
- `GET /api/social` - Get social feed
- `GET /api/social/user/:username` - Get user's social feed
- `POST /api/social` - Add social feed entry
- `DELETE /api/social/:id` - Delete social feed entry

## Database Schema

### User
- username (unique)
- visitedRestaurants[]
- interestedRestaurants[]
- notInterestedRestaurants[]
- savedLocations[]

### Restaurant
- externalId (from OSM/Overpass API)
- name, type, cuisine, address
- location (GeoJSON Point for geospatial queries)
- contact info, hours, services
- searchLocations[] (cache management)

### SocialFeed
- user, restaurantName, restaurantId
- action (visited/interested/not_interested)
- timestamps

## Features

- **Geospatial queries** with MongoDB 2dsphere indexes
- **Restaurant caching** to reduce external API calls
- **User preferences** stored per user
- **Social feed** for sharing restaurant visits
- **Rate limiting** and security middleware
- **Error handling** and validation