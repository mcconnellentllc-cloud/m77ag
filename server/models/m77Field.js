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

  // Enterprise grouping (top-level, above rotationGroup). Separates books for
  // P&L / reporting purposes — e.g. "M77 AG" vs "Lueking". M77 may farm both
  // but they are tracked as distinct enterprises.
  enterprise: {
    type: String,
    required: true,
    default: 'M77 AG',
    trim: true,
    index: true
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

  // Provenance + last-sync metadata for records touched by JD sync.
  // createdFromJdSync = true means this M77Field was auto-created during a
  // sync because no existing M77 field matched the JD field. Bulk-tag these
  // for enterprise (e.g. Lueking) using the admin filter.
  createdFromJdSync: {
    type: Boolean,
    default: false,
    index: true
  },
  jdLastSyncedAt: { type: Date, default: null },
  jdSyncMatchScore: { type: Number, default: null },

  // Hierarchy: Client → M77Farm → M77Field. Both required after the
  // hierarchy migration runs. Existing 73 records are linked by
  // server/scripts/seed-and-migrate-hierarchy.js.
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'M77Farm',
    required: true,
    index: true
  },

  // Optional per-field landlord-share override. When null, the financial
  // split engine falls back to the parent Farm's defaultShare. Range 0..1.
  shareOverride: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },

  // Origin tracking for one-time migration from legacy Field / CroppingField
  // collections. Lets the migration script run idempotently — re-runs upsert
  // on (legacySource, legacyId) instead of duplicating rows.
  legacySource: {
    type: String,
    enum: ['Field', 'CroppingField'],
    default: null
  },
  legacyId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  // ---- FSA notation (Phase D-2) -------------------------------------------
  // Per-field overlay tracking the field's record at USDA Farm Service Agency.
  // Distinct from Farm-level landlord: a Farm (e.g. MEFARMS) is M77-owned at
  // the operating level, but individual fields inside it can have FSA-recorded
  // lease holders (e.g. Lisa Atkins on the Kirby fields). The Farm-level
  // landlord is unchanged by these fields.

  // Current snapshot — overwritten when a newer FSA filing arrives. Prior
  // values are preserved in fsaHistory.
  fsaFarmSerial:       { type: String, trim: true, default: null },
  fsaTract:            { type: String, trim: true, default: null },
  fsaLeaseHolderName:  { type: String, trim: true, default: null },
  fsaLeasedAcres:      { type: Number, default: null },
  fsaLeaseType:        { type: String, enum: ['Cash', 'Crop Share', null], default: null },
  fsaCounty:           { type: String, trim: true, default: null },
  fsaProgramYear:      { type: Number, default: null },

  // Append-only audit trail of every FSA snapshot applied to this field.
  fsaHistory: [{
    programYear: Number,
    fsn:         String,
    tract:       String,
    owner:       String,
    acres:       Number,
    leaseType:   String,
    source:      { type: String, default: 'CCC-902' },
    appliedAt:   { type: Date, default: Date.now }
  }],

  // Workbook origin values — preserved verbatim so we can always trace
  // back to the pre-migration FSA notation in the spreadsheet.
  legacyFsaFarm:  { type: String, trim: true, default: null },
  legacyFsaTract: { type: String, trim: true, default: null },

  // Section/Township/Range, e.g. "NW 13-9-47". Used to identify fields when
  // FSA Farm/Tract numbers aren't known yet.
  legalDescription: { type: String, trim: true, default: null },

  // F (Full), S (Split), P (Partial), BS (Boundary Split), W (Whole),
  // CBS (Combined Boundary Split), COM (Combined). Aligns with the FSA
  // notation document's split codes.
  splitType: {
    type: String,
    enum: ['F', 'S', 'P', 'BS', 'W', 'CBS', 'COM', null],
    default: null
  },

  // For split fields: pointer to the parent field this was split from.
  parentFieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'M77Field',
    default: null
  },

  // True when this field has no FSA Farm/Tract assignment yet and needs
  // one (typical: before a CCC-902 has been ingested for the relevant
  // county). The Admin UI filters on this.
  needsFsaAssignment: {
    type: Boolean,
    default: false,
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
m77FieldSchema.index({ client: 1, farm: 1 });
m77FieldSchema.index({ fsaFarmSerial: 1, fsaTract: 1 });
m77FieldSchema.index({ fsaLeaseHolderName: 1 });
m77FieldSchema.index(
  { legacySource: 1, legacyId: 1 },
  { unique: true, partialFilterExpression: { legacyId: { $type: 'objectId' } } }
);

module.exports = mongoose.model('M77Field', m77FieldSchema);
