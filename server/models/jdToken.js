const mongoose = require('mongoose');

// Stores the M77 organization's John Deere OAuth tokens. This is a
// single-org integration: at most one active record (key='m77') exists at
// any time. The unique index on `key` makes upserts trivial.
const jdTokenSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'm77',
    unique: true,
    required: true
  },

  // OAuth tokens from JD's token endpoint
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenType: { type: String, default: 'Bearer' },
  scope: { type: String },
  expiresAt: { type: Date, required: true },

  // Provenance
  environment: { type: String, enum: ['sandbox', 'production'], default: 'production' },
  connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  connectedByEmail: { type: String },
  connectedAt: { type: Date, default: Date.now },
  lastRefreshedAt: { type: Date }
}, {
  timestamps: true,
  collection: 'jdTokens'
});

module.exports = mongoose.model('JdToken', jdTokenSchema);
