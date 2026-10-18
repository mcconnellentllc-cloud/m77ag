const mongoose = require('mongoose');

// One crop insurance unit attached to one M77Field for one crop year and crop.
// Kept per year and crop (WHEAT 2026, CORN 2027) so a new year never
// overwrites the last one.
const fieldInsuranceSchema = new mongoose.Schema({
  m77Field: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field', required: true, index: true },
  m77Farm: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Farm' },
  // Snapshots taken when the unit is attached so statements read correctly later.
  fieldName: { type: String, trim: true },
  farmName: { type: String, trim: true },
  landlordName: { type: String, trim: true },

  cropYear: { type: Number, required: true, index: true },
  crop: { type: String, required: true, uppercase: true, trim: true },

  company: { type: String, trim: true },
  // Policy holder (M77 AG, LLC or McConnell Enterprises LLC).
  insuredName: { type: String, trim: true },
  // Premium for this unit: its net premium (after subsidy) plus its share of the
  // county administrative fee and interest.
  premium: { type: Number, default: null },
  policyNumber: { type: String, required: true, trim: true },
  agent: { type: String, trim: true },
  unitNumber: { type: String, required: true, trim: true },
  fsn: { type: String, trim: true },
  county: { type: String, trim: true },
  location: { type: String, trim: true },
  practice: { type: String, trim: true },

  plan: { type: String, trim: true },              // RP, RP-HPE, YP
  coverageLevel: { type: Number, min: 50, max: 85 },
  insuredAcres: { type: Number, min: 0 },
  aph: { type: Number, min: 0 },
  guaranteeBuPerAcre: { type: Number, min: 0 },
  plantedDate: { type: Date },
  insuredShare: { type: Number, min: 0, max: 1, default: 1 },
  otherShare: { type: String, trim: true },
  projectedPrice: { type: Number, min: 0, default: null },
  harvestPrice: { type: Number, min: 0, default: null },

  // Claim, as adjusted by the insurance company.
  stage: { type: String, trim: true },              // H = harvested, UH = unharvested (appraised)
  adjustedGuarantee: { type: Number, default: null },
  productionToCountBu: { type: Number, default: null },
  productionToCountValue: { type: Number, default: null },
  productionPayable: { type: Number, default: null },
  revenuePayable: { type: Number, default: null },
  totalPayable: { type: Number, default: null },
  claimNumber: { type: String, trim: true },
  claimDate: { type: Date },
  checkNumber: { type: String, trim: true },

  // Landlord's share of the indemnity under the lease (0..1). Set per field.
  landlordShare: { type: Number, min: 0, max: 1, default: 0 },

  source: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'fieldInsurance',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

fieldInsuranceSchema.index({ policyNumber: 1, unitNumber: 1, cropYear: 1, crop: 1 }, { unique: true });

function round2(n) {
  return Math.round(n * 100) / 100;
}

fieldInsuranceSchema.virtual('cropCode').get(function () {
  return this.crop && this.cropYear ? this.crop.replace(/\s+/g, '-') + String(this.cropYear).slice(-2) : '';
});

fieldInsuranceSchema.virtual('guaranteeBu').get(function () {
  if (this.guaranteeBuPerAcre == null || this.insuredAcres == null) return null;
  return round2(this.guaranteeBuPerAcre * this.insuredAcres);
});

// Indemnity paid when the claim is settled, otherwise null.
fieldInsuranceSchema.virtual('indemnity').get(function () {
  return this.totalPayable == null ? null : this.totalPayable;
});

fieldInsuranceSchema.virtual('landlordIndemnity').get(function () {
  if (this.totalPayable == null) return null;
  return round2(this.totalPayable * (this.landlordShare || 0));
});

module.exports = mongoose.model('FieldInsurance', fieldInsuranceSchema);
