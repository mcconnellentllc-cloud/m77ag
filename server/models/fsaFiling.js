const mongoose = require('mongoose');

// One document per (entity, programYear, fsn, tract) combination — i.e.
// per CCC-902 line item per filing year. Source-of-truth for FSA-recorded
// land tenure. M77Field rows reference this collection's snapshot via
// fsaFarmSerial + fsaTract + fsaProgramYear, with prior years archived in
// M77Field.fsaHistory.
const fsaFilingSchema = new mongoose.Schema({
  // The legal entity that filed the CCC-902 (e.g. "M77 Ag Inc.",
  // "Kyle McConnell", "M-E Farms"). Plain string — we don't link to a
  // separate Entity collection at this stage.
  entity: { type: String, required: true, trim: true },
  ein:    { type: String, trim: true },

  programYear: { type: Number, required: true, index: true },

  // FSA Farm Serial Number, Tract — both stored as strings so leading
  // zeros and county-specific prefixes are preserved verbatim.
  fsn:   { type: String, required: true, trim: true },
  tract: { type: String, required: true, trim: true },

  // Geography
  county: { type: String, trim: true },
  state:  { type: String, trim: true, default: 'CO' },

  // The party FSA records as the operator/lease holder for this tract.
  // For owned tracts this typically equals `entity`; for leased tracts
  // this is the operator (M77) or the landlord depending on filing context.
  leaseHolder: { type: String, trim: true },

  acres:     { type: Number, default: 0 },

  // Filing-level type label as it appears on CCC-902.
  type:      { type: String, trim: true },             // e.g. "OO", "OT", "TO"
  leaseType: { type: String, enum: ['Cash', 'Crop Share', null], default: null },

  source:     { type: String, default: 'CCC-902' },
  filingDate: { type: Date }
}, {
  timestamps: true,
  collection: 'fsaFilings'
});

// One filing per (entity, year, fsn, tract).
fsaFilingSchema.index(
  { entity: 1, programYear: 1, fsn: 1, tract: 1 },
  { unique: true }
);
fsaFilingSchema.index({ leaseHolder: 1 });
fsaFilingSchema.index({ county: 1, programYear: 1 });

module.exports = mongoose.model('FsaFiling', fsaFilingSchema);
