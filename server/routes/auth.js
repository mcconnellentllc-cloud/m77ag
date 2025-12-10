const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Temporary route to create/reset admin user
router.get('/setup-admin', async (req, res) => {
  try {
    const User = require('../models/user');

    // Try to find existing admin
    let admin = await User.findOne({ email: 'admin@m77ag.com' });

    if (admin) {
      // Reset the password and required fields
      admin.name = 'M77 AG Admin';
      admin.phone = '970-571-1015';
      admin.password = 'M77ag2024!Admin';
      admin.role = 'admin';
      admin.isActive = true;
      admin.emailVerified = true;
      await admin.save();

      return res.json({
        success: true,
        message: 'Admin user password reset successfully',
        email: 'admin@m77ag.com',
        password: 'M77ag2024!Admin'
      });
    } else {
      // Create new admin
      const newAdmin = new User({
        name: 'M77 AG Admin',
        email: 'admin@m77ag.com',
        phone: '970-571-1015',
        password: 'M77ag2024!Admin',
        role: 'admin',
        emailVerified: true,
        isActive: true
      });

      await newAdmin.save();

      return res.json({
        success: true,
        message: 'Admin user created successfully',
        email: 'admin@m77ag.com',
        password: 'M77ag2024!Admin'
      });
    }
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup admin',
      error: error.message
    });
  }
});

// Protected routes
router.get('/verify', authenticate, authController.verifyToken);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
