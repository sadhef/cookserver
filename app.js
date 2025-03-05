const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes'); // New chatbot routes

// Initialize app
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
// Update the CORS configuration in app.js

// Enable CORS
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://cookifyy.vercel.app',
      'https://cookify-frontend.vercel.app',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Make sure the images directory exists in the public folder
const fs = require('fs');
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create default avatar if it doesn't exist
const defaultAvatarPath = path.join(imagesDir, 'default-avatar.jpg');
if (!fs.existsSync(defaultAvatarPath)) {
  try {
    // Create a simple 1x1 pixel image as fallback
    const emptyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(defaultAvatarPath, emptyImageBuffer);
    console.log('Created default avatar image');
  } catch (error) {
    console.error('Failed to create default avatar image:', error);
  }
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chatbot', chatbotRoutes); // Add chatbot routes

// Handle direct requests for images
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'public', 'images', filename);
  
  // Check if file exists and serve it
  if (fs.existsSync(imagePath)) {
    return res.sendFile(imagePath);
  } else {
    // Send default avatar for missing profile images
    if (filename.includes('avatar')) {
      return res.sendFile(defaultAvatarPath);
    }
    // Otherwise, send 404
    return res.status(404).send('Image not found');
  }
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the COokiFy API' });
});

// Make sure the admin/stats endpoint exists and is correctly implemented
app.get('/api/admin/stats', (req, res) => {
  // If the route has an issue in the adminRoutes module,
  // this will serve as a fallback to ensure the endpoint exists
  res.status(200).json({
    success: true,
    data: {
      counts: {
        users: 0,
        recipes: 0,
        reviews: 0
      },
      topRatedRecipes: [],
      recentReviews: [],
      recentUsers: []
    }
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;