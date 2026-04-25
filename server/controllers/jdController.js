const jwt = require('jsonwebtoken');
const jdService = require('../services/johnDeereService');

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
    if (!token) {
      return res.json({
        success: true,
        connected: false,
        environment: jdService.getEnvironment()
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
      scope: token.scope || null
    });
  } catch (err) {
    console.error('JD status error:', err);
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
