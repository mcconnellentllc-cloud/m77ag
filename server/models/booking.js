const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Hunter Information
  hunterName: {
    type: String,
    required: true
  },
  hunterEmail: {
    type: String,
    required: true
  },
  hunterPhone: {
    type: String,
    required: true
  },
  
  // Booking Details
  parcel: {
    type: String,
    required: true,
    enum: ['north-south', 'homestead', 'rolling-dunes', 'prairie', 'all-ground']
  },
  checkinDate: {
    type: Date,
    required: true
  },
  checkoutDate: {
    type: Date,
    required: true
  },
  
  // Add-ons
  campingIncluded: {
    type: Boolean,
    default: false
  },
  
  // Pricing
  totalCost: {
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
  
  // Payment Info
  paymentMethod: {
    type: String,
    enum: ['paypal', 'venmo', 'cash', 'check', 'admin'],
    default: 'paypal'
  },
  paymentId: {
    type: String  // PayPal transaction ID
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'deposit-paid', 'paid-in-full'],
    default: 'pending'
  },
  
  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  // Additional Info
  notes: {
    type: String
  },
  
  // Admin tracking
  createdBy: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Calculate balance due before saving
bookingSchema.pre('save', function(next) {
  this.balanceDue = this.totalCost - this.depositPaid;
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;