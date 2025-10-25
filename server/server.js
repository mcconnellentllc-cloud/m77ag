const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve portal files
app.use('/portal', express.static(path.join(__dirname, '../portal')));

// Serve admin files  
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Basic API test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'M77 AG API is running',
    timestamp: new Date().toISOString()
  });
});

// Catch all route - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});