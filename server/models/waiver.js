const mongoose = require('mongoose');

const waiverSchema = new mongoose.Schema({
  // Link to booking (optional - can be null for orphaned waivers)
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },

  // Hunter Information
  hunterName: {
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

  // Hunt Details
  huntDate: {
    type: Date,
    required: true
  },
  property: {
    type: String,
    required: true,
    enum: ['Heritage Farm', 'Prairie Peace', 'Both Properties']
  },

  // Vehicle Information (optional)
  vehicleMake: String,
  vehicleModel: String,
  vehicleColor: String,
  vehicleLicense: String,

  // Signature & Agreement
  signature: {
    type: String,
    required: true
  },
  signedAt: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Technical Data
  ipAddress: String,
  userAgent: String,

  // Status
  status: {
    type: String,
    enum: ['signed', 'matched', 'orphaned'],
    default: function() {
      return this.bookingId ? 'matched' : 'orphaned';
    }
  },

  // Admin Notes
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

// Update timestamp before saving
waiverSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for queries
waiverSchema.index({ bookingId: 1 });
waiverSchema.index({ huntDate: 1 });
waiverSchema.index({ email: 1 });
waiverSchema.index({ status: 1 });

module.exports = mongoose.model('Waiver', waiverSchema);
