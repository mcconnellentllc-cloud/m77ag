const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user is farmer or admin
const isFarmerOrAdmin = (req, res, next) => {
  if (!req.userRole || !['farmer', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Farmer access required'
    });
  }
  next();
};

// All routes require authentication and farmer/admin role
router.use(authenticate);
router.use(isFarmerOrAdmin);

// Get all landlords with their data
router.get('/landlords', farmerController.getAllLandlords);

// Get specific landlord financial summary
router.get('/landlord/:landlordId/summary', farmerController.getLandlordSummary);

// Update field projections (used by farmer, visible to landlords)
router.put('/field/:fieldId/projections', farmerController.updateFieldProjections);

module.exports = router;
