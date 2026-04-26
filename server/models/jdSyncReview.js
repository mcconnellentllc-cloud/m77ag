const mongoose = require('mongoose');

// One record per (M77 field, JD field) candidate pair that the matcher
// flagged as ambiguous (40-80% overlap, or name-match without usable GPS).
// Admins resolve each pair via the review UI.
const jdSyncReviewSchema = new mongoose.Schema({
  m77FieldId:  { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field', required: true, index: true },
  jd_field_id: { type: String, required: true, index: true },

  // Snapshot of matcher output at the time of sync — for display + audit.
  overlap:     { type: Number, default: null },
  nameMatch:   { type: Boolean, default: false },
  acresMatch:  { type: Boolean, default: false },
  acresRatio:  { type: Number, default: null },
  score:       { type: Number, default: 0 },

  // Snapshot of names/acres so the review UI doesn't need extra joins.
  m77Name:  String,
  m77Acres: Number,
  jdName:   String,
  jdAcres:  Number,

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true
  },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decidedAt: { type: Date },
  syncedAt:  { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'jdSyncReviews'
});

// One pending review per (m77 field, jd field) pair.
jdSyncReviewSchema.index(
  { m77FieldId: 1, jd_field_id: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('JdSyncReview', jdSyncReviewSchema);
