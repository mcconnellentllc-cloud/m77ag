const express = require('express');
const router = express.Router();
const landManagementAuthController = require('../controllers/landManagementAuthController');
const { protect, restrictTo, checkFarmAccess } = require('../middleware/landManagementAuth');

// Authentication routes (public)
router.post('/register', landManagementAuthController.register);
router.post('/login', landManagementAuthController.login);
router.post('/accept-invitation', landManagementAuthController.acceptInvitation);

// Protected routes
router.get('/me', protect, landManagementAuthController.getCurrentUser);

module.exports = router;
