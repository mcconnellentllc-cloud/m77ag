// server.js - M77 AG Web Server
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Path logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
const mongoose = require('mongoose');
const { createDefaultAdmin } = require('./models/user');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Create default admin user
    try {
      await createDefaultAdmin();
      console.log('Default admin user check completed');
    } catch (error) {
      console.error('Error checking/creating admin user:', error);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Starting server without database connection. Some features may not work.');
    }
  });

// Import routes
const authRoutes = require('./routes/auth');

// API routes
app.use('/api/auth', authRoutes);

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// IMPORTANT: Serve static files
app.use(express.static(path.join(__dirname, '../docs'), {
  // Add cache control to prevent browser caching issues
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// ===== ACCOUNT ROUTES - Fixed for login button issue =====

// Handle /account exactly (no trailing slash)
app.get('/account', (req, res) => {
  console.log('Redirecting /account to /account/login.html');
  res.redirect(302, '/account/login.html'); // 302 ensures no caching of redirect
});

// Handle /account/ (with trailing slash)
app.get('/account/', (req, res) => {
  console.log('Redirecting /account/ (with slash) to /account/login.html');
  res.redirect(302, '/account/login.html'); // 302 ensures no caching of redirect
});

// Explicitly handle the login page without .html extension
app.get('/account/login', (req, res) => {
  console.log('Redirecting /account/login to /account/login.html');
  res.redirect(302, '/account/login.html'); // 302 ensures no caching of redirect
});

// ===== ADMIN ROUTES =====

// Admin dashboard route
app.get('/admin', (req, res) => {
  console.log('Serving admin dashboard');
  res.sendFile(path.join(__dirname, '../docs/admin/dashboard.html'));
});

// Admin dashboard route with trailing slash
app.get('/admin/', (req, res) => {
  console.log('Redirecting /admin/ to /admin');
  res.redirect(302, '/admin'); // 302 ensures no caching of redirect
});

// Main route
app.get('/', (req, res) => {
  console.log('Serving index page');
  res.sendFile(path.join(__dirname, '../docs/index.html'), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// ===== ERROR HANDLING =====

// Catch-all route handler for any undefined routes
app.use((req, res, next) => {
  console.log(`Route not found: ${req.path}`);
  
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false, 
      message: 'API endpoint not found' 
    });
  }
  
  // For non-API routes, try to send the 404 page if it exists
  const notFoundPath = path.join(__dirname, '../docs/404.html');
  res.status(404).sendFile(notFoundPath, err => {
    if (err) {
      // If 404 page doesn't exist, send a simple text response
      res.status(404).send('Page not found');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  // API error response
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong on the server'
    });
  }
  
  // Web page error response
  res.status(500).send('Server error. Please try again later.');
});

// Start server
app.listen(PORT, () => {
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server time: ${new Date().toISOString()}`);
  console.log(`Serving static files from: ${path.join(__dirname, '../docs')}`);
});