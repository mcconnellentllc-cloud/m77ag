// server/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    // Create default admin user
    const { createDefaultAdmin } = require('./models/user');
    createDefaultAdmin();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Import routes
const authRoutes = require('./routes/auth');

// API routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'M77 AG API is working!',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, '../docs')));

// Serve specific routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/dashboard.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

// Main route - serves homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 M77 AG Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
});