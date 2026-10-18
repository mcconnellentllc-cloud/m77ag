const mongoose = require('mongoose');

// One CLU line of an FSA-578 Report of Commodities (acreage report), with the
// field cards it is on. Source data: server/data/fsa578_<year>.js.
const fsaCropReportSchema = new mongoose.Schema({
  programYear: { type: Number, required: true, index: true },
  farm: { type: String, required: true, trim: true },   // FSA farm number as reported that year
  tract: { type: String, required: true, trim: true },
  clu: { type: String, required: true, trim: true },
  crop: { type: String, required: true, trim: true },   // FSA crop code: CORN, SORGH, WHEAT, FALOW, TRICL, MILET, GRASS, MIXFG
  varType: { type: String, trim: true },
  intendedUse: { type: String, trim: true },            // GR grain, GZ grazing, FG forage; 1-GZ / 2-GR on a grazed-out crop
  irrigation: { type: String, trim: true },             // N non-irrigated
  acres: Number,
  cropland: Boolean,
  plantingDate: Date,
  endYear: String,                                      // perennial forage end date (year)
  shares: [{ _id: false, percent: Number, name: String }],
  location: { type: String, trim: true },               // FSA physical location (county, state)
  napUnit: { type: String, trim: true },
  legal: { type: String, trim: true },                  // tract legal description
  tractCropland: Number,
  tractFarmland: Number,
  cards: [{ _id: false, fieldName: String, m77Field: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field' }, acres: Number }],
  openOn: [{ _id: false, fieldName: String, m77Field: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field' } }],
  note: { type: String, trim: true },
  source: { type: String, trim: true }
}, { timestamps: true, collection: 'fsaCropReports' });

fsaCropReportSchema.index({ programYear: 1, farm: 1, tract: 1, clu: 1, crop: 1, intendedUse: 1 }, { unique: true });
fsaCropReportSchema.index({ 'cards.m77Field': 1 });
fsaCropReportSchema.index({ 'openOn.m77Field': 1 });

module.exports = mongoose.model('FsaCropReport', fsaCropReportSchema);
