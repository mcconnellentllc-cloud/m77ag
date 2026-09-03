const express = require('express');
const router = express.Router();
const customerPortalController = require('../controllers/customerPortalController');
const { requireCardSession } = require('../controllers/customerPortalController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes - passwordless sign in
router.post('/request-link', customerPortalController.requestLink);
router.post('/redeem', customerPortalController.redeemLink);

// Customer card, opened with the emailed link
router.get('/card', requireCardSession, customerPortalController.getCard);

// Admin: email a customer their card link
router.post('/admin/send-link', authenticate, isAdmin, customerPortalController.sendLinkToCustomer);

module.exports = router;
