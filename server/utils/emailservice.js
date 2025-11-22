const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const mongoose = require('mongoose');
const { createDefaultAdmin } = require('./models/user');
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    createDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const huntingAnalytics = require('./controllers/huntingAnalyticsController');
const bookingManagement = require('./controllers/bookingManagementController');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);

// Hunting analytics endpoint for admin dashboard
app.get('/api/hunting/stats', huntingAnalytics.getHuntingStats);
app.get('/api/hunting/all-bookings', huntingAnalytics.getAllBookings);

// Booking management endpoints (admin only)
app.delete('/api/admin/bookings/:id', bookingManagement.deleteBooking);
app.delete('/api/admin/bookings-clear-all', bookingManagement.deleteAllBookings);
app.patch('/api/admin/bookings/:id/status', bookingManagement.updateBookingStatus);

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Static files
app.use(express.static(path.join(__dirname, '../docs')));

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

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
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
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`MongoDB: ${MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@m77ag.com'}`);
});