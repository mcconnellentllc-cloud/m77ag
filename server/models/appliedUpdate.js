const mongoose = require('mongoose');

// One row per data correction applied at startup, so each runs only once and
// later edits on the site are left alone.
const appliedUpdateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  appliedAt: { type: Date, default: Date.now },
  summary: { type: [String], default: [] }
}, { collection: 'appliedUpdates' });

module.exports = mongoose.model('AppliedUpdate', appliedUpdateSchema);
