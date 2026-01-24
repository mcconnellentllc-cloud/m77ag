const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token and authenticate user
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token) or cookie
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Attach user info to request object
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };
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
        message: 'Session expired. Please log in again.'
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
      message: 'Admin access required.'
    });
  }

  next();
};

// Middleware to check if user is customer or admin (for customer features)
exports.isCustomer = (req, res, next) => {
  if (!req.userRole || !['customer', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Customer account required.'
    });
  }

  next();
};

// Middleware to check if user is admin or employee (for internal features)
exports.isStaff = (req, res, next) => {
  if (!req.userRole || !['admin', 'employee'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Staff access required.'
    });
  }

  next();
};

// Middleware to check employee permissions for specific actions
exports.canPerformAction = (action) => {
  return async (req, res, next) => {
    // Admins can do everything
    if (req.userRole === 'admin') {
      return next();
    }

    // For employees, check specific permissions
    if (req.userRole === 'employee') {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'User not found.'
        });
      }

      const permissions = user.employeePermissions || {};

      // Map actions to permission fields
      const permissionMap = {
        'add_cattle': 'canAddCattleRecords',
        'edit_cattle': 'canEditCattleRecords',
        'delete_cattle': 'canDeleteCattleRecords',
        'add_equipment_log': 'canAddEquipmentLogs',
        'edit_equipment_log': 'canEditEquipmentLogs',
        'add_transaction': 'canAddTransactions',
        'edit_transaction': 'canEditTransactions',
        'view_financials': 'canViewFinancials',
        'view_reports': 'canViewReports'
      };

      const permissionField = permissionMap[action];

      if (permissionField && permissions[permissionField] === true) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  };
};

// Middleware to check if employee has access to specific area
exports.hasAreaAccess = (area) => {
  return async (req, res, next) => {
    // Admins can access everything
    if (req.userRole === 'admin') {
      return next();
    }

    // For employees, check area access
    if (req.userRole === 'employee') {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'User not found.'
        });
      }

      const accessAreas = user.employeePermissions?.accessAreas || [];

      if (accessAreas.includes(area) || accessAreas.length === 0) {
        // Empty array means access to all areas
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `You do not have access to the ${area} section.`
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  };
};