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

// Dashboard summary
router.get('/summary', landlordController.getSummary);

// Fields (real CroppingField data)
router.get('/fields', landlordController.getFields);

// Financial summary (running bill)
router.get('/financial-summary', landlordController.getFinancialSummary);

// Preferences
router.get('/preferences', landlordController.getPreferences);
router.put('/preferences', landlordController.updatePreferences);

// Properties (legacy - same as fields)
router.get('/properties', landlordController.getProperties);

// Transactions
router.get('/transactions', landlordController.getTransactions);

// ACH / Stripe
router.post('/ach/setup', landlordController.setupACH);
router.post('/ach/disconnect', landlordController.disconnectACH);

module.exports = router;
