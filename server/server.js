// server/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.paypal.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.paypal.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));

// Request logging
app.use(morgan('dev'));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://m77ag.com', 'https://www.m77ag.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection with retry logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';
const MAX_RETRIES = 5;
let retries = 0;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Create default admin user
    const { createDefaultAdmin } = require('./models/user');
    await createDefaultAdmin();
    
  } catch (err) {
    console.error(`❌ MongoDB connection attempt ${retries + 1} failed:`, err.message);
    retries++;
    
    if (retries < MAX_RETRIES) {
      console.log(`⏳ Retrying connection in 5 seconds... (${retries}/${MAX_RETRIES})`);
      setTimeout(connectDB, 5000);
    } else {
      console.error('❌ Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('📊 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📊 Mongoose connection closed through app termination');
  process.exit(0);
});

// ============================
// API ROUTES
// ============================

// Import route modules
const authRoutes = require('./routes/auth');
const huntingRoutes = require('./routes/hunting');
const proposalRoutes = require('./routes/proposals');
const chemicalRoutes = require('./routes/chemicals');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes with prefix
app.use('/api/auth', authRoutes);
app.use('/api/hunting', huntingRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/chemicals', chemicalRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'M77 AG API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================
// STATIC FILE SERVING
// ============================

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, '../docs'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set cache headers for different file types
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (path.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// ============================
// PAGE ROUTES
// ============================

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/dashboard.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/dashboard.html'));
});

// Account routes
app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

app.get('/account/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

// Hunting page
app.get('/hunting', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/hunting.html'));
});

// Calculator page
app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/calculator.html'));
});

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/about.html'));
});

// Main route - serves homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
});

// ============================
// ERROR HANDLING
// ============================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Catch-all route for client-side routing (if using SPA)
app.get('*', (req, res) => {
  // Check if the request is for a file
  if (req.path.includes('.')) {
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  } else {
    // Serve the main index.html for client-side routing
    res.sendFile(path.join(__dirname, '../docs/index.html'));
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : undefined
  });
});

// ============================
// SERVER INITIALIZATION
// ============================

const server = app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║       M77 AG Server Started Successfully   ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║ 🚀 Port: ${PORT.toString().padEnd(34)}║`);
  console.log(`║ 📍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(27)}║`);
  console.log(`║ 🔗 Local: http://localhost:${PORT.toString().padEnd(16)}║`);
  console.log(`║ 📁 Static files: ../docs                   ║`);
  console.log('╠════════════════════════════════════════════╣');
  console.log('║ API Endpoints:                             ║');
  console.log('║   • /api/health - Health check             ║');
  console.log('║   • /api/auth - Authentication             ║');
  console.log('║   • /api/hunting - Hunting bookings        ║');
  console.log('║   • /api/proposals - Farm proposals        ║');
  console.log('║   • /api/chemicals - Chemical inventory    ║');
  console.log('╚════════════════════════════════════════════╝');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

module.exports = app;