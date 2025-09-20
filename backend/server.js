import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import restaurantRoutes from './routes/restaurants.js';
import userRoutes from './routes/users.js';
import socialRoutes from './routes/social.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - try multiple paths for different deployment scenarios
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try loading from multiple possible locations
const envPaths = [
  path.join(__dirname, '.env'),           // backend/.env
  path.join(process.cwd(), '.env'),       // root .env
  path.join(process.cwd(), 'backend', '.env'), // root/backend/.env
];

envPaths.forEach(envPath => {
  console.log('Trying to load .env from:', envPath);
  dotenv.config({ path: envPath });
});

// Also try without specifying a path (uses default .env in current directory)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'https://pepit.github.io', // GitHub Pages root
    'https://pepit.github.io/EMU-website', // GitHub Pages with repo name
    /^https:\/\/.*\.github\.io$/, // Allow any GitHub Pages subdomain
    /^https:\/\/.*\.github\.io\/.*$/ // Allow any GitHub Pages with path
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug: Check environment variables
console.log('All environment variables containing "MONGO":',
  Object.keys(process.env).filter(key => key.includes('MONGO')).map(key => `${key}=${process.env[key]}`));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Railway environment variables:',
  Object.keys(process.env).filter(key => key.startsWith('RAILWAY')));

console.log('MongoDB URI loaded:', process.env.MONGODB_URI ? 'Yes' : 'No');
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set!');
  console.error('Available environment variables:', Object.keys(process.env).sort());
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});


// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/`);
});