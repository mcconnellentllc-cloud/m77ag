const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');
const { createDefaultAdmin } = require('./models/user');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    createDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const huntingRoutes = require('./routes/hunting');

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/hunting', huntingRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date() });
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

app.get('/admin/hunting-bookings', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/hunting-bookings.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

app.listen(PORT, () => {
  console.log(`M77 AG Server running on port ${PORT}`);
  console.log(`Admin: admin@m77ag.com / M77admin2024!`);
});