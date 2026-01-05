const jwt = require('jsonwebtoken');
const LandManagementUser = require('../models/landManagementUser');
const Farm = require('../models/farm');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      associatedFarm: user.associatedFarm
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Register new user (public side)
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await LandManagementUser.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new public user
    const user = await LandManagementUser.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'public-user',
      accountType: 'public'
    });

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountType: user.accountType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await LandManagementUser.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountType: user.accountType,
        associatedFarm: user.associatedFarm
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await LandManagementUser.findById(req.user.id)
      .select('-password')
      .populate('associatedFarm', 'farmName farmCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// Accept invitation (for landlords)
exports.acceptInvitation = async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    // Find user by invitation token
    const user = await LandManagementUser.findOne({
      invitationToken: token,
      invitationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }

    // Update user
    user.password = password;
    user.firstName = firstName;
    user.lastName = lastName;
    user.invitationAccepted = true;
    user.invitationToken = undefined;
    user.invitationExpires = undefined;
    user.active = true;

    await user.save();

    // Generate token
    const authToken = generateToken(user);

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      token: authToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountType: user.accountType,
        associatedFarm: user.associatedFarm
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation',
      error: error.message
    });
  }
};

// Create default M77 AG farm and super admin
exports.createDefaultFarm = async () => {
  try {
    // Check if super admin exists
    const superAdmin = await LandManagementUser.findOne({ role: 'super-admin' });

    if (!superAdmin) {
      // Create super admin
      const admin = await LandManagementUser.create({
        username: 'mcconnell',
        email: process.env.FARM_ADMIN_EMAIL || 'admin@m77ag.com',
        password: process.env.FARM_ADMIN_PASSWORD || 'M77Farm2024!',
        firstName: 'Admin',
        lastName: 'M77AG',
        role: 'super-admin',
        accountType: 'private'
      });

      console.log('Super admin created for land management');

      // Create M77 AG Farm
      const farm = await Farm.create({
        farmName: 'M77 AG',
        farmCode: 'M77AG',
        owner: admin._id,
        farmType: 'private',
        location: {
          city: 'Northeast',
          state: 'Colorado'
        },
        settings: {
          allowLandlordAccess: true,
          landlordCanViewFinancials: false,
          landlordCanInputPreferences: true
        }
      });

      // Associate farm with admin
      admin.associatedFarm = farm._id;
      await admin.save();

      console.log('M77 AG Farm created');
    }
  } catch (error) {
    console.error('Error creating default farm:', error);
  }
};

module.exports = exports;
