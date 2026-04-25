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
// Throws if there is no stored token or refresh fails.
async function getValidAccessToken() {
  const stored = await getStoredToken();
  if (!stored) throw new Error('Not connected to John Deere.');

  const safetyMs = REFRESH_SAFETY_WINDOW_SECONDS * 1000;
  const stillValid = stored.expiresAt && (stored.expiresAt.getTime() - Date.now() > safetyMs);
  if (stillValid) return stored.accessToken;

  const refreshed = await refreshAccessTokenUsing(stored.refreshToken);
  const updated = await persistTokens(refreshed, { isInitial: false });
  return updated.accessToken;
}

module.exports = {
  // Constants (exposed for testing / introspection)
  JD_AUTHORIZE_URL,
  JD_TOKEN_URL,
  JD_SCOPES,
  TOKEN_KEY,
  // OAuth helpers
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  persistTokens,
  // Runtime helpers
  getEnvironment,
  getApiBase,
  getStoredToken,
  getValidAccessToken,
  disconnect
};
