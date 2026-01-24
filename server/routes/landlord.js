const express = require('express');
const router = express.Router();
const landlordController = require('../controllers/landlordController');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user is landlord or admin
const isLandlordOrAdmin = (req, res, next) => {
  if (!req.userRole || !['landlord', 'admin', 'farmer'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Landlord access required'
    });
  }
  next();
};

// All routes require authentication and landlord/admin role
router.use(authenticate);
router.use(isLandlordOrAdmin);

// Get landlord preferences
router.get('/preferences', landlordController.getPreferences);

// Update landlord preferences
router.put('/preferences', landlordController.updatePreferences);

// Get financial summary (running bill)
router.get('/financial-summary', landlordController.getFinancialSummary);

// Get properties and fields with crop data
router.get('/properties', landlordController.getProperties);

// Get transactions
router.get('/transactions', landlordController.getTransactions);

// ACH / Stripe payment setup
router.post('/ach/setup', landlordController.setupACH);
router.post('/ach/disconnect', landlordController.disconnectACH);

module.exports = router;
