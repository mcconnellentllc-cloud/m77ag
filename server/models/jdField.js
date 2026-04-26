const mongoose = require('mongoose');

// Cache of fields fetched from John Deere Operations Center. Refreshed by
// every sync run. Stores enough metadata to display in the review UI and to
// re-run the matcher without re-hitting JD's API.
const jdFieldSchema = new mongoose.Schema({
  jd_field_id: { type: String, required: true, unique: true, index: true },
  jd_org_id:   { type: String, index: true },
  jd_org_name: { type: String },
  jd_farm_id:  { type: String },
  jd_farm_name: { type: String },

  name:  { type: String, required: true, trim: true },
  acres: { type: Number, default: 0 },

  // GeoJSON Polygon — same shape as M77Field.boundary
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      default: undefined
    }
  },

  syncedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'jdFields'
});

jdFieldSchema.index({ name: 1 });

module.exports = mongoose.model('JdField', jdFieldSchema);
