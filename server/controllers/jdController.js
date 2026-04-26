const jwt = require('jsonwebtoken');
const jdService = require('../services/johnDeereService');
const JdSyncReview = require('../models/jdSyncReview');
const JdSyncRun = require('../models/jdSyncRun');
const JdField = require('../models/jdField');
const M77Field = require('../models/m77Field');

function sendAuthError(res, err) {
  // Distinct status code so the UI can flip the status pill and prompt
  // a reconnect rather than show a generic "request failed".
  return res.status(409).json({
    success: false,
    code: 'JD_AUTH_REQUIRED',
    authCode: err.code,
    message: err.message
  });
}

function isAuthError(err) {
  return err && err.name === 'JdAuthError';
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const STATE_TTL = '10m'; // OAuth state token lifetime

function signState(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: STATE_TTL });
}

function verifyState(stateToken) {
  return jwt.verify(stateToken, JWT_SECRET);
}

// GET /api/jd/auth/start (admin-only)
// Returns the JD authorization URL for the browser to redirect to.
exports.startAuth = (req, res) => {
  try {
    const state = signState({
      userId: String(req.userId || ''),
      email: req.user?.email || '',
      // Random nonce to prevent state token reuse across flows.
      nonce: Math.random().toString(36).slice(2) + Date.now().toString(36),
      kind: 'jd-oauth-state'
    });
    const url = jdService.buildAuthorizationUrl(state);
    res.json({ success: true, url });
  } catch (err) {
    console.error('JD startAuth error:', err);
    if (isAuthError(err)) return sendAuthError(res, err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /admin/jd-callback (no auth — JD redirects the browser here)
// Verifies state, exchanges code for tokens, persists, redirects back to /admin/fields.
exports.handleCallback = async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const reason = encodeURIComponent(error_description || error);
    return res.redirect(`/admin/fields?jd=error&reason=${reason}`);
  }
  if (!code || !state) {
    return res.redirect('/admin/fields?jd=error&reason=missing_code_or_state');
  }

  let decoded;
  try {
    decoded = verifyState(state);
    if (decoded.kind !== 'jd-oauth-state') throw new Error('Invalid state kind');
  } catch (err) {
    console.error('JD callback state verification failed:', err.message);
    return res.redirect('/admin/fields?jd=error&reason=invalid_state');
  }

  try {
    const tokenResponse = await jdService.exchangeCodeForTokens(code);
    await jdService.persistTokens(tokenResponse, {
      connectedBy: decoded.userId || null,
      connectedByEmail: decoded.email || null,
      isInitial: true
    });
    return res.redirect('/admin/fields?jd=connected');
  } catch (err) {
    console.error('JD callback token exchange failed:', err);
    const reason = encodeURIComponent(err.message || 'token_exchange_failed');
    return res.redirect(`/admin/fields?jd=error&reason=${reason}`);
  }
};

// GET /api/jd/status (admin)
exports.getStatus = async (req, res) => {
  try {
    const token = await jdService.getStoredToken();
    const [pendingReviews, lastRun] = await Promise.all([
      JdSyncReview.countDocuments({ status: 'pending' }),
      JdSyncRun.findOne({}).sort({ startedAt: -1 }).lean()
    ]);

    if (!token) {
      return res.json({
        success: true,
        connected: false,
        environment: jdService.getEnvironment(),
        pendingReviews,
        lastRun: lastRun ? { runId: lastRun.runId, status: lastRun.status, startedAt: lastRun.startedAt, completedAt: lastRun.completedAt } : null
      });
    }
    const expiresAtMs = token.expiresAt ? token.expiresAt.getTime() : 0;
    const expiresInSeconds = Math.max(0, Math.round((expiresAtMs - Date.now()) / 1000));
    res.json({
      success: true,
      connected: true,
      environment: token.environment || jdService.getEnvironment(),
      connectedAt: token.connectedAt,
      connectedByEmail: token.connectedByEmail || null,
      expiresAt: token.expiresAt,
      expiresInSeconds,
      lastRefreshedAt: token.lastRefreshedAt || null,
      scope: token.scope || null,
      pendingReviews,
      lastRun: lastRun ? {
        runId: lastRun.runId,
        status: lastRun.status,
        startedAt: lastRun.startedAt,
        completedAt: lastRun.completedAt,
        summary: lastRun.summary
      } : null
    });
  } catch (err) {
    console.error('JD status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/jd/sync (admin) — runs a synchronous sync. For ~100 fields this
// completes well within Render's request timeout. The run is logged to
// jdSyncRuns regardless of outcome.
exports.sync = async (req, res) => {
  try {
    const runId = await jdService.syncAllFields({
      triggeredBy: req.userId,
      triggeredByEmail: req.user?.email || null
    });
    const run = await JdSyncRun.findOne({ runId }).lean();
    res.json({ success: true, runId, run });
  } catch (err) {
    console.error('JD sync error:', err);
    if (isAuthError(err)) return sendAuthError(res, err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/jd/sync/runs (admin)
exports.listRuns = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const runs = await JdSyncRun
      .find({}, { decisions: 0 })  // exclude per-field decisions for the list view
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, runs });
  } catch (err) {
    console.error('JD listRuns error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/jd/sync/runs/:runId (admin)
exports.getRun = async (req, res) => {
  try {
    const run = await JdSyncRun.findOne({ runId: req.params.runId }).lean();
    if (!run) return res.status(404).json({ success: false, message: 'Run not found' });
    res.json({ success: true, run });
  } catch (err) {
    console.error('JD getRun error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/jd/reviews (admin) — pending review items, joined with fresh M77/JD data.
exports.listReviews = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const reviews = await JdSyncReview
      .find({ status })
      .sort({ score: -1, createdAt: -1 })
      .lean();

    // Hydrate with current M77 + JD field details for the side-by-side UI.
    const m77Ids = reviews.map(r => r.m77FieldId).filter(Boolean);
    const jdIds  = reviews.map(r => r.jd_field_id).filter(Boolean);
    const [m77s, jds] = await Promise.all([
      M77Field.find({ _id: { $in: m77Ids } }).lean(),
      JdField.find({ jd_field_id: { $in: jdIds } }).lean()
    ]);
    const m77Map = new Map(m77s.map(f => [String(f._id), f]));
    const jdMap  = new Map(jds.map(f => [f.jd_field_id, f]));

    const hydrated = reviews.map(r => ({
      ...r,
      m77: m77Map.get(String(r.m77FieldId)) || null,
      jd:  jdMap.get(r.jd_field_id) || null
    }));

    res.json({ success: true, count: hydrated.length, reviews: hydrated });
  } catch (err) {
    console.error('JD listReviews error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/jd/reviews/:id/decide (admin) — body: { decision: 'accept' | 'reject' }
exports.decideReview = async (req, res) => {
  const { decision } = req.body || {};
  if (decision !== 'accept' && decision !== 'reject') {
    return res.status(400).json({ success: false, message: "decision must be 'accept' or 'reject'" });
  }
  try {
    const review = await JdSyncReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Review already ${review.status}` });
    }

    if (decision === 'accept') {
      // Confirm M77 field still exists and isn't already linked to a different JD field.
      const m77 = await M77Field.findById(review.m77FieldId);
      if (!m77) return res.status(404).json({ success: false, message: 'M77 field no longer exists' });
      if (m77.jd_field_id && m77.jd_field_id !== review.jd_field_id) {
        return res.status(409).json({
          success: false,
          message: `M77 field is already linked to a different JD field (${m77.jd_field_id})`
        });
      }
      m77.jd_field_id = review.jd_field_id;
      m77.jdLastSyncedAt = new Date();
      m77.jdSyncMatchScore = review.score;
      await m77.save();
    }

    review.status = decision === 'accept' ? 'accepted' : 'rejected';
    review.decidedBy = req.userId || null;
    review.decidedAt = new Date();
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    console.error('JD decideReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/jd/disconnect (admin)
exports.disconnect = async (req, res) => {
  try {
    await jdService.disconnect();
    res.json({ success: true, message: 'Disconnected from John Deere.' });
  } catch (err) {
    console.error('JD disconnect error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
