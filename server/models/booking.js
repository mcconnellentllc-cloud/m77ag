const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Customer Information
  customerName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  
  // Booking Details
  parcel: {
    type: String,
    required: true
  },
  checkinDate: {
    type: Date,
    required: true
  },
  checkoutDate: {
    type: Date,
    required: true
  },
  numHunters: {
    type: Number,
    required: true,
    min: 1
  },

  // Game Species
  gameSpecies: String,

  // Coyote Hunting Type (Day Calling or Night Calling)
  coyoteHuntingType: String,

  // Vehicle Information
  vehicleMake: String,
  vehicleModel: String,
  vehicleColor: String,
  vehicleLicense: String,
  
  // Pricing
  dailyRate: {
    type: Number,
    required: true
  },
  numNights: {
    type: Number,
    required: true
  },
  campingFee: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  depositPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0
  },

  // Discount Information
  discountCode: String,
  discountPercent: Number,
  originalPrice: Number,

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'venmo', 'paypal', 'complimentary'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'deposit_paid', 'paid_in_full', 'paid', 'complimentary'],
    default: 'pending'
  },
  paypalTransactionId: String,
  
  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },

  // Waiver Status
  waiverSigned: {
    type: Boolean,
    default: false
  },
  waiverSignedDate: Date,

  // Paw App Signup
  pawAppSignup: {
    type: Boolean,
    default: false
  },

  // Season Pass Redemption
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  seasonPassRedemption: {
    type: Boolean,
    default: false
  },
  creditsUsed: {
    type: Number,
    default: 0
  },

  // Additional Notes
  notes: String,
  adminNotes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for faster queries
bookingSchema.index({ checkinDate: 1, checkoutDate: 1, parcel: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;