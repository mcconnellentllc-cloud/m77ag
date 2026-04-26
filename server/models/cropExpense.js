const mongoose = require('mongoose');

/**
 * CropExpense - Individual line-item expenses posted against crop codes.
 *
 * One expense entry = one operation on one or more fields.
 * Example: "Fall Atrazine" applied to all CORN26 fields.
 * The expense stores the per-acre cost and which fields it applies to.
 * Actual field-level cost aggregation is done by querying all expenses
 * for a given field + cropCode.
 */
const cropExpenseSchema = new mongoose.Schema({
  // What crop code this expense belongs to (e.g., "CORN26", "WHEAT26")
  cropCode: { type: String, required: true, index: true },
  crop: { type: String, required: true },  // e.g., "CORN"
  year: { type: Number, required: true },   // e.g., 2026

  // Expense details
  date: { type: Date, required: true },
  description: { type: String, required: true },  // e.g., "Fall Atrazine 1qt/ac"
  category: {
    type: String,
    required: true,
    enum: ['seed', 'fertilizer', 'chemicals', 'cropInsurance', 'fuelOil',
           'repairs', 'customHire', 'landRent', 'dryingHauling', 'taxes', 'misc']
  },
  costPerAcre: { type: Number, required: true },  // $/acre

  // Which fields this expense applies to
  fields: [{
    fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'CroppingField' },
    farm: String,
    field: String,
    acres: Number
  }],

  // Who pays (for crop-share tracking)
  paidBy: {
    type: String,
    enum: ['operator', 'landlord', 'shared', 'split-by-lease'],
    default: 'split-by-lease'
    // split-by-lease = automatically split based on each field's lease type
  },

  // Vendor / supplier info
  vendor: String,
  invoiceNumber: String,

  // Status tracking
  status: {
    type: String,
    enum: ['projected', 'applied', 'invoiced', 'paid'],
    default: 'projected'
  },

  notes: String,
  createdBy: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Total cost across all fields
cropExpenseSchema.virtual('totalCost').get(function() {
  const totalAcres = (this.fields || []).reduce((sum, f) => sum + (f.acres || 0), 0);
  return this.costPerAcre * totalAcres;
});

cropExpenseSchema.virtual('totalAcres').get(function() {
  return (this.fields || []).reduce((sum, f) => sum + (f.acres || 0), 0);
});

// Indexes for common queries
cropExpenseSchema.index({ cropCode: 1, date: 1 });
cropExpenseSchema.index({ year: 1, category: 1 });
cropExpenseSchema.index({ 'fields.fieldId': 1 });
cropExpenseSchema.index({ status: 1 });

module.exports = mongoose.model('CropExpense', cropExpenseSchema);
