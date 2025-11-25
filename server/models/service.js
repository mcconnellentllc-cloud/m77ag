const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  // Client Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Service Details
  serviceType: {
    type: String,
    required: true,
    enum: [
      // Custom Farming
      'planting', 'disking', 'ripping', 'deep-ripping',
      'harvesting-corn', 'harvesting-wheat', 'harvesting-milo',
      'drilling', 'field-cultivation',
      // Chemical Programs
      'chemical-basic', 'chemical-standard', 'chemical-premium',
      // Cow Care
      'cow-care'
    ]
  },
  acres: {
    type: Number,
    required: true,
    min: 1
  },

  // Pricing Details (for custom farming services)
  basePrice: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },

  // Chemical Program Specific Fields
  chemicalProgram: {
    programName: String,
    products: [{
      name: String,
      ratePerAcre: Number,
      totalGallons: Number,
      containerSize: Number,
      numberOfContainers: Number,
      pricePerGallon: Number,
      totalPrice: Number
    }],
    totalGallons: Number,
    totalCost: Number,
    dropOffPoint: {
      type: String,
      enum: ['M77 AG', 'Mollohan Farms']
    },
    deliveryDate: Date,
    paymentDueDate: Date,
    invoiceSent: {
      type: Boolean,
      default: false
    },
    invoicePaid: {
      type: Boolean,
      default: false
    }
  },

  // Cow Care Specific Fields
  cowCare: {
    numberOfHead: Number,
    duration: String,
    startDate: Date,
    endDate: Date,
    specialRequirements: String
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'contacted', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Notes
  notes: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for quick lookups
serviceRequestSchema.index({ phone: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ serviceType: 1 });
serviceRequestSchema.index({ createdAt: -1 });

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest;
