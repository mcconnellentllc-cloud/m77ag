const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  // User who submitted
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Related booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },

  // Property
  property: {
    type: String,
    required: true,
    enum: ['Heritage Farm', 'Prairie Peace', 'Both Properties']
  },

  // Rating
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // Content
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // Hunt Details
  huntType: String, // e.g., "Multi-species Hunt", "Deer Hunt", etc.
  huntDate: Date,

  // Photos
  photos: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Approval Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,

  // Flags
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },

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

// Update timestamp on save
testimonialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial;
