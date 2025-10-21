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
const adminRoutes = require('./routes/admin');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Static files - serve from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Specific route handlers for admin pages
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

app.get('/admin/proposals', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/proposals.html'));
});

app.get('/admin/chemicals', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/chemicals.html'));
});

app.get('/admin/customers', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/customers.html'));
});

app.get('/admin/hunting', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/hunting.html'));
});

// Redirect /admin to admin login
app.get('/admin', (req, res) => {
  res.redirect('/admin-login');
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler - must be last
app.use((req, res) => {
  // Check if it's an API route
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      success: false, 
      message: 'API endpoint not found' 
    });
  } else {
    // For non-API routes, send 404 page or redirect to home
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'), (err) => {
      if (err) {
        // If 404.html doesn't exist, redirect to home
        res.redirect('/');
      }
    });
  }
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
  console.log(`===============================================`);
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB: ${MONGODB_URI}`);
  console.log(`===============================================`);
  console.log(`Admin login: http://localhost:${PORT}/admin-login`);
  console.log(`Default credentials:`);
  console.log(`  Email: admin@m77ag.com`);
  console.log(`  Password: M77admin2024!`);
  console.log(`===============================================`);
});