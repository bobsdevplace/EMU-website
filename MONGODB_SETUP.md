# MongoDB Integration Setup Guide

## Overview

Your restaurant tracker now uses MongoDB Atlas for data persistence instead of localStorage. This provides:

- **Persistent data** across devices and browsers
- **Multi-user support** with real-time social feed
- **Geospatial queries** for efficient restaurant searches
- **Restaurant caching** to reduce external API calls
- **Scalable architecture** ready for hosting anywhere

## Quick Setup

### 1. Set up MongoDB Atlas

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster:**
   - Choose "Build a Database" → "Free" tier
   - Select your preferred region
   - Click "Create Cluster"

3. **Create Database User:**
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Create username/password (save these!)
   - Grant "Read and write to any database" role

4. **Configure Network Access:**
   - Go to "Network Access" → "Add IP Address"
   - Add `0.0.0.0/0` (allow access from anywhere) for development
   - For production, restrict to your server IPs

5. **Get Connection String:**
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`)

### 2. Set up Backend

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your MongoDB URI to `.env`:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/emu-restaurants?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the backend:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   Connected to MongoDB Atlas
   Server running on port 5000
   ```

### 3. Set up Frontend

1. **Create frontend environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add backend URL to `.env`:**
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Update your main App.jsx to use the new component:**
   ```javascript
   import RestaurantsWithAPI from './components/RestaurantsWithAPI'

   function App() {
     return <RestaurantsWithAPI />
   }
   ```

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Testing the Integration

### 1. Basic Functionality Test

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd ../
   npm run dev
   ```

2. **Test user switching:**
   - Switch between Julien and Jimmy
   - Verify each user has separate preferences

3. **Test restaurant interactions:**
   - Mark restaurants as visited/interested
   - Check that changes persist after page refresh
   - Verify social feed updates

4. **Test location features:**
   - Save a location
   - Switch users and verify location is user-specific
   - Remove saved locations

### 2. API Health Check

Visit `http://localhost:5000/health` to verify backend is running.

### 3. Database Verification

In MongoDB Atlas:
- Go to "Collections"
- You should see collections: `users`, `restaurants`, `socialfeeds`
- Browse documents to verify data is being saved

## Features

### Data Migration

The new system automatically:
- Creates users when they first interact with the app
- Caches restaurant data from Overpass API for faster subsequent searches
- Maintains backward compatibility with your existing UI

### Performance Improvements

- **Smart caching:** Restaurant data is cached in MongoDB, reducing external API calls
- **Geospatial indexing:** Fast location-based restaurant searches
- **Efficient filtering:** Database-level filtering for cuisines and visit status

### Multi-User Features

- **User profiles:** Each user has separate visited/interested restaurants
- **Social feed:** See when any user visits restaurants
- **Shared locations:** Saved locations are per-user but searchable

## Production Deployment

When ready to deploy:

1. **Update CORS settings** in `backend/server.js` with your frontend domain
2. **Set production environment variables** for both frontend and backend
3. **Deploy backend** to Railway, Render, or Heroku
4. **Deploy frontend** to Vercel, Netlify, or anywhere
5. **Update MongoDB network access** to restrict to your server IPs

## Troubleshooting

### Backend won't start:
- Check your MongoDB URI in `.env`
- Verify network access settings in MongoDB Atlas
- Check if port 5000 is already in use

### Frontend API errors:
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Check browser network tab for specific error messages

### Data not persisting:
- Check MongoDB Atlas logs
- Verify user permissions for database operations
- Check backend console for error messages

## API Documentation

The backend provides a REST API with the following endpoints:

- **Users:** `/api/users/*` - User management and preferences
- **Restaurants:** `/api/restaurants/*` - Restaurant search and caching
- **Social:** `/api/social/*` - Social feed management

Visit `http://localhost:5000/` for a complete API reference.