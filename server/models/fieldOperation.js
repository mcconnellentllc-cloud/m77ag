const mongoose = require('mongoose');

// One field pass or season event on an M77Field: tillage, spray, seeding,
// harvest. cropYear/crop is the crop the pass is for (the fall atrazine pass
// on wheat stubble is CORN 2027), so the cards can be filtered by crop year.
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rate: { type: Number, default: null },
  rateUnit: { type: String, trim: true },
  total: { type: Number, default: null },
  totalUnit: { type: String, trim: true }
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  ticketNo: { type: String, trim: true },
  date: { type: Date },
  elevator: { type: String, trim: true },
  account: { type: String, trim: true },
  netBu: { type: Number, default: null },
  moisture: { type: Number, default: null },
  testWeight: { type: Number, default: null },
  protein: { type: Number, default: null },
  fieldSource: { type: String, trim: true }
}, { _id: false });

const fieldOperationSchema = new mongoose.Schema({
  m77Field: { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field', required: true, index: true },
  fieldName: { type: String, trim: true },
  farmName: { type: String, trim: true },

  cropYear: { type: Number, required: true, index: true },
  crop: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, required: true, enum: ['tillage', 'spray', 'fertilizer', 'seeding', 'harvest', 'other'] },
  status: { type: String, enum: ['planned', 'completed'], default: 'completed' },
  title: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  acres: { type: Number, default: null },
  operator: { type: String, trim: true },
  equipment: { type: String, trim: true },

  // Seeding
  variety: { type: String, trim: true },
  seedLb: { type: Number, default: null },
  seedLbPerAcre: { type: Number, default: null },

  // Spray, fertilizer and seed treatment products
  products: { type: [productSchema], default: [] },
  carrierGalPerAcre: { type: Number, default: null },

  // Harvest
  netBu: { type: Number, default: null },
  combineAcres: { type: Number, default: null },
  combineBu: { type: Number, default: null },
  tickets: { type: [ticketSchema], default: [] },

  // Machine cost for this pass from the field operation rate list:
  // units (usually acres) x rate. Kept as a snapshot so a later rate list
  // does not silently change past costs.
  cost: {
    rateKey: { type: String, trim: true },
    rateLabel: { type: String, trim: true },
    rateYear: { type: Number },
    unit: { type: String, trim: true },
    units: { type: Number },
    rate: { type: Number },
    amount: { type: Number },
    setBy: { type: String, enum: ['default', 'manual'] },
    appliedAt: { type: Date }
  },

  // True for a pass added because most fields of the same crop had it and
  // this one did not show it in the records (likely done, not recorded).
  assumed: { type: Boolean, default: false },
  assumedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'FieldOperation', default: null },

  source: { type: String, trim: true },
  notes: { type: String, trim: true },
  // Set for records added from a prepared import, so re-running it updates instead of duplicating.
  sourceKey: { type: String, trim: true, default: undefined },
  // Revision of the prepared record last written to this card. A higher
  // rev in the data file means the card holds older data.
  sourceRev: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'fieldOperations',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

fieldOperationSchema.index({ sourceKey: 1 }, { unique: true, partialFilterExpression: { sourceKey: { $type: 'string' } } });

fieldOperationSchema.virtual('cropCode').get(function () {
  return this.crop && this.cropYear ? this.crop.replace(/\s+/g, '-') + String(this.cropYear).slice(-2) : '';
});

module.exports = mongoose.model('FieldOperation', fieldOperationSchema);
