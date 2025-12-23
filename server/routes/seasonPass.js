const express = require('express');
const router = express.Router();
const seasonPassController = require('../controllers/seasonPassController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/purchase', seasonPassController.purchase);

// Protected routes (require authentication)
router.get('/my-pass', authenticate, seasonPassController.getMyPass);
router.post('/use-credit', authenticate, seasonPassController.useCredit);

// Admin routes
router.get('/all', authenticate, isAdmin, seasonPassController.getAllPasses);

module.exports = router;
