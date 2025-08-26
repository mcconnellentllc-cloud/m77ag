// Simple Express server without any complex routes
const express = require('express');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Serve HTML files
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/admin/index.html'));
});

app.get('/account/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/account/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});