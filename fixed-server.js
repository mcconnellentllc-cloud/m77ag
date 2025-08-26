// fixed-server.js - Using proper Express routing patterns
const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files
app.use(express.static('docs'));

// Basic API test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', status: 'success' });
});

// Specific routes for admin and account sections
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/admin/index.html'));
});

app.get('/admin/:page', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/admin/index.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/account/index.html'));
});

app.get('/account/:page', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/account/index.html'));
});

// Main index route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error occurred' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit admin dashboard: http://localhost:${PORT}/admin/dashboard.html`);
});