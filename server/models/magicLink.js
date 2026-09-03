const mongoose = require('mongoose');
const crypto = require('crypto');

// Passwordless sign-in link for the customer card. The raw token only ever
// exists in the email; the database stores its SHA-256 hash, so a leaked
// database dump cannot be used to sign in as a customer.
const magicLinkSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  // A link stays usable until it expires so a customer can open it on their
  // phone and again on a computer. Each use is counted for auditing.
  useCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: Date,
  revokedAt: Date,
  // Who or what generated the link, for support questions
  issuedBy: {
    type: String,
    default: 'customer request'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Let MongoDB drop expired links on its own
magicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

magicLinkSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Issue a link for an email address and return the raw token to email out.
// Any earlier link for that address is revoked so only the newest one works.
magicLinkSchema.statics.issue = async function (email, { days = 14, issuedBy } = {}) {
  const normalizedEmail = email.toLowerCase().trim();
  const token = crypto.randomBytes(32).toString('hex');

  await this.updateMany(
    { email: normalizedEmail, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  await this.create({
    tokenHash: this.hashToken(token),
    email: normalizedEmail,
    expiresAt,
    issuedBy: issuedBy || 'customer request'
  });

  return { token, expiresAt };
};

// Resolve a raw token to its email address, or null when it is unusable
magicLinkSchema.statics.redeem = async function (token) {
  if (!token) return null;

  const link = await this.findOne({
    tokenHash: this.hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!link) return null;

  link.useCount += 1;
  link.lastUsedAt = new Date();
  await link.save();

  return link.email;
};

module.exports = mongoose.model('MagicLink', magicLinkSchema);
