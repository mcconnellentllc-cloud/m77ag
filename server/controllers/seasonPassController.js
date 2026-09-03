const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { sendSeasonPassConfirmation } = require('../utils/emailservice');
const { issueCardLink } = require('./customerPortalController');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30d'; // Season pass users get longer sessions

// Credits granted per pass type. Pricing: 5-day = $750, 10-day = $1,400.
// Season pass holders get access to BOTH properties (2,710 acres) per credit.
const PASS_CREDITS = {
  '5-day': 5,
  '10-day': 10
};

// Season runs through March 31. A pass bought after March 31 is valid through
// March 31 of the following year.
const getSeasonExpiration = () => {
  const expiresAt = new Date();
  expiresAt.setMonth(2); // March (0-indexed)
  expiresAt.setDate(31);
  if (expiresAt < new Date()) {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }
  return expiresAt;
};

// Email the pass holder the waiver link and property maps, and notify the
// office. Failures are logged and recorded but never fail the sale.
const deliverPassDocuments = async (user) => {
  try {
    await sendSeasonPassConfirmation({
      name: user.name,
      email: user.email,
      phone: user.phone,
      recordedBy: user.seasonPass.recordedBy,
      seasonPass: user.seasonPass
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { 'seasonPass.documentsSentAt': new Date() } }
    );

    // Follow with a sign-in link to their customer card, where the pass,
    // reservations, waivers and invoices all live
    try {
      await issueCardLink({
        email: user.email,
        name: user.name,
        issuedBy: 'season pass confirmation'
      });
    } catch (linkError) {
      console.error('Failed to send customer card link to', user.email, linkError);
    }

    return true;
  } catch (emailError) {
    console.error('Failed to send season pass documents to', user.email, emailError);
    return false;
  }
};

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
      const creditsTotal = PASS_CREDITS[passType];
      if (!creditsTotal) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pass type'
        });
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
          expiresAt: getSeasonExpiration(),
          creditsTotal,
          creditsRemaining: creditsTotal,
          amountPaid,
          paymentMethod: 'paypal',
          paymentReference: paypalTransactionId || paypalOrderId,
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

      // Email the waiver link and property maps to the buyer and notify the office
      const documentsSent = await deliverPassDocuments(newUser);

      console.log('Season pass purchased:', {
        email: newUser.email,
        type: passType,
        credits: creditsTotal,
        paypalOrderId,
        documentsSent
      });

      res.json({
        success: true,
        message: 'Season pass purchased successfully!',
        documentsSent,
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

  // Admin: Record a season pass paid for outside the website (PayPal invoice,
  // check, cash). Creates the customer account if needed, then emails the
  // waiver link and property maps and notifies the office.
  recordPass: async (req, res) => {
    try {
      const { name, email, phone, passType, amountPaid, paymentMethod, paymentReference } = req.body;

      if (!name || !email || !passType) {
        return res.status(400).json({
          success: false,
          message: 'Name, email and pass type are required'
        });
      }

      const creditsTotal = PASS_CREDITS[passType];
      if (!creditsTotal) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pass type'
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const seasonPass = {
        active: true,
        type: passType,
        purchaseDate: new Date(),
        expiresAt: getSeasonExpiration(),
        creditsTotal,
        creditsRemaining: creditsTotal,
        amountPaid: amountPaid !== undefined && amountPaid !== null && amountPaid !== ''
          ? Number(amountPaid)
          : (passType === '10-day' ? 1400 : 750),
        paymentMethod: paymentMethod || 'paypal-invoice',
        paymentReference: paymentReference || '',
        recordedBy: (req.user && req.user.email) || 'Office',
        bookingIds: []
      };

      let user = await User.findOne({ email: normalizedEmail });
      let accountCreated = false;
      let temporaryPassword = null;

      if (user) {
        // Existing customer buying a pass. This replaces any prior pass with a
        // full set of credits; past hunts remain on their booking records.
        user.name = user.name || name;
        user.phone = phone || user.phone;
        user.seasonPass = seasonPass;
        await user.save();
      } else {
        // No account yet. A phone number is required to create the customer record.
        if (!phone) {
          return res.status(400).json({
            success: false,
            message: 'A phone number is required to create a new customer account'
          });
        }

        // Create the account with a temporary password the office hands to the
        // customer; they can reset it from the login page.
        temporaryPassword = 'M77' + Math.random().toString(36).slice(-8).toUpperCase();
        accountCreated = true;

        user = new User({
          name,
          email: normalizedEmail,
          phone,
          password: temporaryPassword,
          role: 'customer',
          emailVerified: true,
          isActive: true,
          seasonPass
        });

        await user.save();
      }

      const documentsSent = await deliverPassDocuments(user);

      console.log('Season pass recorded by admin:', {
        email: user.email,
        type: passType,
        reference: seasonPass.paymentReference,
        accountCreated,
        documentsSent
      });

      res.status(201).json({
        success: true,
        message: documentsSent
          ? 'Season pass recorded. Waiver link and property maps emailed to the customer.'
          : 'Season pass recorded, but the confirmation email failed to send. Use Resend Waiver and Maps to try again.',
        documentsSent,
        accountCreated,
        temporaryPassword,
        pass: {
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          seasonPass: user.seasonPass
        }
      });

    } catch (error) {
      console.error('Error recording season pass:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record season pass: ' + error.message
      });
    }
  },

  // Admin: Resend the waiver link and property maps to an existing pass holder
  resendPassDocuments: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No customer account found for this email'
        });
      }

      if (!user.seasonPass || !user.seasonPass.active) {
        return res.status(400).json({
          success: false,
          message: 'This customer does not have an active season pass'
        });
      }

      const documentsSent = await deliverPassDocuments(user);

      if (!documentsSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send the waiver link and property maps. Check the email configuration.'
        });
      }

      res.json({
        success: true,
        message: `Waiver link and property maps sent to ${user.email}`,
        documentsSent
      });

    } catch (error) {
      console.error('Error resending season pass documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend season pass documents'
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
