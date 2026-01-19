const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tenantSchema = new mongoose.Schema({
  // Account credentials
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
  // Personal information
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: Date,
  ssn: String, // Encrypted, for background checks
  driversLicense: {
    number: String,
    state: String
  },
  // Employment info
  employment: {
    employer: String,
    position: String,
    income: Number,
    employerPhone: String,
    yearsEmployed: Number
  },
  // Emergency contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  // Rental history
  rentalHistory: [{
    address: String,
    landlordName: String,
    landlordPhone: String,
    monthlyRent: Number,
    moveInDate: Date,
    moveOutDate: Date,
    reasonForLeaving: String
  }],
  // Current rental info
  currentProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalProperty'
  },
  currentLease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  // Payment settings
  paymentMethod: {
    type: String,
    enum: ['paypal', 'venmo', 'ach', 'check', 'cash'],
    default: 'paypal'
  },
  autopayEnabled: {
    type: Boolean,
    default: false
  },
  autopayDay: {
    type: Number, // Day of month (1-28)
    default: 1
  },
  // Communication preferences
  communicationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    paymentReminders: { type: Boolean, default: true },
    reminderDaysBefore: { type: Number, default: 3 }
  },
  // Documents
  documents: [{
    name: String,
    type: { type: String, enum: ['id', 'lease', 'payment', 'repair', 'notice', 'other'] },
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Account status
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'evicted'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  notes: String
}, {
  timestamps: true
});

// Hash password before saving
tenantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
tenantSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
tenantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
tenantSchema.index({ email: 1 });
tenantSchema.index({ currentProperty: 1 });
tenantSchema.index({ status: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
