const mongoose = require('mongoose');

// Income and expense entries for an enterprise kept on its own books, such as
// Lueking, which M77 AG manages but which is not part of M77 AG's financials.
const CATEGORIES = {
  expense: ['rent', 'seed', 'fertilizer', 'chemicals', 'fuel', 'irrigation_power', 'repairs', 'labor',
    'custom_hire', 'crop_insurance', 'trucking_drying', 'property_tax', 'other_expense'],
  income: ['grain_sale', 'government_payment', 'crop_insurance_payment', 'hunting_grazing_rent', 'other_income']
};

const enterpriseEntrySchema = new mongoose.Schema({
  enterprise: { type: String, required: true, trim: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true, enum: [...CATEGORIES.expense, ...CATEGORIES.income] },
  description: { type: String, required: true, trim: true, maxlength: 300 },
  amount: { type: Number, required: true, min: 0 },
  // Crop year the entry belongs to (the lease settles each crop year)
  cropYear: { type: Number, required: true, index: true },
  date: { type: Date },
  dueDate: { type: Date },
  paid: { type: Boolean, default: true },
  // Who was paid, or who paid
  party: { type: String, trim: true, maxlength: 120 },
  // Invoice, check or ticket number. Never card numbers.
  reference: { type: String, trim: true, maxlength: 80 },
  fieldName: { type: String, trim: true, maxlength: 120 },
  notes: { type: String, trim: true, maxlength: 1000 },
  // Entries loaded from the lease schedule
  seedKey: { type: String, trim: true },
  createdBy: { type: String, trim: true }
}, { timestamps: true });

enterpriseEntrySchema.index({ enterprise: 1, cropYear: 1, date: -1 });

const EnterpriseEntry = mongoose.model('EnterpriseEntry', enterpriseEntrySchema);
EnterpriseEntry.CATEGORIES = CATEGORIES;
module.exports = EnterpriseEntry;
