// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

// Authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication token missing' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Check if user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User no longer exists' 
      });
    }
    
    // Add user info to request object
    req.userId = decoded.userId;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  
  next();
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, but that's okay
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    const user = await User.findById(decoded.userId);
    if (user) {
      req.userId = decoded.userId;
      req.userRole = user.role;
    }
    
    next();
  } catch (error) {
    // Token invalid, but we don't fail the request
    next();
  }
};