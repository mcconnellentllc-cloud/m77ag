// middleware/auth.js - Updated version
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

// Authentication middleware
exports.auth = async (req, res, next) => {
  // Add public paths that should be excluded from auth check
  const publicPaths = [
    '/account/login', 
    '/account/login.html',
    '/account/register',
    '/account/register.html',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/check'
  ];
  
  // Skip auth check for public paths
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.cookies?.token;
    
    if (!token) {
      // For API routes, return JSON
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      // For page routes, redirect to login
      return res.redirect('/account/login.html');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Check if user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ message: 'User not found' });
      }
      return res.redirect('/account/login.html');
    }
    
    // Add user info to request
    req.userId = decoded.userId;
    req.userRole = user.role;
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // For API routes
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // For page routes
    return res.redirect('/account/login.html');
  }
};

// The rest of your middleware remains the same
exports.adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    // For API routes
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // For page routes
    return res.redirect('/account/login.html');
  }
  
  next();
};

exports.checkAuth = (req, res) => {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.cookies?.token;
    
    if (!token) {
      return res.json({ 
        isAuthenticated: false 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    return res.json({
      isAuthenticated: true,
      isAdmin: decoded.role === 'admin',
      user: {
        id: decoded.userId,
        role: decoded.role
      }
    });
  } catch (error) {
    return res.json({ 
      isAuthenticated: false 
    });
  }
};

exports.authenticate = exports.auth;
exports.isAdmin = exports.adminOnly;