const jwt = require('jsonwebtoken');
const LandManagementUser = require('../models/landManagementUser');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookie
    else if (req.cookies && req.cookies.lm_token) {
      token = req.cookies.lm_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from token
    const user = await LandManagementUser.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized - Invalid token'
    });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Check if user has access to specific farm
exports.checkFarmAccess = (req, res, next) => {
  const farmId = req.params.farmId || req.body.farmId;

  if (!farmId) {
    return res.status(400).json({
      success: false,
      message: 'Farm ID is required'
    });
  }

  // Super admin has access to all farms
  if (req.user.role === 'super-admin') {
    return next();
  }

  // Check if user is associated with the farm
  if (!req.user.associatedFarm || req.user.associatedFarm.toString() !== farmId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this farm'
    });
  }

  next();
};

// Check if user is farm owner
exports.isFarmOwner = (req, res, next) => {
  if (req.user.role !== 'super-admin' && req.user.role !== 'farm-owner') {
    return res.status(403).json({
      success: false,
      message: 'Only farm owners can perform this action'
    });
  }
  next();
};

// Check if user can modify data
exports.canModifyData = (req, res, next) => {
  // Super admin and farm owner can modify anything
  if (req.user.role === 'super-admin' || req.user.role === 'farm-owner') {
    req.canModifyAll = true;
    return next();
  }

  // Landlords can only modify their own preferences
  if (req.user.role === 'landlord') {
    req.canModifyAll = false;
    req.canModifyOwnData = true;
    return next();
  }

  // Public users have read-only access to shared data
  req.canModifyAll = false;
  req.canModifyOwnData = false;
  next();
};

module.exports = exports;
