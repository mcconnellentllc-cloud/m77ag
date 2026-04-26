const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

// Get publishable key (public)
router.get('/config', stripeController.getPublishableKey);

// Create payment intent for ACH
router.post('/create-payment-intent', stripeController.createPaymentIntent);

// Check payment status
router.get('/payment-status/:paymentIntentId', stripeController.checkPaymentStatus);

module.exports = router;
