const mongoose = require('mongoose');

const equipmentOfferSchema = new mongoose.Schema({
  // Equipment Info
  equipmentId: {
    type: String,
    required: true
  },
  equipmentTitle: {
    type: String,
    required: true
  },

  // Buyer Information
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  buyerPhone: {
    type: String
  },

  // Offer Details
  listPrice: {
    type: Number,
    required: true
  },
  offerAmount: {
    type: Number,
    required: true
  },

  // Negotiation History
  negotiationHistory: [{
    type: {
      type: String,
      enum: ['user', 'bot']
    },
    message: String,
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'sold'],
    default: 'pending'
  },

  // Final Sale Info (if accepted)
  finalPrice: Number,
  acceptedAt: Date,

  // Tracking
  source: {
    type: String,
    default: 'website'
  },
  utmSource: String,
  ipAddress: String,
  userAgent: String

}, {
  timestamps: true
});

// Index for quick lookups
equipmentOfferSchema.index({ equipmentId: 1, status: 1 });
equipmentOfferSchema.index({ buyerEmail: 1 });
equipmentOfferSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EquipmentOffer', equipmentOfferSchema);
