/**
 * John Deere Operations Center integration service.
 *
 * Phase 2 PR A scope: OAuth 2.0 authorization code flow + token storage and
 * refresh. Field-data API calls live in PR B.
 *
 * Required environment variables:
 *   JD_CLIENT_ID       — OAuth client ID from developer.deere.com
 *   JD_CLIENT_SECRET   — OAuth client secret (treated as password)
 *   JD_REDIRECT_URI    — must match exactly what's registered at developer.deere.com
 *   JD_ENVIRONMENT     — 'production' | 'sandbox' (only affects the API base for PR B)
 */

const JdToken = require('../models/jdToken');
const { retryWithBackoff } = require('../utils/retryWithBackoff');

// Typed error so callers can surface auth issues distinctly in the UI.
class JdAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'JdAuthError';
    // 'NOT_CONNECTED' | 'REFRESH_FAILED' | 'REVOKED'
    this.code = code;
  }
}

// JD OAuth endpoints (Okta-backed). These are shared between production and
// sandbox — environment is selected at the app level via client_id.
const JD_AUTHORIZE_URL = 'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize';
const JD_TOKEN_URL    = 'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token';

// API bases by environment. Used by PR B; included here for completeness.
const JD_API_BASE = {
  production: 'https://partnerapi.deere.com/platform/',
  sandbox:    'https://sandboxapi.deere.com/platform/'
};

// Scopes requested at authorization time. `offline_access` is required to
// receive a refresh_token. ag1/ag2/ag3 cover field/agronomy data.
const JD_SCOPES = [
  'ag1', 'ag2', 'ag3',
  'eq1', 'eq2',
  'org1', 'org2',
  'files',
  'offline_access'
].join(' ');

const TOKEN_KEY = 'm77';
// Refresh access tokens this many seconds before expiry to avoid edge-of-cliff failures.
const REFRESH_SAFETY_WINDOW_SECONDS = 60;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function getEnvironment() {
  const env = (process.env.JD_ENVIRONMENT || 'production').toLowerCase();
  if (env !== 'production' && env !== 'sandbox') {
    throw new Error(`JD_ENVIRONMENT must be 'production' or 'sandbox' (got '${env}')`);
  }
  return env;
}

function getApiBase() {
  return JD_API_BASE[getEnvironment()];
}

function buildAuthorizationUrl(state) {
  const clientId = requireEnv('JD_CLIENT_ID');
  const redirectUri = requireEnv('JD_REDIRECT_URI');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: JD_SCOPES,
    state
  });

  return `${JD_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const clientId = requireEnv('JD_CLIENT_ID');
  const clientSecret = requireEnv('JD_CLIENT_SECRET');
  const redirectUri = requireEnv('JD_REDIRECT_URI');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(JD_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = data.error_description || data.error || `HTTP ${res.status}`;
    throw new Error(`JD token exchange failed: ${reason}`);
  }
  return data;
}

async function refreshAccessTokenUsing(refreshToken) {
  const clientId = requireEnv('JD_CLIENT_ID');
  const clientSecret = requireEnv('JD_CLIENT_SECRET');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(JD_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = data.error_description || data.error || `HTTP ${res.status}`;
    throw new Error(`JD token refresh failed: ${reason}`);
  }
  return data;
}

function expiresAtFromExpiresIn(expiresInSeconds) {
  const seconds = Number(expiresInSeconds) || 0;
  return new Date(Date.now() + seconds * 1000);
}

async function persistTokens(tokenResponse, { connectedBy, connectedByEmail, isInitial }) {
  const update = {
    accessToken: tokenResponse.access_token,
    tokenType: tokenResponse.token_type || 'Bearer',
    scope: tokenResponse.scope,
    expiresAt: expiresAtFromExpiresIn(tokenResponse.expires_in),
    environment: getEnvironment(),
    lastRefreshedAt: new Date()
  };
  // JD rotates refresh tokens on some refresh responses; only overwrite when present.
  if (tokenResponse.refresh_token) {
    update.refreshToken = tokenResponse.refresh_token;
  }
  if (isInitial) {
    update.connectedBy = connectedBy || null;
    update.connectedByEmail = connectedByEmail || null;
    update.connectedAt = new Date();
  }

  return JdToken.findOneAndUpdate(
    { key: TOKEN_KEY },
    { $set: update, $setOnInsert: { key: TOKEN_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getStoredToken() {
  return JdToken.findOne({ key: TOKEN_KEY });
}

async function disconnect() {
  await JdToken.deleteOne({ key: TOKEN_KEY });
}

// Returns a valid access token, refreshing it transparently if expired or near expiry.
// Throws JdAuthError on auth-specific failures so the UI can react distinctly.
async function getValidAccessToken() {
  const stored = await getStoredToken();
  if (!stored) {
    throw new JdAuthError('Not connected to John Deere.', 'NOT_CONNECTED');
  }

  const safetyMs = REFRESH_SAFETY_WINDOW_SECONDS * 1000;
  const stillValid = stored.expiresAt && (stored.expiresAt.getTime() - Date.now() > safetyMs);
  if (stillValid) return stored.accessToken;

  try {
    const refreshed = await refreshAccessTokenUsing(stored.refreshToken);
    const updated = await persistTokens(refreshed, { isInitial: false });
    return updated.accessToken;
  } catch (err) {
    // JD returns invalid_grant when the refresh token has been revoked,
    // expired hard, or the user disconnected the app on JD's side.
    if (/invalid_grant/i.test(err.message)) {
      await JdToken.deleteOne({ key: TOKEN_KEY });
      throw new JdAuthError(
        'JD refresh token is no longer valid. Reconnect to John Deere.',
        'REVOKED'
      );
    }
    throw new JdAuthError('JD token refresh failed: ' + err.message, 'REFRESH_FAILED');
  }
}

// ---------------------------------------------------------------------------
// John Deere Operations Center API (read-only — Phase 2)
// ---------------------------------------------------------------------------

const crypto = require('crypto');
const mongoose = require('mongoose');
const M77Field = require('../models/m77Field');
const JdField = require('../models/jdField');
const JdSyncReview = require('../models/jdSyncReview');
const JdSyncRun = require('../models/jdSyncRun');
const Client = require('../models/client');
const M77Farm = require('../models/m77Farm');
const matcher = require('../utils/fieldMatcher');

// JD organization-name → M77 Client routing for auto-create. The keys are
// case-insensitive substring matches on the JD organization name.
// Anything that doesn't match any rule defaults to (M77 AG, Unassigned (JD imported)).
const JD_ORG_CLIENT_RULES = [
  { match: /allphin/i, client: 'Allphin Farms', farm: 'Lueking',                  enterprise: 'Lueking' }
];
const DEFAULT_JD_CLIENT_NAME = 'M77 AG';
const DEFAULT_JD_FARM_NAME   = 'Unassigned (JD imported)';

// Resolve (clientId, farmId, enterprise) for a JD-originated field. The
// target Farm is created on demand under the Client if it doesn't exist
// yet — keeps sync robust against new orgs appearing in JD between runs.
async function resolveClientFarmForJdField(jdField, session) {
  const orgName = jdField.jd_org_name || '';
  let clientName = DEFAULT_JD_CLIENT_NAME;
  let farmName   = DEFAULT_JD_FARM_NAME;
  let enterprise = 'M77 AG';

  for (const rule of JD_ORG_CLIENT_RULES) {
    if (rule.match.test(orgName)) {
      clientName = rule.client;
      farmName   = rule.farm;
      enterprise = rule.enterprise;
      break;
    }
  }

  const client = await Client.findOneAndUpdate(
    { name: clientName },
    { $setOnInsert: { name: clientName, type: clientName === 'M77 AG' ? 'owner' : 'landlord' } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  const farm = await M77Farm.findOneAndUpdate(
    { client: client._id, name: farmName },
    { $setOnInsert: { client: client._id, name: farmName } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );

  return { clientId: client._id, farmId: farm._id, enterprise };
}

// JD API conventions
const JD_API_VERSION_HEADER = 'application/vnd.deere.axiom.v3+json';
const JD_PAGE_SIZE = 100;

// Hectare → acre conversion (1 ha = 2.47105381 ac).
const HECTARES_TO_ACRES = 2.47105381;
// Square meter → acre (1 ac = 4046.8564224 m²).
const SQM_TO_ACRES = 1 / 4046.8564224;

// One authenticated request to the JD API, with retry/backoff on 429/5xx.
// `pathOrUrl` may be an absolute URL (returned in pagination links) or a
// path relative to the configured API base. Throws JdAuthError on 401/403.
async function jdApiFetch(pathOrUrl, opts = {}) {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : (getApiBase() + pathOrUrl.replace(/^\//, ''));

  const res = await retryWithBackoff(async () => {
    const accessToken = await getValidAccessToken();
    return fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': JD_API_VERSION_HEADER,
        ...(opts.headers || {})
      },
      body: opts.body
    });
  }, { label: `JD ${url}` });

  if (res.status === 401 || res.status === 403) {
    // The token was valid when getValidAccessToken returned, but the API
    // still rejected it — clear stored token and force re-auth.
    await JdToken.deleteOne({ key: TOKEN_KEY });
    throw new JdAuthError(`JD API rejected token (${res.status}). Reconnect to John Deere.`, 'REVOKED');
  }

  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch (_) {}
    throw new Error(`JD API ${res.status} ${res.statusText} for ${url}: ${detail.slice(0, 500)}`);
  }

  return res.json();
}

// Find the next-page URL in an Axiom v3 response. Returns null if absent.
function findNextPageUrl(payload) {
  const links = (payload && payload.links) || [];
  for (const link of links) {
    const rel = link?.rel || '';
    if (rel === 'nextPage' || rel === 'next') return link.uri || link.href || null;
  }
  return null;
}

async function fetchAllPages(initialPath) {
  const all = [];
  let next = initialPath;
  let safety = 0;
  while (next) {
    if (++safety > 1000) {
      throw new Error(`JD pagination exceeded 1000 pages on ${initialPath} — refusing to continue`);
    }
    const payload = await jdApiFetch(next);
    const values = Array.isArray(payload?.values) ? payload.values : [];
    all.push(...values);
    next = findNextPageUrl(payload);
  }
  return all;
}

async function fetchAllOrganizations() {
  return fetchAllPages(`organizations?count=${JD_PAGE_SIZE}`);
}

async function fetchAllFieldsForOrg(orgId) {
  // embed=activeBoundary returns each field's current boundary inline so we
  // don't have to make a follow-up request per field.
  const path = `organizations/${encodeURIComponent(orgId)}/fields?count=${JD_PAGE_SIZE}&embed=activeBoundary`;
  return fetchAllPages(path);
}

// Defensive boundary extraction. JD has historically returned boundaries in
// several shapes — try the well-known paths in order, return null if none
// produce a valid GeoJSON Polygon. Preserves outer ring only.
function extractBoundary(jdField) {
  if (!jdField) return null;

  const candidates = [
    jdField?.activeBoundary?.boundaryGeometry?.geoJson,
    jdField?.activeBoundary?.geoJson,
    jdField?.boundary?.geoJson
  ];
  for (const cand of candidates) {
    if (cand && cand.type === 'Polygon' && Array.isArray(cand.coordinates)) {
      return { type: 'Polygon', coordinates: cand.coordinates };
    }
    if (cand && cand.type === 'MultiPolygon' && Array.isArray(cand.coordinates) && cand.coordinates.length) {
      // Use the first polygon — fields rarely have legitimate multipolygon
      // boundaries; if they do, the matcher will flag low-overlap and queue.
      return { type: 'Polygon', coordinates: cand.coordinates[0] };
    }
  }

  // Older Axiom shape: rings of {lat, lng} points.
  const rings = jdField?.activeBoundary?.multipolygons?.[0]?.rings;
  if (Array.isArray(rings) && rings.length) {
    const outer = rings[0]?.points;
    if (Array.isArray(outer) && outer.length >= 3) {
      const ring = outer
        .map(p => [Number(p.lon ?? p.lng), Number(p.lat)])
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
      if (ring.length >= 3) {
        // Close the ring if not already closed.
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);
        return { type: 'Polygon', coordinates: [ring] };
      }
    }
  }

  return null;
}

// Defensive acres extraction with unit conversion.
function extractAcres(jdField) {
  const a = jdField?.area;
  if (!a) return 0;
  const value = Number(a.valueAsDouble ?? a.measurement ?? a.value ?? 0);
  if (!Number.isFinite(value) || value === 0) return 0;
  const unit = String(a.unitId ?? a.unit ?? 'ac').toLowerCase();
  if (unit === 'ac' || unit === 'acre' || unit === 'acres') return value;
  if (unit === 'ha' || unit === 'hectare' || unit === 'hectares') return value * HECTARES_TO_ACRES;
  if (unit === 'm2' || unit === 'sqm' || unit === 'm^2') return value * SQM_TO_ACRES;
  // Unknown unit — surface raw value rather than silently converting wrong.
  console.warn(`[jd] unknown area unit "${unit}" on field ${jdField.id || jdField.name}; using raw value`);
  return value;
}

// Upserts the JD-side field cache. Returns number of records upserted.
async function upsertJdFieldCache(jdRecords) {
  if (!jdRecords.length) return 0;
  const ops = jdRecords.map(r => ({
    updateOne: {
      filter: { jd_field_id: r.jd_field_id },
      update: { $set: { ...r, syncedAt: new Date() } },
      upsert: true
    }
  }));
  const res = await JdField.bulkWrite(ops, { ordered: false });
  return (res.upsertedCount || 0) + (res.modifiedCount || 0);
}

// Build the normalized JD field shape used by the matcher and cache.
function normalizeJdField(jd, orgMeta) {
  const id = String(jd?.id ?? jd?.fieldId ?? '');
  if (!id) return null;
  return {
    jd_field_id: id,
    jd_org_id:   orgMeta?.id || null,
    jd_org_name: orgMeta?.name || null,
    jd_farm_id:  jd?.farm?.id || jd?.farmId || null,
    jd_farm_name: jd?.farm?.name || jd?.farmName || null,
    name:  String(jd?.name || '').trim(),
    acres: extractAcres(jd),
    boundary: extractBoundary(jd)
  };
}

// One M77 field gets one decision per sync run. Decisions are recorded in
// the run's audit log and (for 'linked', 'review', 'created') produce a
// concrete database write performed inside a transaction so partial states
// never persist for a single field.
async function applyDecisionForM77(m77, match, runId, syncedAt) {
  const session = await mongoose.startSession();
  try {
    let action = 'skipped-no-candidate';
    let reason = 'no candidate above threshold';
    let payload = {
      m77FieldId: m77._id,
      m77Name: m77.name,
      jd_field_id: null,
      jdName: null,
      reason,
      score: 0,
      overlap: null,
      nameMatch: false,
      acresMatch: false
    };

    if (match) {
      payload.jd_field_id = match.jdField.jd_field_id;
      payload.jdName = match.jdField.name;
      payload.score = match.score;
      payload.overlap = match.overlap;
      payload.nameMatch = match.nameMatch;
      payload.acresMatch = match.acresMatch;
      payload.reason = match.reason;

      if (match.decision === 'auto') action = 'linked';
      else if (match.decision === 'review') action = 'review';
    }
    payload.action = action;

    await session.withTransaction(async () => {
      if (action === 'linked') {
        await M77Field.updateOne(
          { _id: m77._id },
          { $set: {
              jd_field_id: match.jdField.jd_field_id,
              jdLastSyncedAt: syncedAt,
              jdSyncMatchScore: match.score
          }},
          { session }
        );
      } else if (action === 'review') {
        // Idempotent: skip if a pending review already exists for this pair.
        await JdSyncReview.updateOne(
          {
            m77FieldId: m77._id,
            jd_field_id: match.jdField.jd_field_id,
            status: 'pending'
          },
          {
            $setOnInsert: {
              m77FieldId: m77._id,
              jd_field_id: match.jdField.jd_field_id,
              status: 'pending',
              syncedAt
            },
            $set: {
              overlap: match.overlap,
              nameMatch: match.nameMatch,
              acresMatch: match.acresMatch,
              acresRatio: match.acresRatio,
              score: match.score,
              m77Name: m77.name,
              m77Acres: m77.acres,
              jdName: match.jdField.name,
              jdAcres: match.jdField.acres
            }
          },
          { upsert: true, session }
        );
      }

      await JdSyncRun.updateOne(
        { runId },
        {
          $push: { decisions: payload },
          $inc: {
            'summary.autoMatched': action === 'linked' ? 1 : 0,
            'summary.reviewQueued': action === 'review' ? 1 : 0,
            'summary.skippedNoCandidate': action === 'skipped-no-candidate' ? 1 : 0
          }
        },
        { session }
      );
    });

    return action;
  } finally {
    await session.endSession();
  }
}

// Auto-create an M77 field for each JD field that didn't get matched to any
// existing M77 record. Each creation runs inside its own transaction together
// with the audit append.
async function createM77FieldFromJd(jd, runId, syncedAt) {
  const session = await mongoose.startSession();
  try {
    let createdId;
    await session.withTransaction(async () => {
      // Map JD org → M77 Client + Farm. Creates the records on demand.
      const { clientId, farmId, enterprise } = await resolveClientFarmForJdField(jd, session);

      const created = await M77Field.create([{
        name: jd.name || `JD field ${jd.jd_field_id}`,
        acres: jd.acres || 0,
        owner: 'm77',
        landlordName: '',
        m77SharePercent: 100,
        landlordSharePercent: 0,
        irrigation: 'dryland',
        enterprise,
        crop2026: '',
        rotationGroup: jd.jd_farm_name || '',
        client: clientId,
        farm: farmId,
        boundary: jd.boundary || undefined,
        jd_field_id: jd.jd_field_id,
        createdFromJdSync: true,
        jdLastSyncedAt: syncedAt,
        status: 'active'
      }], { session });
      createdId = created[0]._id;

      await JdSyncRun.updateOne(
        { runId },
        {
          $push: {
            decisions: {
              m77FieldId: createdId,
              m77Name: jd.name,
              jd_field_id: jd.jd_field_id,
              jdName: jd.name,
              action: 'created',
              reason: 'no existing M77 field matched this JD field',
              score: 0,
              overlap: null,
              nameMatch: false,
              acresMatch: false
            }
          },
          $inc: { 'summary.autoCreated': 1 }
        },
        { session }
      );
    });
    return createdId;
  } finally {
    await session.endSession();
  }
}

// Top-level orchestrator. Idempotent across runs.
async function syncAllFields({ triggeredBy, triggeredByEmail }) {
  const runId = crypto.randomUUID();
  const startedAt = new Date();

  // Mark any previous abandoned runs as failed before starting a new one.
  await JdSyncRun.updateMany(
    { status: 'running' },
    { $set: { status: 'failed', errorMessage: 'Superseded by a newer run', completedAt: new Date() } }
  );

  await JdSyncRun.create({
    runId,
    triggeredBy: triggeredBy || null,
    triggeredByEmail: triggeredByEmail || null,
    environment: getEnvironment(),
    startedAt,
    status: 'running'
  });

  try {
    // 1. Fetch organizations and all fields.
    const orgs = await fetchAllOrganizations();
    const allJd = [];
    for (const org of orgs) {
      const fields = await fetchAllFieldsForOrg(org.id);
      for (const f of fields) {
        const norm = normalizeJdField(f, { id: org.id, name: org.name });
        if (norm) allJd.push(norm);
      }
    }

    await JdSyncRun.updateOne({ runId }, {
      $set: {
        'summary.organizationsFetched': orgs.length,
        'summary.jdFieldsFetched': allJd.length
      }
    });

    // 2. Cache the JD field data.
    await upsertJdFieldCache(allJd);

    // 3. Match every M77 field that doesn't already have a jd_field_id.
    const syncedAt = new Date();
    // Populate client.name so the matcher can compute the Client-alignment bonus.
    const m77Fields = await M77Field.find({}).populate('client', 'name');
    const linkedJdIds = new Set(m77Fields.filter(f => f.jd_field_id).map(f => f.jd_field_id));

    const m77ToConsider = m77Fields.filter(f => !f.jd_field_id);
    const candidatePool = allJd.filter(j => !linkedJdIds.has(j.jd_field_id));

    let skippedAlreadyLinked = m77Fields.length - m77ToConsider.length;
    if (skippedAlreadyLinked > 0) {
      await JdSyncRun.updateOne({ runId }, {
        $inc: { 'summary.skippedAlreadyLinked': skippedAlreadyLinked }
      });
    }

    const consumedJdIds = new Set();
    let errorCount = 0;

    for (const m77 of m77ToConsider) {
      try {
        // Skip JD candidates already consumed by an earlier auto-link this run.
        const remaining = candidatePool.filter(j => !consumedJdIds.has(j.jd_field_id));
        const match = matcher.bestMatch(m77, remaining);
        const action = await applyDecisionForM77(m77, match, runId, syncedAt);
        if (action === 'linked' && match) {
          consumedJdIds.add(match.jdField.jd_field_id);
        }
      } catch (err) {
        errorCount++;
        console.error(`[jd-sync] error processing M77 field ${m77._id}:`, err);
        await JdSyncRun.updateOne({ runId }, {
          $push: {
            decisions: {
              m77FieldId: m77._id,
              m77Name: m77.name,
              action: 'error',
              reason: 'exception during decision',
              errorMessage: err.message
            }
          },
          $inc: { 'summary.errors': 1 }
        });
      }
    }

    // 4. Auto-create M77 fields for JD fields that didn't end up linked anywhere.
    const matchedJdIds = new Set([...linkedJdIds, ...consumedJdIds]);
    // Also avoid creating a new M77 record for a JD field that is the JD side
    // of a pending review item — the user may accept that review later.
    const pendingReviewJdIds = new Set(
      (await JdSyncReview.find({ status: 'pending' }).select('jd_field_id'))
        .map(r => r.jd_field_id)
    );

    const orphanJdFields = allJd.filter(j =>
      !matchedJdIds.has(j.jd_field_id) && !pendingReviewJdIds.has(j.jd_field_id)
    );

    for (const jd of orphanJdFields) {
      try {
        await createM77FieldFromJd(jd, runId, syncedAt);
      } catch (err) {
        // Possible race: a unique-index conflict if jd_field_id already
        // exists on an M77 row. Log and continue.
        errorCount++;
        console.error(`[jd-sync] error creating M77 from JD ${jd.jd_field_id}:`, err);
        await JdSyncRun.updateOne({ runId }, {
          $push: {
            decisions: {
              jd_field_id: jd.jd_field_id,
              jdName: jd.name,
              action: 'error',
              reason: 'exception during auto-create',
              errorMessage: err.message
            }
          },
          $inc: { 'summary.errors': 1 }
        });
      }
    }

    await JdSyncRun.updateOne({ runId }, {
      $set: {
        status: errorCount > 0 ? 'completed' : 'completed',
        completedAt: new Date()
      }
    });

    return runId;
  } catch (err) {
    await JdSyncRun.updateOne({ runId }, {
      $set: {
        status: 'failed',
        errorMessage: err.message,
        completedAt: new Date()
      }
    });
    throw err;
  }
}

module.exports = {
  // Constants (exposed for testing / introspection)
  JD_AUTHORIZE_URL,
  JD_TOKEN_URL,
  JD_SCOPES,
  JD_API_VERSION_HEADER,
  TOKEN_KEY,
  // Errors
  JdAuthError,
  // OAuth helpers
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  persistTokens,
  // Runtime helpers
  getEnvironment,
  getApiBase,
  getStoredToken,
  getValidAccessToken,
  disconnect,
  // API
  jdApiFetch,
  fetchAllOrganizations,
  fetchAllFieldsForOrg,
  extractBoundary,
  extractAcres,
  normalizeJdField,
  syncAllFields
};
