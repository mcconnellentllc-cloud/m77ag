const mongoose = require('mongoose');

const rentalPropertySchema = new mongoose.Schema({
  // Basic property information
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  propertyType: {
    type: String,
    enum: ['house', 'apartment', 'duplex', 'mobile_home', 'commercial'],
    default: 'house'
  },
  // Property location
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    county: String,
    state: { type: String, default: 'CO' },
    zip: { type: String, required: true }
  },
  // Property features
  features: {
    bedrooms: Number,
    bathrooms: Number,
    sqft: Number,
    garage: Boolean,
    petFriendly: Boolean,
    utilitiesIncluded: { type: Boolean, default: false },
    laundry: { type: String, enum: ['in_unit', 'on_site', 'none'] },
    appliances: [String], // ['refrigerator', 'stove', 'dishwasher', 'washer', 'dryer']
    amenities: [String]
  },
  // Rental pricing tiers
  pricing: {
    monthToMonth: { type: Number, required: true }, // $1400
    sixMonth: { type: Number }, // $1300
    twelveMonth: { type: Number }, // $1250
    securityDeposit: { type: Number }, // 1 month rent
    petDeposit: Number,
    applicationFee: Number
  },
  // Images
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  // Status
  status: {
    type: String,
    enum: ['available', 'rented', 'pending', 'maintenance', 'inactive'],
    default: 'available'
  },
  currentTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  currentLease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  // Colorado required disclosures
  disclosures: {
    radonTested: { type: Boolean, default: false },
    radonLevel: String,
    radonMitigation: Boolean,
    leadPaint: Boolean, // Required for pre-1978 homes
    leadPaintDisclosure: String,
    bedBugHistory: Boolean,
    bedBugLastOccurrence: Date,
    yearBuilt: Number,
    uninhabitableReportingEmail: String,
    uninhabitableReportingAddress: String
  },
  // Owner/Manager info
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  managerContact: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
rentalPropertySchema.index({ status: 1 });
rentalPropertySchema.index({ 'address.city': 1 });
rentalPropertySchema.index({ isActive: 1 });

const RentalProperty = mongoose.model('RentalProperty', rentalPropertySchema);

module.exports = RentalProperty;
