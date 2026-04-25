const mongoose = require('mongoose');

// M77 AG master field record. Standalone collection — does not reference or
// replace the legacy Field or CroppingField models.
//
// Phase 1: site is the master. jd_field_id stays null.
// Phase 2: John Deere sync populates jd_field_id after match review.
const m77FieldSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: true,
    trim: true
  },
  county: {
    type: String,
    trim: true
  },

  // Size
  acres: {
    type: Number,
    required: true,
    min: 0
  },

  // Owner / landlord split
  owner: {
    type: String,
    enum: ['m77', 'landlord', 'shared'],
    default: 'm77'
  },
  landlordName: {
    type: String,
    trim: true
  },
  m77SharePercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  landlordSharePercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Irrigation
  irrigation: {
    type: String,
    enum: ['none', 'dryland', 'pivot', 'flood', 'drip', 'sprinkler'],
    default: 'dryland'
  },

  // 2026 crop and rotation grouping
  crop2026: {
    type: String,
    trim: true
  },
  rotationGroup: {
    type: String,
    trim: true
  },

  // GeoJSON Polygon boundary. coordinates: [[[lng, lat], ...]]
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

  // John Deere Operations Center link. Phase 2 populates after manual match review.
  jd_field_id: {
    type: String,
    default: null,
    index: true
  },

  // Status / notes
  status: {
    type: String,
    enum: ['active', 'fallow', 'retired'],
    default: 'active'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'm77fields'
});

m77FieldSchema.index({ name: 1, county: 1 });
m77FieldSchema.index({ rotationGroup: 1 });
m77FieldSchema.index({ owner: 1 });

module.exports = mongoose.model('M77Field', m77FieldSchema);
