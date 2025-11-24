const mongoose = require('mongoose');

const chemicalProgramSchema = new mongoose.Schema({
  // Program Details
  programName: {
    type: String,
    required: true,
    trim: true
  },
  programType: {
    type: String,
    required: true,
    enum: ['basic', 'standard', 'premium', 'custom']
  },
  description: String,

  // Target Information
  targetCrops: [String],
  applicationTiming: String,
  season: String,

  // Products in Program
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChemicalProduct',
      required: true
    },
    productName: String,
    ratePerAcre: {
      type: Number,
      required: true
    },
    rateUnit: String,
    packSize: String,
    containerSize: Number,
    pricePerUnit: Number,
    applicationInstructions: String,
    mixOrder: Number
  }],

  // Pricing
  basePricePerAcre: Number,

  // Drop-off Points
  availableDropOffPoints: [{
    locationName: String,
    address: String,
    deliveryFee: Number,
    notes: String
  }],

  // Terms
  paymentTerms: {
    type: String,
    default: 'Payment due 10 days prior to delivery'
  },
  minimumAcres: Number,
  maximumAcres: Number,

  // Note: No volume discounts for chemical sales - direct cost only
  // Volume discounts only apply to custom farming services

  // Status
  active: {
    type: Boolean,
    default: true
  },
  availableStartDate: Date,
  availableEndDate: Date
}, {
  timestamps: true
});

// Indexes
chemicalProgramSchema.index({ programType: 1 });
chemicalProgramSchema.index({ active: 1 });
chemicalProgramSchema.index({ targetCrops: 1 });

// Method to calculate total cost for given acres
// Note: Chemical sales are at DIRECT COST - no volume discounts applied
chemicalProgramSchema.methods.calculateCost = function(acres) {
  let totalCost = 0;
  const productsBreakdown = [];

  this.products.forEach(product => {
    const totalNeeded = product.ratePerAcre * acres;
    const containersNeeded = Math.ceil(totalNeeded / product.containerSize);
    const actualGallons = containersNeeded * product.containerSize;
    const productCost = actualGallons * product.pricePerUnit;

    totalCost += productCost;
    productsBreakdown.push({
      productName: product.productName,
      ratePerAcre: product.ratePerAcre,
      totalNeeded: totalNeeded,
      containersNeeded: containersNeeded,
      actualGallons: actualGallons,
      pricePerUnit: product.pricePerUnit,
      totalCost: productCost
    });
  });

  // Chemical sales are at direct cost - no discounts
  const finalTotal = totalCost;

  return {
    baseTotal: totalCost,
    discountPercentage: 0,
    discountAmount: 0,
    finalTotal: finalTotal,
    pricePerAcre: finalTotal / acres,
    productsBreakdown: productsBreakdown
  };
};

const ChemicalProgram = mongoose.model('ChemicalProgram', chemicalProgramSchema);

module.exports = ChemicalProgram;
