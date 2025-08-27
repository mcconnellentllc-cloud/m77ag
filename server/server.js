// server.js - Complete updated file

// Import required modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const https = require('https');
const { auth, adminOnly } = require('./middleware/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser for token handling

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));
app.use('/api/proposals', require('./routes/proposals'));

// Static files
app.use(express.static(path.join(__dirname, '../docs')));

// Protected admin routes
app.get('/admin/*', auth, adminOnly, (req, res, next) => {
  res.sendFile(path.join(__dirname, '../docs/admin', req.path.replace('/admin/', '') || 'dashboard.html'));
});

app.get('/admin', auth, adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/admin/dashboard.html'));
});

// Protected user routes
app.get('/account/dashboard', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/dashboard.html'));
});

// Public account routes
app.get('/account/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

app.get('/account/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/register.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/account/login.html'));
});

// API test endpoint for keep-alive
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Catch-all route for non-matched routes (serve index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/index.html'));
});

// Keep alive function to prevent Render.com free tier from spinning down
const keepAlive = () => {
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      https.get('https://m77ag.com/api/test', (resp) => {
        console.log('Keeping application alive...');
      }).on('error', (err) => {
        console.error('Keep-alive request failed:', err.message);
      });
    }, 840000); // 14 minutes (just under the 15-minute timeout)
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start keep-alive
  keepAlive();
});