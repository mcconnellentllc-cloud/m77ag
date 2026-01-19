const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const landManagementUserSchema = new mongoose.Schema({
  // Basic Info
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },

  // Personal Info
  firstName: String,
  lastName: String,
  phone: String,

  // Role & Access
  role: {
    type: String,
    required: true,
    enum: ['super-admin', 'farm-owner', 'landlord', 'public-user'],
    default: 'public-user'
  },

  // Farm Association (for farm-owner and landlords)
  associatedFarm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },

  // For landlords - which fields/parcels they own
  ownedParcels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field'
  }],

  // Invitation system
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },
  invitationToken: String,
  invitationExpires: Date,
  invitationAccepted: {
    type: Boolean,
    default: false
  },

  // Account type
  accountType: {
    type: String,
    enum: ['private', 'public'],
    default: 'public'
  },

  // Subscription (for future)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial'],
      default: 'active'
    },
    expiresAt: Date
  },

  // Preferences
  preferences: {
    checkSchedule: String,
    checkLocation: String,
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },

  // Status
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
landManagementUserSchema.pre('save', async function(next) {
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
landManagementUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has access to farm
landManagementUserSchema.methods.hasAccessToFarm = function(farmId) {
  if (this.role === 'super-admin') return true;
  if (this.role === 'farm-owner' && this.associatedFarm.toString() === farmId.toString()) return true;
  if (this.role === 'landlord' && this.associatedFarm && this.associatedFarm.toString() === farmId.toString()) return true;
  return false;
};

// Indexes
landManagementUserSchema.index({ email: 1 });
landManagementUserSchema.index({ username: 1 });
landManagementUserSchema.index({ role: 1 });
landManagementUserSchema.index({ associatedFarm: 1 });

const LandManagementUser = mongoose.model('LandManagementUser', landManagementUserSchema);

module.exports = LandManagementUser;
