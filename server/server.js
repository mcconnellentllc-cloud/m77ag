const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for signature images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
const mongoose = require('mongoose');
const { createDefaultAdmin } = require('./models/user');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    // Create default admin user
    createDefaultAdmin();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const huntingRoutes = require('./routes/hunting');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/hunting', huntingRoutes);

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Static files - serve from docs and public directories
app.use(express.static(path.join(__dirname, '../docs')));
app.use(express.static(path.join(__dirname, '../public')));

// Hunting-specific routes
app.get('/hunting-liability-waiver.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/hunting-liability-waiver.html'));
});

app.get('/heritage-farm.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/heritage-farm.html'));
});

app.get('/prairie-peace.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/prairie-peace.html'));
});

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/dashboard.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/login.html'));
});

// Account routes
app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

app.get('/account/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  // Don't leak error details in production
  const errorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 M77 AG Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email Service: ${process.env.EMAIL_USER ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log(`💳 PayPal: ${process.env.PAYPAL_CLIENT_ID ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log('========================================');
});