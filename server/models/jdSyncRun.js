const mongoose = require('mongoose');

// Audit log: one record per sync invocation. The `decisions` array records
// what the matcher did for every M77 field considered, so a run can be
// audited months later without re-running the matcher.
const decisionSchema = new mongoose.Schema({
  m77FieldId:  { type: mongoose.Schema.Types.ObjectId, ref: 'M77Field' },
  m77Name:     String,
  jd_field_id: String,
  jdName:      String,
  // 'linked'    - jd_field_id was written onto an existing M77 field
  // 'review'    - candidate sent to JdSyncReview queue
  // 'created'   - new M77 field was auto-created from this JD field (no match)
  // 'skipped-already-linked' - M77 field already had jd_field_id, ignored
  // 'skipped-no-candidate'   - M77 field had no JD candidate above threshold
  // 'error'     - exception while processing this row
  action: {
    type: String,
    enum: ['linked', 'review', 'created', 'skipped-already-linked', 'skipped-no-candidate', 'error'],
    required: true
  },
  reason:  String,
  score:   Number,
  overlap: Number,
  nameMatch:  Boolean,
  acresMatch: Boolean,
  errorMessage: String
}, { _id: false });

const jdSyncRunSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true, index: true },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  triggeredByEmail: String,
  environment: { type: String, enum: ['production', 'sandbox'] },

  startedAt:   { type: Date, required: true, default: Date.now },
  completedAt: { type: Date },

  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running',
    index: true
  },
  errorMessage: String,

  summary: {
    organizationsFetched: { type: Number, default: 0 },
    jdFieldsFetched:      { type: Number, default: 0 },
    autoMatched:          { type: Number, default: 0 },
    reviewQueued:         { type: Number, default: 0 },
    autoCreated:          { type: Number, default: 0 },
    skippedAlreadyLinked: { type: Number, default: 0 },
    skippedNoCandidate:   { type: Number, default: 0 },
    errors:               { type: Number, default: 0 }
  },

  decisions: { type: [decisionSchema], default: [] }
}, {
  timestamps: true,
  collection: 'jdSyncRuns'
});

jdSyncRunSchema.index({ startedAt: -1 });

module.exports = mongoose.model('JdSyncRun', jdSyncRunSchema);
