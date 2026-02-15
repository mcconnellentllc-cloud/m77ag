const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  category: {
    type: String,
    enum: ['Hay Equipment', 'Sprayer Equipment', 'Harvest Equipment', 'Attachments',
           'Combine Parts', 'Feed Truck', 'Tractors', 'Trucks', 'Trailers',
           'Tillage', 'Planting', 'Tech', 'Personal Vehicles', 'Shop',
           'Livestock Equipment', 'Yard Equipment', 'Other'],
    default: 'Other'
  },
  make: String,
  model: String,
  year: Number,
  vin: String,
  serialNumber: String,
  description: String,

  // Images & Media
  images: [String],
  videos: [String],

  // Specifications (flexible key-value)
  specs: {
    type: Map,
    of: String
  },

  // Hours/Miles Tracking
  currentHours: {
    type: Number,
    default: 0
  },
  hoursAtPurchase: {
    type: Number,
    default: 0
  },
  currentMiles: Number,
  milesAtPurchase: Number,

  // Maintenance Records - the owner's spec sheet
  maintenanceRecords: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['oil_change', 'filter_air', 'filter_fuel', 'filter_oil', 'filter_hydraulic',
             'tire', 'belt', 'repair', 'inspection', 'overhaul', 'grease', 'fluid_check',
             'preventive', 'other']
    },
    description: {
      type: String,
      required: true
    },
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
    performedBy: {
      type: String,
      enum: ['self', 'dealer', 'mechanic', 'employee'],
      default: 'self'
    },
    vendor: String,
    nextServiceDue: {
      hours: Number,
      date: Date,
      description: String
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Maintenance Schedule Templates (when service is due)
  maintenanceSchedule: {
    oilChangeInterval: { type: Number, default: 250 }, // hours
    airFilterInterval: { type: Number, default: 500 },
    fuelFilterInterval: { type: Number, default: 500 },
    hydraulicFilterInterval: { type: Number, default: 1000 },
    greaseInterval: { type: Number, default: 50 }
  },

  // Sale Status
  forSale: {
    type: Boolean,
    default: false
  },
  saleStatus: {
    type: String,
    enum: ['available', 'pending', 'sold', 'not-for-sale'],
    default: 'not-for-sale'
  },
  askingPrice: {
    type: Number,
    default: 0
  },
  floorPrice: {
    type: Number,
    default: 0
  },
  soldPrice: Number,
  soldDate: Date,
  soldTo: String,

  // Financial Tracking (PRIVATE - never shown on for-sale listings)
  currentValue: {
    type: Number,
    default: 0
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  purchaseDate: Date,

  // Market Valuation
  marketValue: {
    type: Number,
    default: 0
  },
  marketValueSource: String, // e.g., "TractorHouse", "MachineryPete", "Local Dealer"
  marketValueDate: Date,
  marketTrends: {
    avgSalePrice: Number,
    priceRangeLow: Number,
    priceRangeHigh: Number,
    avgDaysToSell: Number,
    demandLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    notes: String
  },

  // Loan/Payment Information (PRIVATE)
  hasLoan: {
    type: Boolean,
    default: false
  },
  amountOwed: {
    type: Number,
    default: 0
  },
  lender: String,
  loanAccountNumber: String,
  interestRate: Number,
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'none'],
    default: 'none'
  },
  nextPaymentDate: Date,
  loanEndDate: Date,

  // Market Research
  marketResearch: {
    type: Map,
    of: String
  },

  // Marketplace suggestions for advertising
  marketplaces: [{
    name: String,
    reason: String,
    url: String,
    rank: Number
  }],

  // Location
  location: {
    type: String,
    default: 'Phillips County, CO'
  },

  // Owner Entity (M77 AG, McConnell Enterprises, Personal, etc.)
  ownerEntity: {
    type: String,
    enum: ['M77 AG', 'McConnell Enterprises', 'Kyle & Brandi McConnell', 'Personal', 'Other'],
    default: 'M77 AG'
  },

  // Notes
  notes: String,

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
equipmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for equity (value - owed)
equipmentSchema.virtual('equity').get(function() {
  return this.currentValue - this.amountOwed;
});

// Virtual for reporting value (80% of market value)
equipmentSchema.virtual('reportingValue').get(function() {
  if (this.marketValue > 0) {
    return Math.round(this.marketValue * 0.80);
  }
  // Fall back to 80% of current value if no market value set
  return Math.round(this.currentValue * 0.80);
});

// Virtual for hours used since purchase
equipmentSchema.virtual('hoursUsed').get(function() {
  return this.currentHours - (this.hoursAtPurchase || 0);
});

// Virtual to calculate next maintenance due
equipmentSchema.virtual('maintenanceDue').get(function() {
  const due = [];
  const schedule = this.maintenanceSchedule || {};
  const currentHours = this.currentHours || 0;

  // Find last service of each type
  const lastService = {};
  (this.maintenanceRecords || []).forEach(record => {
    if (!lastService[record.type] || new Date(record.date) > new Date(lastService[record.type].date)) {
      lastService[record.type] = record;
    }
  });

  // Check oil change
  if (schedule.oilChangeInterval) {
    const last = lastService['oil_change'];
    const lastHours = last?.hoursAtService || this.hoursAtPurchase || 0;
    const nextDue = lastHours + schedule.oilChangeInterval;
    if (currentHours >= nextDue - 25) { // Due within 25 hours
      due.push({
        type: 'oil_change',
        description: 'Oil Change',
        dueAtHours: nextDue,
        hoursOverdue: currentHours - nextDue,
        lastServiceDate: last?.date,
        lastServiceHours: lastHours
      });
    }
  }

  // Check air filter
  if (schedule.airFilterInterval) {
    const last = lastService['filter_air'];
    const lastHours = last?.hoursAtService || this.hoursAtPurchase || 0;
    const nextDue = lastHours + schedule.airFilterInterval;
    if (currentHours >= nextDue - 50) {
      due.push({
        type: 'filter_air',
        description: 'Air Filter',
        dueAtHours: nextDue,
        hoursOverdue: currentHours - nextDue,
        lastServiceDate: last?.date,
        lastServiceHours: lastHours
      });
    }
  }

  // Check fuel filter
  if (schedule.fuelFilterInterval) {
    const last = lastService['filter_fuel'];
    const lastHours = last?.hoursAtService || this.hoursAtPurchase || 0;
    const nextDue = lastHours + schedule.fuelFilterInterval;
    if (currentHours >= nextDue - 50) {
      due.push({
        type: 'filter_fuel',
        description: 'Fuel Filter',
        dueAtHours: nextDue,
        hoursOverdue: currentHours - nextDue,
        lastServiceDate: last?.date,
        lastServiceHours: lastHours
      });
    }
  }

  // Check grease
  if (schedule.greaseInterval) {
    const last = lastService['grease'];
    const lastHours = last?.hoursAtService || this.hoursAtPurchase || 0;
    const nextDue = lastHours + schedule.greaseInterval;
    if (currentHours >= nextDue - 10) {
      due.push({
        type: 'grease',
        description: 'Grease Points',
        dueAtHours: nextDue,
        hoursOverdue: currentHours - nextDue,
        lastServiceDate: last?.date,
        lastServiceHours: lastHours
      });
    }
  }

  return due.sort((a, b) => b.hoursOverdue - a.hoursOverdue);
});

// Ensure virtuals are included in JSON
equipmentSchema.set('toJSON', { virtuals: true });
equipmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
