const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true
  },
  supplier: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const chemicalProductSchema = new mongoose.Schema({
  // Product Information
  productName: {
    type: String,
    required: true,
    trim: true
  },
  packSize: {
    type: String,
    required: true,
    trim: true
  },
  units: {
    type: String,
    required: true,
    enum: ['gl', 'oz', 'lb', 'kg', 'qt', 'pt']
  },

  // Current Pricing
  currentPrice: {
    type: Number,
    required: true
  },
  supplier: {
    type: String,
    default: 'Crop Protect Direct'
  },

  // Alternative Suppliers
  alternativeSuppliers: [{
    supplierName: String,
    price: Number,
    packSize: String,
    lastUpdated: Date
  }],

  // Price History
  priceHistory: [priceHistorySchema],

  // Product Details
  activeIngredient: String,
  formulation: String,
  category: {
    type: String,
    enum: ['herbicide', 'fungicide', 'insecticide', 'growth-regulator', 'adjuvant', 'fertilizer']
  },

  // Application Info
  applicationTiming: {
    type: String,
    enum: ['pre-emerge', 'post-emerge', 'burndown', 'in-season', 'pre-plant']
  },
  targetCrops: [String],
  targetPests: [String],

  // Rate Information (per acre)
  recommendedRateMin: Number,
  recommendedRateMax: Number,
  rateUnit: String,

  // Container Information
  containerSizes: [{
    size: Number,
    unit: String,
    available: {
      type: Boolean,
      default: true
    }
  }],

  // Availability
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: Number,
  reorderPoint: Number,

  // Notes
  notes: String,
  restrictions: String,
  mixingCompatibility: [String],

  // Status
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chemicalProductSchema.index({ productName: 1, packSize: 1 });
chemicalProductSchema.index({ category: 1 });
chemicalProductSchema.index({ applicationTiming: 1 });
chemicalProductSchema.index({ supplier: 1 });
chemicalProductSchema.index({ active: 1 });

// Method to add price history
chemicalProductSchema.methods.addPriceHistory = function(price, supplier) {
  this.priceHistory.push({ price, supplier, date: new Date() });
  this.currentPrice = price;
  if (supplier) this.supplier = supplier;
  return this.save();
};

const ChemicalProduct = mongoose.model('ChemicalProduct', chemicalProductSchema);

module.exports = ChemicalProduct;
