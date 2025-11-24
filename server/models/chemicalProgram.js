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

  // Volume Discounts
  volumeDiscounts: [{
    minAcres: Number,
    discountPercentage: Number
  }],

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

  // Apply volume discounts
  let discount = 0;
  if (this.volumeDiscounts && this.volumeDiscounts.length > 0) {
    const sortedDiscounts = this.volumeDiscounts.sort((a, b) => b.minAcres - a.minAcres);
    for (const tier of sortedDiscounts) {
      if (acres >= tier.minAcres) {
        discount = tier.discountPercentage / 100;
        break;
      }
    }
  }

  const discountAmount = totalCost * discount;
  const finalTotal = totalCost - discountAmount;

  return {
    baseTotal: totalCost,
    discountPercentage: discount * 100,
    discountAmount: discountAmount,
    finalTotal: finalTotal,
    pricePerAcre: finalTotal / acres,
    productsBreakdown: productsBreakdown
  };
};

const ChemicalProgram = mongoose.model('ChemicalProgram', chemicalProgramSchema);

module.exports = ChemicalProgram;
