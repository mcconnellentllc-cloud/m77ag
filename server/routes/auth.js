const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { auth, checkAuth } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with that email or username already exists' 
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by pre-save hook
      role: 'user' // Default role
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    // Set token in cookie for browser use
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during registration' 
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    // Set token in cookie for browser use
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login' 
    });
  }
});

// User logout
router.post('/logout', (req, res) => {
  // Clear cookie
  res.clearCookie('token');
  
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// Check authentication status
router.get('/check', checkAuth);

// Protected route example
router.get('/profile', auth, async (req, res) => {
  try {
    // User is available from auth middleware
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while retrieving profile' 
    });
  }
});

module.exports = router;