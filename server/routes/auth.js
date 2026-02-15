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

    // Try to find existing admin by email
    let admin = await User.findOne({ email: 'office@m77ag.com' });

    if (admin) {
      // Reset the password and required fields
      admin.name = 'M77 AG Admin';
      admin.phone = '970-571-1015';
      admin.password = 'M77admin2025!';
      admin.role = 'admin';
      admin.isActive = true;
      admin.emailVerified = true;
      await admin.save();

      return res.json({
        success: true,
        message: 'Admin user password reset successfully',
        email: 'office@m77ag.com',
        password: 'M77admin2025!'
      });
    } else {
      // Create new admin
      const newAdmin = new User({
        name: 'M77 AG Admin',
        email: 'office@m77ag.com',
        phone: '970-571-1015',
        password: 'M77admin2025!',
        role: 'admin',
        emailVerified: true,
        isActive: true
      });

      await newAdmin.save();

      return res.json({
        success: true,
        message: 'Admin user created successfully',
        email: 'office@m77ag.com',
        password: 'M77admin2025!'
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

// Setup farmer user (Matt)
router.get('/setup-farmer', async (req, res) => {
  try {
    const User = require('../models/user');

    // Try to find existing user by email
    let farmer = await User.findOne({ email: 'matt@togoag.com' });

    const farmerData = {
      name: 'Matt',
      email: 'matt@togoag.com',
      phone: '000-000-0000',
      password: 'm77ag1',
      role: 'farmer',
      isActive: true,
      emailVerified: true,
      employeePermissions: {
        canAddCattleRecords: true,
        canEditCattleRecords: true,
        canDeleteCattleRecords: false,
        canAddEquipmentLogs: true,
        canEditEquipmentLogs: true,
        canAddTransactions: false,
        canEditTransactions: false,
        canViewFinancials: true,
        canViewReports: true,
        accessAreas: ['cattle', 'crops', 'equipment']
      }
    };

    if (farmer) {
      // Update existing user
      farmer.name = farmerData.name;
      farmer.phone = farmerData.phone;
      farmer.password = farmerData.password;
      farmer.role = farmerData.role;
      farmer.isActive = farmerData.isActive;
      farmer.emailVerified = farmerData.emailVerified;
      farmer.employeePermissions = farmerData.employeePermissions;
      await farmer.save();

      return res.json({
        success: true,
        message: 'Farmer user updated successfully',
        email: farmerData.email,
        password: farmerData.password
      });
    } else {
      // Create new farmer
      const newFarmer = new User(farmerData);
      await newFarmer.save();

      return res.json({
        success: true,
        message: 'Farmer user created successfully',
        email: farmerData.email,
        password: farmerData.password
      });
    }
  } catch (error) {
    console.error('Setup farmer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup farmer',
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
