const mongoose = require('mongoose');

const seedOrderSchema = new mongoose.Schema({
  // Farm Association
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },

  // Order Identification
  orderYear: {
    type: Number,
    required: true
  },
  orderNumber: String,
  businessPartnerId: String,
  vendorName: {
    type: String,
    default: 'Pioneer'
  },
  vendorContact: {
    name: String,
    email: String,
    phone: String
  },

  // Order Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'confirmed', 'partially-delivered', 'delivered', 'cancelled'],
    default: 'draft'
  },

  // Corn Seed Items
  cornSeeds: [{
    hybrid: {
      type: String,
      required: true
    },
    traits: String, // AM/LL/RR2/AQ etc.
    packaging: {
      type: String,
      default: '80K Paper Bag PDR seed'
    },
    unitsOrdered: {
      type: Number,
      required: true
    },
    unitsDelivered: {
      type: Number,
      default: 0
    },
    grossUnitPrice: Number,
    averagePricePerUnit: Number,
    totalGrossValue: Number,

    // Field Assignments
    fieldAssignments: [{
      field: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field'
      },
      fieldName: String,
      acres: Number,
      unitsAssigned: Number,
      plantingRate: {
        type: Number,
        default: 32000 // seeds per acre
      },
      plantingDate: Date,
      notes: String
    }],

    // Inventory tracking
    unitsInInventory: {
      type: Number,
      default: 0
    },
    unitsPlanted: {
      type: Number,
      default: 0
    }
  }],

  // Sorghum/Milo Seed Items
  sorghumSeeds: [{
    hybrid: {
      type: String,
      required: true
    },
    traits: String,
    packaging: {
      type: String,
      default: '600K Paper Bag'
    },
    unitsOrdered: {
      type: Number,
      required: true
    },
    unitsDelivered: {
      type: Number,
      default: 0
    },
    grossUnitPrice: Number,
    averagePricePerUnit: Number,
    totalGrossValue: Number,

    // Field Assignments
    fieldAssignments: [{
      field: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field'
      },
      fieldName: String,
      acres: Number,
      unitsAssigned: Number,
      plantingRate: Number,
      plantingDate: Date,
      notes: String
    }],

    unitsInInventory: {
      type: Number,
      default: 0
    },
    unitsPlanted: {
      type: Number,
      default: 0
    }
  }],

  // Wheat Seed Items (for future use)
  wheatSeeds: [{
    variety: String,
    packaging: String,
    unitsOrdered: Number,
    unitsDelivered: {
      type: Number,
      default: 0
    },
    grossUnitPrice: Number,
    totalGrossValue: Number,
    fieldAssignments: [{
      field: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field'
      },
      fieldName: String,
      acres: Number,
      unitsAssigned: Number,
      plantingRate: Number,
      plantingDate: Date,
      notes: String
    }]
  }],

  // Financial Summary
  financials: {
    totalCornUnits: Number,
    totalCornGrossValue: Number,
    cornInfinityDiscount: Number,
    cornEarlyCommitmentBonus: Number,
    cornPerUnitDiscount: Number,
    netCornAmount: Number,

    totalSorghumUnits: Number,
    totalSorghumGrossValue: Number,
    sorghumInfinityDiscount: Number,
    sorghumEarlyCommitmentBonus: Number,
    netSorghumAmount: Number,

    totalWheatUnits: Number,
    totalWheatGrossValue: Number,
    netWheatAmount: Number,

    grossInvoiceValue: Number,
    totalDiscounts: Number,
    netOrderAmount: Number
  },

  // Payments
  payments: [{
    date: Date,
    amount: Number,
    method: String,
    reference: String,
    notes: String
  }],
  totalPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0
  },

  // Important Dates
  orderDate: Date,
  earlyOrderDeadline: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,

  // Notes and Documents
  notes: String,
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: Date
  }],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandManagementUser'
  }
}, {
  timestamps: true
});

// Indexes
seedOrderSchema.index({ farm: 1 });
seedOrderSchema.index({ orderYear: 1 });
seedOrderSchema.index({ status: 1 });
seedOrderSchema.index({ farm: 1, orderYear: 1 });

// Virtual for total units ordered
seedOrderSchema.virtual('totalUnitsOrdered').get(function() {
  const corn = this.cornSeeds.reduce((sum, s) => sum + (s.unitsOrdered || 0), 0);
  const sorghum = this.sorghumSeeds.reduce((sum, s) => sum + (s.unitsOrdered || 0), 0);
  const wheat = this.wheatSeeds.reduce((sum, s) => sum + (s.unitsOrdered || 0), 0);
  return corn + sorghum + wheat;
});

// Method to assign hybrid to field
seedOrderSchema.methods.assignHybridToField = function(seedType, hybridIndex, assignmentData) {
  const seedArray = seedType === 'corn' ? this.cornSeeds :
                    seedType === 'sorghum' ? this.sorghumSeeds :
                    this.wheatSeeds;

  if (hybridIndex >= 0 && hybridIndex < seedArray.length) {
    seedArray[hybridIndex].fieldAssignments.push(assignmentData);
  }

  return this.save();
};

// Method to calculate financials
seedOrderSchema.methods.calculateFinancials = function() {
  // Corn totals
  this.financials.totalCornUnits = this.cornSeeds.reduce((sum, s) => sum + (s.unitsOrdered || 0), 0);
  this.financials.totalCornGrossValue = this.cornSeeds.reduce((sum, s) => sum + (s.totalGrossValue || 0), 0);

  // Sorghum totals
  this.financials.totalSorghumUnits = this.sorghumSeeds.reduce((sum, s) => sum + (s.unitsOrdered || 0), 0);
  this.financials.totalSorghumGrossValue = this.sorghumSeeds.reduce((sum, s) => sum + (s.totalGrossValue || 0), 0);

  // Wheat totals
  this.financials.totalWheatUnits = this.wheatSeeds.reduce((sum, s) => sum + (s.unitsOrdered || 0), 0);
  this.financials.totalWheatGrossValue = this.wheatSeeds.reduce((sum, s) => sum + (s.totalGrossValue || 0), 0);

  // Gross total
  this.financials.grossInvoiceValue = this.financials.totalCornGrossValue +
                                       this.financials.totalSorghumGrossValue +
                                       this.financials.totalWheatGrossValue;

  // Net calculations (after discounts)
  this.financials.netOrderAmount = (this.financials.netCornAmount || 0) +
                                    (this.financials.netSorghumAmount || 0) +
                                    (this.financials.netWheatAmount || 0);

  this.balanceDue = this.financials.netOrderAmount - this.totalPaid;

  return this.save();
};

// Static method to get available hybrids
seedOrderSchema.statics.getAvailableHybrids = function() {
  return {
    corn: [
      { hybrid: 'P0075AM', traits: 'AM/LL/RR2', maturity: '100-day', description: 'Early maturity, excellent yield potential' },
      { hybrid: 'P05081AML', traits: 'AM/LL/RR2/AQ', maturity: '105-day', description: 'AQUAmax drought tolerance' },
      { hybrid: 'P0622AML', traits: 'AM/LL/RR2/AQ', maturity: '106-day', description: 'Strong roots, AQUAmax' },
      { hybrid: 'P0995AM', traits: 'AM/LL/RR2/AQ', maturity: '109-day', description: 'Versatile hybrid, good stress tolerance' },
      { hybrid: 'P1122AML', traits: 'AM/LL/RR2/AQ', maturity: '111-day', description: 'High yield potential, AQUAmax' },
      { hybrid: 'P1244AM', traits: 'AM/LL/RR2/AQ', maturity: '112-day', description: 'Excellent standability' },
      { hybrid: 'P13841PWUE', traits: 'AVBL/VTP/HX1/LL/RR2/ENL/AQ', maturity: '113-day', description: 'PowerCore Ultra Enlist, full trait stack' },
      { hybrid: 'P14830AML', traits: 'AM/LL/RR2', maturity: '114-day', description: 'Late maturity, maximum yield' },
      { hybrid: 'P1548AM', traits: 'AM/LL/RR2/AQ', maturity: '115-day', description: 'Full-season, AQUAmax drought tolerance' }
    ],
    sorghum: [
      { hybrid: '86P20', traits: 'Conventional', maturity: 'Medium', description: 'NSI1 treatment, conventional' },
      { hybrid: '88P71', traits: 'Conventional', maturity: 'Medium-Late', description: 'NSI1 treatment, high yield' }
    ],
    wheat: [
      { variety: 'WestBred WB4303', type: 'Hard Red Winter', description: 'Excellent yield, good disease package' },
      { variety: 'WestBred WB4269', type: 'Hard Red Winter', description: 'High test weight' },
      { variety: 'WestBred WB Grainfield', type: 'Hard Red Winter', description: 'Proven performer' }
    ]
  };
};

const SeedOrder = mongoose.model('SeedOrder', seedOrderSchema);

module.exports = SeedOrder;
