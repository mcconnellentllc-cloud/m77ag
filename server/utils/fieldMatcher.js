/**
 * Field matching: M77Field <-> JdField.
 *
 * Two signals combined into a single decision:
 *   1. Normalized name equality (case + whitespace insensitive)
 *   2. Bounding-box overlap as proxy for polygon overlap
 *
 * Bounding-box overlap is intersection_area / min(area_A, area_B). Real
 * fields are predominantly rectangular pivots and rectangular dryland
 * blocks, so bbox overlap closely tracks true polygon overlap. Sliver-
 * or L-shaped fields can underperform — those land in the review queue
 * by design rather than being auto-matched.
 *
 * Decision matrix (all thresholds tuneable via the constants below):
 *   - Auto-match if: overlap >= AUTO_MATCH_OVERLAP, OR
 *                    (overlap >= REVIEW_MIN_OVERLAP AND nameMatch
 *                     AND acres ratio within ACRES_TOLERANCE)
 *   - Review queue if: overlap in [REVIEW_MIN_OVERLAP, AUTO_MATCH_OVERLAP), OR
 *                      nameMatch but at least one polygon missing
 *   - No match otherwise.
 */

const AUTO_MATCH_OVERLAP   = 0.80;
const REVIEW_MIN_OVERLAP   = 0.40;
const ACRES_TOLERANCE      = 0.30;  // ±30 % means ratio in [0.7, 1.3]

function normalizeName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[._\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  return na.length > 0 && na === nb;
}

function ringFromPolygon(poly) {
  if (!poly || !Array.isArray(poly.coordinates) || poly.coordinates.length === 0) return null;
  const ring = poly.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 3) return null;
  return ring;
}

function bbox(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const x = Number(pt[0]);
    const y = Number(pt[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return { minX, minY, maxX, maxY };
}

function bboxArea(b) {
  if (!b) return 0;
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  return Math.max(0, w) * Math.max(0, h);
}

function bboxIntersection(a, b) {
  const minX = Math.max(a.minX, b.minX);
  const maxX = Math.min(a.maxX, b.maxX);
  const minY = Math.max(a.minY, b.minY);
  const maxY = Math.min(a.maxY, b.maxY);
  if (maxX <= minX || maxY <= minY) return null;
  return { minX, minY, maxX, maxY };
}

// Returns 0..1, or null if either polygon is missing/invalid.
function polygonOverlapPercent(polyA, polyB) {
  const ringA = ringFromPolygon(polyA);
  const ringB = ringFromPolygon(polyB);
  if (!ringA || !ringB) return null;
  const a = bbox(ringA);
  const b = bbox(ringB);
  if (!a || !b) return null;
  const aArea = bboxArea(a);
  const bArea = bboxArea(b);
  if (aArea === 0 || bArea === 0) return null;
  const inter = bboxIntersection(a, b);
  if (!inter) return 0;
  const interArea = bboxArea(inter);
  return interArea / Math.min(aArea, bArea);
}

function acresRatio(a, b) {
  const x = Number(a) || 0;
  const y = Number(b) || 0;
  if (x === 0 || y === 0) return null;
  const lo = Math.min(x, y);
  const hi = Math.max(x, y);
  return lo / hi;
}

function acresWithinTolerance(a, b) {
  const r = acresRatio(a, b);
  return r !== null && r >= (1 - ACRES_TOLERANCE);
}

// Pure scoring fn — used for both candidate ranking and decision-making.
// Returns { overlap, nameMatch, acresMatch, score, decision } where decision
// is 'auto' | 'review' | 'none'.
function scoreCandidate(m77Field, jdField) {
  const nameMatch = namesMatch(m77Field.name, jdField.name);
  const overlap = polygonOverlapPercent(m77Field.boundary, jdField.boundary);
  const acresMatch = acresWithinTolerance(m77Field.acres, jdField.acres);

  let decision = 'none';
  let score = 0;

  if (overlap !== null) {
    if (overlap >= AUTO_MATCH_OVERLAP) {
      decision = 'auto';
    } else if (overlap >= REVIEW_MIN_OVERLAP && nameMatch && acresMatch) {
      decision = 'auto';
    } else if (overlap >= REVIEW_MIN_OVERLAP) {
      decision = 'review';
    }
    score = overlap + (nameMatch ? 0.20 : 0) + (acresMatch ? 0.05 : 0);
  } else if (nameMatch) {
    // No GPS on at least one side — name match alone goes to review.
    decision = 'review';
    score = 0.50 + (acresMatch ? 0.05 : 0);
  }

  return {
    overlap: overlap === null ? null : Number(overlap.toFixed(4)),
    nameMatch,
    acresMatch,
    acresRatio: acresRatio(m77Field.acres, jdField.acres),
    score: Number(score.toFixed(4)),
    decision
  };
}

// For one M77 field, evaluate against an array of JD candidates and pick the best.
// Returns { jdField, ...scoreFields } or null if none of the candidates rise
// above 'none'.
function bestMatch(m77Field, jdCandidates) {
  let best = null;
  for (const jd of jdCandidates) {
    const s = scoreCandidate(m77Field, jd);
    if (s.decision === 'none') continue;
    if (!best || s.score > best.score) {
      best = { jdField: jd, ...s };
    }
  }
  return best;
}

module.exports = {
  AUTO_MATCH_OVERLAP,
  REVIEW_MIN_OVERLAP,
  ACRES_TOLERANCE,
  normalizeName,
  namesMatch,
  polygonOverlapPercent,
  acresRatio,
  scoreCandidate,
  bestMatch
};
