const mongoose = require('mongoose');

/**
 * PropertyLedger — running record of every dollar in/out against a
 * rental property. Combines a valuation ledger (baseline, capital
 * improvements, appreciation, write-downs) with an operating ledger
 * (repair expenses charged against the monthly repair budget, debt
 * paydowns funded from rent).
 *
 * Entry types:
 *   - baseline_value        Starting valuation on `entryDate`
 *   - capital_improvement   Investment IN — increases bookValue
 *   - valuation_adjustment  Positive or negative revaluation
 *   - repair_expense        Money spent from repair budget (does NOT
 *                           change bookValue; tracked against $300/mo)
 *   - debt_paydown          Principal reduction on property debt
 *   - operating_expense     Utilities, insurance, taxes, other opex
 *   - other                 Catch-all with description
 */
const propertyLedgerSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalProperty',
    required: true,
    index: true
  },
  entryType: {
    type: String,
    enum: [
      'baseline_value',
      'capital_improvement',
      'valuation_adjustment',
      'repair_expense',
      'debt_paydown',
      'operating_expense',
      'other'
    ],
    required: true,
    index: true
  },
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Amount is stored as a positive number; direction is implied by
  // entryType. capital_improvement adds to book value; repair_expense
  // charges the repair budget; debt_paydown reduces currentDebtBalance.
  amount: {
    type: Number,
    required: true
  },
  category: String, // e.g. 'roof', 'plumbing', 'appliances', 'landscaping'
  description: {
    type: String,
    required: true
  },
  vendor: String,
  invoiceNumber: String,
  paidBy: String, // who cut the check (Landlord, Employee, Tenant reimbursed)
  receiptUrl: String,
  photoUrls: [String],
  // If this entry relates to a specific lease (e.g. mid-lease
  // improvement, tenant-caused repair), link it.
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  // Optional link to a repair request that this expense closed out.
  repairRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyMessage'
  },
  recordedBy: String, // admin/user who logged the entry
  notes: String
}, {
  timestamps: true
});

propertyLedgerSchema.index({ property: 1, entryDate: -1 });
propertyLedgerSchema.index({ property: 1, entryType: 1 });

const PropertyLedger = mongoose.model('PropertyLedger', propertyLedgerSchema);

module.exports = PropertyLedger;
