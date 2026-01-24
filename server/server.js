const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const cookieParser = require('cookie-parser');
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to MongoDB
const mongoose = require('mongoose');
const { createDefaultAdmin } = require('./models/user');
const { createDefaultFarm } = require('./controllers/landManagementAuthController');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Database:', MONGODB_URI.split('@')[1] || 'localhost');
    // Create default admin user
    createDefaultAdmin();
    // Create default farm and super admin for land management
    createDefaultFarm();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const huntingRoutes = require('./routes/hunting');
const propertyRoutes = require('./routes/property');
const fieldRoutes = require('./routes/field');
const transactionRoutes = require('./routes/transaction');
const ledgerRoutes = require('./routes/ledger');
const harvestDataRoutes = require('./routes/harvestData');
const serviceRoutes = require('./routes/services');
const chemicalRoutes = require('./routes/chemicals');
const landManagementRoutes = require('./routes/landManagement');
const testimonialRoutes = require('./routes/testimonials');
const equipmentRoutes = require('./routes/equipment');
const rentalRoutes = require('./routes/rentals');
const seasonPassRoutes = require('./routes/seasonPass');
const landlordRoutes = require('./routes/landlord');
const farmerRoutes = require('./routes/farmer');
const reviewRoutes = require('./routes/reviews');
const financialReportsRoutes = require('./routes/financialReports');
const cattleRoutes = require('./routes/cattle');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hunting', huntingRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/harvest', harvestDataRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/chemicals', chemicalRoutes);
app.use('/api/land-management', landManagementRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/season-pass', seasonPassRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/financial-reports', financialReportsRoutes);
app.use('/api/cattle', cattleRoutes);

// Health check / test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'M77 AG API is working',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Serve static files from public directory with cache control
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  setHeaders: (res, filePath) => {
    // Disable caching for HTML files to prevent stale content
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Admin routes
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

app.get('/admin/hunting-bookings', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/hunting-bookings.html'));
});

app.get('/admin/equipment', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/equipment.html'));
});

app.get('/admin/testimonials', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/testimonials.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// Financial Command Center routes
app.get('/admin/financials', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/financials.html'));
});

app.get('/admin/financials/crops', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/financials/crops.html'));
});

app.get('/admin/financials/cattle', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/financials/cattle.html'));
});

app.get('/admin/financials/equipment', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/financials/equipment.html'));
});

app.get('/admin/financials/capital', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/financials/capital.html'));
});

// User routes
app.get('/user/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/user/dashboard.html'));
});

app.get('/user/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/user/login.html'));
});

// Farmer routes
app.get('/farmer/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/farmer/dashboard.html'));
});

app.get('/farmer/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/farmer/login.html'));
});

app.get('/farmer', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/farmer/login.html'));
});

// Public page routes
app.get('/hunting', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/hunting.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/about.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/services.html'));
});

app.get('/custom-farming', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/custom-farming.html'));
});

// Land management routes
app.get('/land-management', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/land-management/index.html'));
});

app.get('/land-management/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/land-management/login.html'));
});

app.get('/land-management/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/land-management/signup.html'));
});

app.get('/land-management/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/land-management/dashboard.html'));
});

app.get('/heritage-farm', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/heritage-farm.html'));
});

app.get('/prairie-peace', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/prairie-peace.html'));
});

app.get('/hunting-liability-waiver', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/hunting-liability-waiver.html'));
});

app.get('/forsale', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/forsale.html'));
});

app.get('/rentals', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/rentals.html'));
});

app.get('/tenant', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/tenant/portal.html'));
});

app.get('/tenant/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/tenant/login.html'));
});

app.get('/admin/rentals', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/rentals.html'));
});

app.get('/season-pass', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/season-pass.html'));
});

app.get('/my-account', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/my-account.html'));
});

app.get('/submit-review', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/submit-review.html'));
});

// Main route - must come last among GET routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler - must come after all other routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  mongoose.connection.close(false).then(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});