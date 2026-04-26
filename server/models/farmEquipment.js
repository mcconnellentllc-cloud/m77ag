const mongoose = require('mongoose');

/**
 * Farm Equipment Model
 * Track equipment hours, maintenance, fuel, and costs
 * Inspired by Harvest Profit's equipment tracking
 */

const farmEquipmentSchema = new mongoose.Schema({
  // Identification
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'tractor', 'combine', 'sprayer', 'planter', 'drill', 'tillage',
      'truck', 'trailer', 'wagon', 'auger', 'grain_cart', 'mower',
      'baler', 'loader', 'skid_steer', 'atv_utv', 'irrigation', 'other'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['powered', 'implement', 'transport', 'handling', 'other'],
    default: 'powered'
  },

  // Details
  make: String,
  model: String,
  year: Number,
  serialNumber: String,
  vin: String,
  color: String,
  engineHorsepower: Number,
  ptoHorsepower: Number,

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'for_sale', 'sold', 'scrapped'],
    default: 'active'
  },
  currentLocation: String,

  // Hours/Miles Tracking
  hoursAtPurchase: {
    type: Number,
    default: 0
  },
  currentHours: {
    type: Number,
    default: 0
  },
  milesAtPurchase: Number,
  currentMiles: Number,

  // Hour/Mile Logs
  usageLogs: [{
    date: {
      type: Date,
      default: Date.now
    },
    hours: Number,  // Total hours at this reading
    miles: Number,  // Total miles at this reading
    hoursUsed: Number,  // Hours used since last reading
    operation: String,  // What was it used for
    field: String,
    acres: Number,
    operator: String,
    fuelUsed: Number,  // gallons
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Purchase Information
  purchase: {
    date: Date,
    price: Number,
    seller: String,
    dealership: String,
    newOrUsed: {
      type: String,
      enum: ['new', 'used']
    },
    tradeIn: {
      description: String,
      value: Number
    },
    financing: {
      lender: String,
      amount: Number,
      interestRate: Number,
      termMonths: Number,
      monthlyPayment: Number
    },
    notes: String
  },

  // Valuation
  valuation: {
    purchasePrice: Number,
    currentValue: {
      type: Number,
      default: 0
    },
    lastValueUpdate: Date,
    salvageValue: Number
  },

  // Depreciation
  depreciation: {
    method: {
      type: String,
      enum: ['straight_line', 'declining_balance', 'macrs', 'hours_based'],
      default: 'straight_line'
    },
    usefulLifeYears: Number,
    usefulLifeHours: Number,
    annualDepreciation: Number,
    hourlyDepreciation: Number,
    accumulatedDepreciation: {
      type: Number,
      default: 0
    },
    bookValue: Number,
    startDate: Date
  },

  // Maintenance Records
  maintenanceRecords: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['oil_change', 'filter', 'tire', 'belt', 'repair', 'inspection', 'overhaul', 'preventive', 'other']
    },
    description: String,
    hoursAtService: Number,
    milesAtService: Number,
    parts: [{
      name: String,
      partNumber: String,
      quantity: Number,
      cost: Number
    }],
    laborHours: Number,
    laborCost: Number,
    totalCost: Number,
    vendor: String,
    performedBy: String,  // 'self', 'dealer', 'mechanic'
    warranty: Boolean,
    nextServiceDue: {
      hours: Number,
      date: Date,
      description: String
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Fuel Tracking
  fuelRecords: [{
    date: {
      type: Date,
      default: Date.now
    },
    gallons: Number,
    pricePerGallon: Number,
    totalCost: Number,
    hoursAtFill: Number,
    fuelType: {
      type: String,
      enum: ['diesel', 'gasoline', 'def', 'propane'],
      default: 'diesel'
    },
    vendor: String,
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Insurance
  insurance: {
    provider: String,
    policyNumber: String,
    coverage: String,
    premium: Number,  // annual
    deductible: Number,
    expirationDate: Date
  },

  // Registration/Licensing (for road-legal equipment)
  registration: {
    plateNumber: String,
    state: String,
    expirationDate: Date,
    annualFee: Number
  },

  // Annual Cost Summary (calculated/cached)
  annualCosts: {
    year: Number,
    depreciation: Number,
    fuel: Number,
    maintenance: Number,
    insurance: Number,
    financing: Number,
    other: Number,
    total: Number,
    hoursOperated: Number,
    costPerHour: Number
  },

  // Sale Information
  saleInfo: {
    date: Date,
    price: Number,
    buyer: String,
    hoursAtSale: Number,
    milesAtSale: Number,
    gainLoss: Number,
    notes: String
  },

  // Specifications
  specifications: {
    width: String,
    weight: String,
    fuelCapacity: Number,
    hydraulicCapacity: Number,
    oilCapacity: Number,
    tireSize: String,
    attachments: [String],
    features: [String]
  },

  // Documents & Photos
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['manual', 'warranty', 'receipt', 'insurance', 'registration', 'photo', 'other']
    },
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  photos: [{
    url: String,
    caption: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],

  // Notes
  notes: String,

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
farmEquipmentSchema.index({ type: 1 });
farmEquipmentSchema.index({ status: 1 });
farmEquipmentSchema.index({ make: 1, model: 1 });

// Virtual for hours used this year
farmEquipmentSchema.virtual('hoursThisYear').get(function() {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const logs = this.usageLogs?.filter(log => new Date(log.date) >= yearStart) || [];
  return logs.reduce((sum, log) => sum + (log.hoursUsed || 0), 0);
});

// Virtual for fuel efficiency
farmEquipmentSchema.virtual('fuelEfficiency').get(function() {
  if (!this.fuelRecords?.length || !this.usageLogs?.length) return null;

  const totalFuel = this.fuelRecords.reduce((sum, r) => sum + (r.gallons || 0), 0);
  const totalHours = this.usageLogs.reduce((sum, r) => sum + (r.hoursUsed || 0), 0);

  if (totalHours > 0) {
    return (totalFuel / totalHours).toFixed(2) + ' gal/hr';
  }
  return null;
});

// Static method to get equipment fleet summary
farmEquipmentSchema.statics.getFleetSummary = async function() {
  const equipment = await this.find({ status: 'active' });

  const summary = {
    totalUnits: equipment.length,
    totalValue: 0,
    hoursThisYear: 0,
    maintenanceCostsYTD: 0,
    fuelCostsYTD: 0,
    byType: {}
  };

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  equipment.forEach(equip => {
    summary.totalValue += equip.valuation?.currentValue || 0;

    // Hours this year
    const yearLogs = equip.usageLogs?.filter(log => new Date(log.date) >= yearStart) || [];
    summary.hoursThisYear += yearLogs.reduce((sum, log) => sum + (log.hoursUsed || 0), 0);

    // Maintenance costs YTD
    const yearMaint = equip.maintenanceRecords?.filter(m => new Date(m.date) >= yearStart) || [];
    summary.maintenanceCostsYTD += yearMaint.reduce((sum, m) => sum + (m.totalCost || 0), 0);

    // Fuel costs YTD
    const yearFuel = equip.fuelRecords?.filter(f => new Date(f.date) >= yearStart) || [];
    summary.fuelCostsYTD += yearFuel.reduce((sum, f) => sum + (f.totalCost || 0), 0);

    // Group by type
    if (!summary.byType[equip.type]) {
      summary.byType[equip.type] = { count: 0, value: 0 };
    }
    summary.byType[equip.type].count++;
    summary.byType[equip.type].value += equip.valuation?.currentValue || 0;
  });

  return summary;
};

// Static method to get equipment needing maintenance
farmEquipmentSchema.statics.getMaintenanceDue = async function() {
  const equipment = await this.find({ status: 'active' });

  const needingMaintenance = [];

  equipment.forEach(equip => {
    const lastMaintenance = equip.maintenanceRecords?.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    )[0];

    if (lastMaintenance?.nextServiceDue) {
      const now = new Date();
      const dueDate = lastMaintenance.nextServiceDue.date;
      const dueHours = lastMaintenance.nextServiceDue.hours;

      if ((dueDate && new Date(dueDate) <= now) ||
          (dueHours && equip.currentHours >= dueHours)) {
        needingMaintenance.push({
          equipment: equip.name,
          type: equip.type,
          currentHours: equip.currentHours,
          dueAt: lastMaintenance.nextServiceDue,
          description: lastMaintenance.nextServiceDue.description
        });
      }
    }
  });

  return needingMaintenance;
};

const FarmEquipment = mongoose.model('FarmEquipment', farmEquipmentSchema);

module.exports = FarmEquipment;
