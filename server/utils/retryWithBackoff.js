/**
 * Generic retry with exponential backoff for HTTP requests.
 *
 * - Retries on network errors and on 429 / 5xx responses.
 * - On 429, honors the Retry-After header (seconds or HTTP-date).
 * - Caller passes a function that performs ONE fetch attempt and either
 *   returns a Response (whose status is inspected) or throws.
 * - Returns the final Response — the caller decides how to handle non-OK
 *   statuses that didn't trigger a retry.
 *
 * Defaults: 5 attempts, base delay 500ms, cap 16 seconds.
 */

const RETRY_CONFIG = Object.freeze({
  MAX_ATTEMPTS: 5,
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 16000,
  RETRY_STATUS_CODES: new Set([408, 429, 500, 502, 503, 504])
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const asNumber = Number(headerValue);
  if (Number.isFinite(asNumber)) return Math.max(0, asNumber * 1000);
  // HTTP-date
  const dateMs = Date.parse(headerValue);
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

function backoffDelay(attempt) {
  // attempt is 1-based: 500, 1000, 2000, 4000, 8000 (capped at MAX_DELAY_MS)
  const exp = Math.min(RETRY_CONFIG.MAX_DELAY_MS, RETRY_CONFIG.BASE_DELAY_MS * 2 ** (attempt - 1));
  // Add jitter (full jitter strategy) to spread retries from concurrent callers.
  return Math.floor(Math.random() * exp);
}

/**
 * @param {() => Promise<Response>} attemptFn  Performs one fetch.
 * @param {object} [opts]
 * @param {string} [opts.label]                For logging
 * @param {number} [opts.maxAttempts]
 * @returns {Promise<Response>}
 */
async function retryWithBackoff(attemptFn, opts = {}) {
  const label = opts.label || 'request';
  const maxAttempts = opts.maxAttempts || RETRY_CONFIG.MAX_ATTEMPTS;

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await attemptFn();

      if (res.ok || !RETRY_CONFIG.RETRY_STATUS_CODES.has(res.status)) {
        return res;
      }

      if (attempt === maxAttempts) {
        return res; // give up, return the last bad response so caller can read it
      }

      const retryAfterMs = parseRetryAfter(res.headers.get('retry-after'));
      const delay = retryAfterMs !== null ? retryAfterMs : backoffDelay(attempt);
      console.warn(`[retry] ${label}: status ${res.status}, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(delay);
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) throw err;
      const delay = backoffDelay(attempt);
      console.warn(`[retry] ${label}: ${err.message || err}, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
      await sleep(delay);
    }
  }
  throw lastErr || new Error(`${label} failed after ${maxAttempts} attempts`);
}

module.exports = { retryWithBackoff, RETRY_CONFIG };
