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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const mongoose = require('mongoose');
const { createDefaultAdmin } = require('./models/user');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    // Create default admin user
    createDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Static files - CHANGED FROM docs TO public
app.use(express.static(path.join(__dirname, '../public')));

// Simple routes - no wildcards
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/account/login.html'));
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB: ${MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(`Admin: admin@m77ag.com`);
});