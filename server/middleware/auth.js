const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

// Middleware to verify JWT token and authenticate user
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. Please provide a valid token.' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication token not found.' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_change_in_production');
    
    // Get user from database to ensure they still exist and get current role
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User account no longer exists.' 
      });
    }
    
    // Attach user info to request object for use in route handlers
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid authentication token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication token has expired. Please log in again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed.' 
    });
  }
};

// Middleware to check if authenticated user is an admin
exports.isAdmin = (req, res, next) => {
  if (!req.userRole || req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required. You do not have permission to access this resource.' 
    });
  }
  
  next();
};

// Middleware to check if authenticated user is an employee
exports.isEmployee = (req, res, next) => {
  if (!req.userRole || !['admin', 'employee'].includes(req.userRole)) {
    return res.status(403).json({ 
      success: false,
      message: 'Employee access required.' 
    });
  }
  
  next();
};

// Middleware to check if authenticated user is a landlord
exports.isLandlord = (req, res, next) => {
  if (!req.userRole || !['admin', 'landlord'].includes(req.userRole)) {
    return res.status(403).json({ 
      success: false,
      message: 'Landlord access required.' 
    });
  }
  
  next();
};