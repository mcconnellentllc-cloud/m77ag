const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },

  // User Type
  role: {
    type: String,
    enum: ['customer', 'admin', 'landlord', 'farmer', 'employee', 'banker'],
    default: 'customer'
  },

  // Employee-specific permissions (when role is 'employee')
  employeePermissions: {
    // Data Entry Permissions
    canAddCattleRecords: { type: Boolean, default: true },
    canEditCattleRecords: { type: Boolean, default: false },
    canDeleteCattleRecords: { type: Boolean, default: false },

    canAddEquipmentLogs: { type: Boolean, default: true },
    canEditEquipmentLogs: { type: Boolean, default: false },

    canAddTransactions: { type: Boolean, default: false },
    canEditTransactions: { type: Boolean, default: false },

    canViewFinancials: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true },

    // Specific access areas
    accessAreas: [{
      type: String,
      enum: ['cattle', 'crops', 'equipment', 'capital', 'hunting', 'rentals']
    }]
  },

  // Employee Details
  employeeDetails: {
    position: String,
    hireDate: Date,
    supervisor: String,
    department: String,
    phone: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },

  // Profile
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },

  // Hunting Info
  huntingLicense: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },

  // Season Pass
  seasonPass: {
    active: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['5-day', '10-day', null],
      default: null
    },
    purchaseDate: Date,
    expiresAt: Date,
    creditsTotal: {
      type: Number,
      default: 0
    },
    creditsRemaining: {
      type: Number,
      default: 0
    },
    amountPaid: Number,
    // How the pass was paid for. Off-site payments (PayPal invoice, check, cash)
    // are recorded by the office rather than captured through the website.
    paymentMethod: {
      type: String,
      enum: ['paypal', 'paypal-invoice', 'check', 'cash', 'other'],
      default: 'paypal'
    },
    // PayPal transaction/order ID, check number, or invoice number
    paymentReference: String,
    // Set when the waiver link and property maps were last emailed to the holder
    documentsSentAt: Date,
    recordedBy: String,
    bookingIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }]
  },

  // Landlord-specific fields
  landlordPreferences: {
    // Grain sale price target (per bushel)
    grainSalePrice: {
      corn: Number,
      soybeans: Number,
      wheat: Number,
      milo: Number
    },
    // When landlord wants to be paid
    paymentTiming: {
      type: String,
      enum: ['immediately', 'after_harvest', 'end_of_year', 'custom'],
      default: 'after_harvest'
    },
    customPaymentDate: Date,
    // Payment method preferences
    paymentMethod: {
      type: String,
      enum: ['check', 'ach', 'wire'],
      default: 'check'
    },
    // ACH/Bank info (encrypted in production)
    bankInfo: {
      accountName: String,
      routingNumber: String,
      accountNumber: String,
      accountType: {
        type: String,
        enum: ['checking', 'savings']
      }
    },
    // Stripe customer ID for ACH payments
    stripeCustomerId: String,
    stripeBankAccountId: String,
    // Notes from landlord
    specialInstructions: String
  },

  // Properties owned (for landlords)
  properties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],

  // Farm codes this landlord owns (maps to CroppingField.farm)
  landlordFarms: [{
    type: String,
    enum: ['LAFARMS', 'KBFARMS', 'PETERSON', 'HDFARMS', 'MEFARMS', 'A1FARMS']
  }],

  // Customer Loyalty / Spending Tracker
  lifetimeSpend: {
    type: Number,
    default: 0
  },
  loyaltyTier: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'platinum'],
    default: 'none'
  },
  loyaltyDiscountActive: {
    type: Boolean,
    default: false
  },


  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// Create default admin user if none exists
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      // Only from a password set in the server environment; never a default.
      const initial = process.env.ADMIN_INITIAL_PASSWORD;
      if (!initial || initial.length < 12) {
        console.error('No admin user exists. Set ADMIN_INITIAL_PASSWORD (12+ characters) or run scripts/createAdmin.js.');
        return;
      }
      const defaultAdmin = new User({
        name: 'M77 AG Admin',
        email: 'office@m77ag.com',
        phone: '970-571-1015',
        password: initial,
        role: 'admin',
        emailVerified: true,
        isActive: true
      });

      await defaultAdmin.save();
      console.log('Default admin user created: office@m77ag.com');

    }
  } catch (error) {
    console.error('Error creating default admin:', error.message);
  }
}

// The farmer account (Matt) is created by an admin, never automatically with
// a fixed password. Kept as a no-op so existing callers do not break.
async function createDefaultFarmer() {}

module.exports = User;
module.exports.createDefaultAdmin = createDefaultAdmin;
module.exports.createDefaultFarmer = createDefaultFarmer;
