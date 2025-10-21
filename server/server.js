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

// Static files - serve from docs directory
app.use(express.static(path.join(__dirname, '../docs')));

// Specific route handlers for HTML pages in docs
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/dashboard.html'));
});

app.get('/admin/proposals', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/proposals.html'));
});

app.get('/admin/chemicals', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/chemicals.html'));
});

app.get('/admin/customers', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/customers.html'));
});

app.get('/admin/hunting', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/hunting.html'));
});

app.get('/admin/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/orders.html'));
});

app.get('/admin/farm-management', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/farm-management.html'));
});

// Account pages
app.get('/account/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/dashboard.html'));
});

app.get('/account/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

// Public pages
app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/calculator.html'));
});

app.get('/hunting', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/hunting.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/about.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/services.html'));
});

app.get('/applications', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/applications.html'));
});

app.get('/crops', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/crops.html'));
});

app.get('/cattle', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/cattle.html'));
});

// Redirect /admin to admin dashboard or login based on auth
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Main route - serves index.html from docs
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
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
    // For non-API routes, try to serve index.html as fallback
    res.sendFile(path.join(__dirname, '../docs/index.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB: ${MONGODB_URI}`);
  console.log(`===============================================`);
  console.log(`Public URL: http://localhost:${PORT}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin/dashboard`);
  console.log(`===============================================`);
  console.log(`Default Admin Credentials:`);
  console.log(`  Email: admin@m77ag.com`);
  console.log(`  Password: M77admin2024!`);
  console.log(`===============================================`);
  console.log(`Files serving from: docs/ directory`);
  console.log(`===============================================`);
});