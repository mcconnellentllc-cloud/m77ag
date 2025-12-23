const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30d'; // Season pass users get longer sessions

const seasonPassController = {
  // Purchase a season pass (creates account + season pass)
  purchase: async (req, res) => {
    try {
      const { name, email, phone, password, passType, amountPaid, paypalOrderId, paypalTransactionId } = req.body;

      // Validate input
      if (!name || !email || !phone || !password || !passType || !amountPaid) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please log in instead.'
        });
      }

      // Validate pass type and set credits
      let creditsTotal = 0;
      if (passType === '5-day') {
        creditsTotal = 5;
      } else if (passType === '10-day') {
        creditsTotal = 10;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid pass type'
        });
      }

      // Calculate expiration date (end of season - March 31 next year)
      const expiresAt = new Date();
      expiresAt.setMonth(2); // March (0-indexed)
      expiresAt.setDate(31);
      if (expiresAt < new Date()) {
        // If March 31 has passed, set to next year
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // Create new user with season pass
      const newUser = new User({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        role: 'customer',
        emailVerified: true, // Auto-verify since they paid
        isActive: true,
        seasonPass: {
          active: true,
          type: passType,
          purchaseDate: new Date(),
          expiresAt,
          creditsTotal,
          creditsRemaining: creditsTotal,
          amountPaid,
          bookingIds: []
        }
      });

      await newUser.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser._id,
          email: newUser.email,
          role: newUser.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Send confirmation email (optional - implement later)
      // TODO: Send welcome email with season pass details

      console.log('Season pass purchased:', {
        email: newUser.email,
        type: passType,
        credits: creditsTotal,
        paypalOrderId
      });

      res.json({
        success: true,
        message: 'Season pass purchased successfully!',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          seasonPass: newUser.seasonPass
        }
      });

    } catch (error) {
      console.error('Error purchasing season pass:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to purchase season pass: ' + error.message
      });
    }
  },

  // Get current user's season pass info
  getMyPass: async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.seasonPass || !user.seasonPass.active) {
        return res.status(404).json({
          success: false,
          message: 'No active season pass found'
        });
      }

      res.json({
        success: true,
        seasonPass: user.seasonPass
      });

    } catch (error) {
      console.error('Error getting season pass:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get season pass'
      });
    }
  },

  // Use a credit to make a booking
  useCredit: async (req, res) => {
    try {
      const { bookingId } = req.body;

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.seasonPass || !user.seasonPass.active) {
        return res.status(400).json({
          success: false,
          message: 'No active season pass found'
        });
      }

      if (user.seasonPass.creditsRemaining <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No credits remaining'
        });
      }

      // Check if pass has expired
      if (user.seasonPass.expiresAt && new Date(user.seasonPass.expiresAt) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Season pass has expired'
        });
      }

      // Deduct credit
      user.seasonPass.creditsRemaining -= 1;
      user.seasonPass.bookingIds.push(bookingId);

      await user.save();

      res.json({
        success: true,
        message: 'Credit used successfully',
        creditsRemaining: user.seasonPass.creditsRemaining
      });

    } catch (error) {
      console.error('Error using credit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to use credit'
      });
    }
  },

  // Admin: Get all season pass holders
  getAllPasses: async (req, res) => {
    try {
      const users = await User.find({
        'seasonPass.active': true
      }).select('-password').sort({ 'seasonPass.purchaseDate': -1 });

      res.json({
        success: true,
        passes: users.map(user => ({
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          seasonPass: user.seasonPass
        }))
      });

    } catch (error) {
      console.error('Error getting all passes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get season passes'
      });
    }
  }
};

module.exports = seasonPassController;
