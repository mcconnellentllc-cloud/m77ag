const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Customer Information
  customerName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },

  // Review Details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  reviewText: {
    type: String,
    required: true
  },

  // Property/Experience
  property: {
    type: String,
    enum: ['Heritage Farm', 'Prairie Peace', 'Both Properties'],
    required: true
  },
  huntDate: Date,

  // Photos (optional)
  photos: [String],

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  discountCodeSent: {
    type: Boolean,
    default: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for email lookups
reviewSchema.index({ email: 1 });
reviewSchema.index({ status: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
