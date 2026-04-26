const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Partner self-registration (account created as inactive, pending admin approval)
router.post('/register-partner', async (req, res) => {
  try {
    const User = require('../models/user');
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const newPartner = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'farmer',
      isActive: false,
      emailVerified: false,
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
    });

    await newPartner.save();

    res.status(201).json({
      success: true,
      message: 'Account created. Pending admin approval.'
    });
  } catch (error) {
    console.error('Partner registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account'
    });
  }
});

// Admin: Get all partner accounts
router.get('/partners', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const User = require('../models/user');
    const partners = await User.find({ role: 'farmer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch partners' });
  }
});

// Admin: Create a partner account directly
router.post('/partners', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const User = require('../models/user');
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const newPartner = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || 'Not provided',
      password,
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
    });

    await newPartner.save();

    res.status(201).json({
      success: true,
      message: 'Partner account created',
      partner: {
        id: newPartner._id,
        name: newPartner.name,
        email: newPartner.email,
        isActive: newPartner.isActive
      }
    });
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({ success: false, message: 'Failed to create partner' });
  }
});

// Admin: Approve or deactivate a partner
router.put('/partners/:id', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const User = require('../models/user');
    const partner = await User.findById(req.params.id);

    if (!partner || partner.role !== 'farmer') {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const { isActive, name, email, phone } = req.body;

    if (typeof isActive === 'boolean') partner.isActive = isActive;
    if (name) partner.name = name;
    if (email) partner.email = email.toLowerCase();
    if (phone) partner.phone = phone;

    await User.updateOne(
      { _id: partner._id },
      { $set: { isActive: partner.isActive, name: partner.name, email: partner.email, phone: partner.phone } }
    );

    res.json({
      success: true,
      message: partner.isActive ? 'Partner approved' : 'Partner deactivated',
      partner: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        isActive: partner.isActive
      }
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ success: false, message: 'Failed to update partner' });
  }
});

// Admin: Reset a partner's password
router.put('/partners/:id/reset-password', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const User = require('../models/user');
    const partner = await User.findById(req.params.id);

    if (!partner || partner.role !== 'farmer') {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    partner.password = password;
    await partner.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Admin: Delete a partner account
router.delete('/partners/:id', authenticate, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const User = require('../models/user');
    const partner = await User.findById(req.params.id);

    if (!partner || partner.role !== 'farmer') {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    await User.deleteOne({ _id: partner._id });

    res.json({ success: true, message: 'Partner account deleted' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ success: false, message: 'Failed to delete partner' });
  }
});

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
