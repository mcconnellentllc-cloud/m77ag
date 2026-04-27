const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const jdService = require('../services/johnDeereService');
const JdSyncReview = require('../models/jdSyncReview');
const JdSyncRun = require('../models/jdSyncRun');
const JdField = require('../models/jdField');
const M77Field = require('../models/m77Field');
const Client = require('../models/client');
const M77Farm = require('../models/m77Farm');
const matcher = require('../utils/fieldMatcher');

const IMPORT_QUARANTINE_CLIENT_NAME = 'M77 AG - Import';

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

// ---- JD Import Quarantine: list / merge / promote / suggest ----------------

async function getImportClient() {
  const c = await Client.findOne({ name: IMPORT_QUARANTINE_CLIENT_NAME });
  if (!c) {
    const err = new Error(
      `Quarantine Client "${IMPORT_QUARANTINE_CLIENT_NAME}" not found. ` +
      `Run \`npm run migrate:hierarchy\` on the server.`
    );
    err.statusCode = 500;
    throw err;
  }
  return c;
}

// GET /api/jd/imports — list all M77Field records under the import quarantine
// (i.e. the things that need merging or promoting). Hydrated with farm
// (per-org) and JD-side metadata for the merge UI.
exports.listImports = async (req, res) => {
  try {
    const importClient = await getImportClient();
    const fields = await M77Field
      .find({ client: importClient._id })
      .populate('farm', 'name landlordName')
      .sort({ 'farm.name': 1, name: 1 })
      .lean();

    // Hydrate with the JD-side cache so the UI can show acres/boundary as JD
    // reports them, not just the (initially identical) M77 mirror.
    const jdIds = fields.map(f => f.jd_field_id).filter(Boolean);
    const jdRecords = await JdField.find({ jd_field_id: { $in: jdIds } }).lean();
    const jdById = new Map(jdRecords.map(j => [j.jd_field_id, j]));

    const enriched = fields.map(f => ({ ...f, jd: jdById.get(f.jd_field_id) || null }));
    res.json({
      success: true,
      count: enriched.length,
      importClientId: importClient._id,
      fields: enriched
    });
  } catch (err) {
    console.error('JD listImports error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// POST /api/jd/merge   body: { sourceFieldId, targetFieldId }
// Copies boundary + jd_field_id from the import field onto an existing real
// field, then deletes the import. The target keeps its name, acres, and
// every other curated value — only the JD link is added.
exports.merge = async (req, res) => {
  const { sourceFieldId, targetFieldId } = req.body || {};
  if (!sourceFieldId || !targetFieldId) {
    return res.status(400).json({ success: false, message: 'sourceFieldId and targetFieldId are required' });
  }
  if (String(sourceFieldId) === String(targetFieldId)) {
    return res.status(400).json({ success: false, message: 'source and target must be different fields' });
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const importClient = await getImportClient();

      const source = await M77Field.findById(sourceFieldId).session(session);
      const target = await M77Field.findById(targetFieldId).session(session);
      if (!source) throw Object.assign(new Error('Source field not found'), { statusCode: 404 });
      if (!target) throw Object.assign(new Error('Target field not found'), { statusCode: 404 });

      if (String(source.client) !== String(importClient._id)) {
        throw Object.assign(new Error('Source must be in the import quarantine'), { statusCode: 400 });
      }
      if (String(target.client) === String(importClient._id)) {
        throw Object.assign(new Error('Target must be a real (non-quarantine) field'), { statusCode: 400 });
      }
      if (target.jd_field_id && target.jd_field_id !== source.jd_field_id) {
        throw Object.assign(
          new Error(`Target is already linked to a different JD field (${target.jd_field_id})`),
          { statusCode: 409 }
        );
      }

      // Copy JD link + boundary onto the target. Acres / name / county /
      // owner / etc. on the target are preserved verbatim.
      target.jd_field_id     = source.jd_field_id;
      target.jdLastSyncedAt  = source.jdLastSyncedAt || new Date();
      target.jdSyncMatchScore = null;  // human-confirmed merge — no machine score
      if (source.boundary && source.boundary.coordinates && source.boundary.coordinates.length) {
        target.boundary = source.boundary;
      }
      await target.save({ session });

      await M77Field.deleteOne({ _id: source._id }).session(session);

      result = {
        merged: true,
        target: {
          _id: target._id, name: target.name,
          jd_field_id: target.jd_field_id
        },
        deletedSourceId: source._id
      };
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('JD merge error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  } finally {
    await session.endSession();
  }
};

// POST /api/jd/promote   body: { sourceFieldIds: [...], targetClientId, targetFarmId }
// Moves one or more import fields out of the quarantine to a target
// Client/Farm. The fields keep their data (name, acres, boundary, jd_field_id)
// — only `client` and `farm` change. createdFromJdSync stays true so they
// remain filterable as JD-imported in /admin/fields.
exports.promote = async (req, res) => {
  const { sourceFieldIds, targetClientId, targetFarmId } = req.body || {};
  if (!Array.isArray(sourceFieldIds) || sourceFieldIds.length === 0) {
    return res.status(400).json({ success: false, message: 'sourceFieldIds must be a non-empty array' });
  }
  if (!targetClientId || !targetFarmId) {
    return res.status(400).json({ success: false, message: 'targetClientId and targetFarmId are required' });
  }

  try {
    const importClient = await getImportClient();
    if (String(targetClientId) === String(importClient._id)) {
      return res.status(400).json({ success: false, message: 'Cannot promote into the import quarantine' });
    }

    // Verify target client + farm exist and farm belongs to client.
    const [client, farm] = await Promise.all([
      Client.findById(targetClientId).select('_id name'),
      M77Farm.findById(targetFarmId).select('client name')
    ]);
    if (!client) return res.status(404).json({ success: false, message: 'Target client not found' });
    if (!farm)   return res.status(404).json({ success: false, message: 'Target farm not found' });
    if (String(farm.client) !== String(targetClientId)) {
      return res.status(400).json({ success: false, message: `Target farm does not belong to target client` });
    }

    // Verify every source is currently in the quarantine.
    const sources = await M77Field.find({ _id: { $in: sourceFieldIds } }).select('_id client');
    if (sources.length !== sourceFieldIds.length) {
      return res.status(404).json({ success: false, message: 'One or more source fields not found' });
    }
    const stray = sources.find(f => String(f.client) !== String(importClient._id));
    if (stray) {
      return res.status(400).json({
        success: false,
        message: `Field ${stray._id} is not in the import quarantine — refusing to move it`
      });
    }

    const result = await M77Field.updateMany(
      { _id: { $in: sourceFieldIds } },
      { $set: { client: targetClientId, farm: targetFarmId } }
    );
    res.json({
      success: true,
      promoted: result.modifiedCount,
      target: { client: client.name, farm: farm.name }
    });
  } catch (err) {
    console.error('JD promote error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// GET /api/jd/suggest/:sourceFieldId — top match suggestions for an import,
// scored against every real (non-quarantine) M77 field. Score is from the
// existing matcher (turf overlap + name + acres + client alignment), but
// the result is informational only — no auto-write.
exports.suggestMatches = async (req, res) => {
  try {
    const importClient = await getImportClient();
    const source = await M77Field.findById(req.params.sourceFieldId)
      .populate('client', 'name')
      .lean();
    if (!source) return res.status(404).json({ success: false, message: 'Source field not found' });
    if (String(source.client?._id || source.client) !== String(importClient._id)) {
      return res.status(400).json({ success: false, message: 'Source is not in the import quarantine' });
    }

    const candidates = await M77Field
      .find({ client: { $ne: importClient._id }, jd_field_id: null })
      .populate('client', 'name')
      .populate('farm', 'name')
      .lean();

    // Cast to the shape the matcher expects (it treats the JD side as the
    // counterparty; here the import field plays the JD role).
    const sourceAsJd = {
      jd_field_id: source.jd_field_id,
      jd_org_name: source.client?.name,
      name: source.name,
      acres: source.acres,
      boundary: source.boundary
    };

    const scored = candidates
      .map(c => ({
        candidate: {
          _id: c._id,
          name: c.name,
          acres: c.acres,
          county: c.county,
          client: c.client?.name,
          farm: c.farm?.name
        },
        ...matcher.scoreCandidate(c, sourceAsJd)
      }))
      .filter(s => s.decision !== 'none')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({ success: true, source: { _id: source._id, name: source.name }, suggestions: scored });
  } catch (err) {
    console.error('JD suggestMatches error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
