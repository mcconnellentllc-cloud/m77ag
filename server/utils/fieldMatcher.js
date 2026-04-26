/**
 * Field matching: M77Field <-> JdField.
 *
 * Two signals combined into a single decision:
 *   1. Normalized name equality (case + whitespace insensitive)
 *   2. True polygon overlap (turf intersect + area, in square meters)
 *
 * Decision matrix (all thresholds in MATCHER_CONFIG):
 *   - Auto-match: overlap >= AUTO_MATCH_OVERLAP, OR
 *                 (overlap >= REVIEW_MIN_OVERLAP AND nameMatch
 *                  AND acres ratio within ACRES_TOLERANCE)
 *   - Review:     overlap in [REVIEW_MIN_OVERLAP, AUTO_MATCH_OVERLAP), OR
 *                 nameMatch but at least one polygon missing
 *   - None:       otherwise
 *
 * When the matcher cannot decide with high confidence, the default is
 * REVIEW — never silently auto-merge.
 */

const intersect = require('@turf/intersect').default;
const { area } = require('@turf/area');
const { polygon: turfPolygon, featureCollection } = require('@turf/helpers');

// All matcher constants live here, named, in one place.
const MATCHER_CONFIG = Object.freeze({
  // GeoJSON polygon overlap thresholds. Overlap is intersection_area /
  // min(area_A, area_B), so a value of 0.80 means "at least 80% of the
  // smaller field is inside the other field".
  AUTO_MATCH_OVERLAP: 0.80,
  REVIEW_MIN_OVERLAP: 0.40,

  // Acres similarity (lo/hi). 0.70 means smaller is at least 70% of larger.
  ACRES_TOLERANCE: 0.30,

  // Score weights for ranking multiple candidates (overlap is base 0..1).
  NAME_MATCH_SCORE_BONUS: 0.20,
  ACRES_MATCH_SCORE_BONUS: 0.05,

  // Score assigned when GPS data is missing but names match.
  NAME_ONLY_REVIEW_SCORE: 0.50
});

// ---- Name normalization ----------------------------------------------------

const NAME_NORMALIZATION_RULES = Object.freeze({
  // Lowercase; collapse common separators (._-) to whitespace; collapse runs
  // of whitespace to a single space; strip leading/trailing whitespace.
  trim: true,
  toLowerCase: true,
  separatorsToSpace: /[._\-]+/g,
  collapseWhitespace: /\s+/g
});

function normalizeName(s) {
  let out = String(s == null ? '' : s);
  if (NAME_NORMALIZATION_RULES.trim) out = out.trim();
  if (NAME_NORMALIZATION_RULES.toLowerCase) out = out.toLowerCase();
  out = out.replace(NAME_NORMALIZATION_RULES.separatorsToSpace, ' ');
  out = out.replace(NAME_NORMALIZATION_RULES.collapseWhitespace, ' ');
  return out;
}

function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  return na.length > 0 && na === nb;
}

// ---- Polygon overlap -------------------------------------------------------

function isUsablePolygon(poly) {
  if (!poly || poly.type !== 'Polygon') return false;
  const ring = Array.isArray(poly.coordinates) ? poly.coordinates[0] : null;
  return Array.isArray(ring) && ring.length >= 4; // closed ring = 4 pts min
}

// True polygon overlap percentage using turf intersect + area.
// Returns 0..1, or null if either polygon is missing/invalid.
function polygonOverlapPercent(polyA, polyB) {
  if (!isUsablePolygon(polyA) || !isUsablePolygon(polyB)) return null;

  let featA, featB;
  try {
    featA = turfPolygon(polyA.coordinates);
    featB = turfPolygon(polyB.coordinates);
  } catch (e) {
    // Invalid GeoJSON (bad winding, self-intersection, etc.)
    return null;
  }

  const aArea = area(featA);
  const bArea = area(featB);
  if (aArea <= 0 || bArea <= 0) return null;

  let inter;
  try {
    inter = intersect(featureCollection([featA, featB]));
  } catch (e) {
    return null;
  }
  if (!inter) return 0;

  const interArea = area(inter);
  return interArea / Math.min(aArea, bArea);
}

// ---- Acres similarity ------------------------------------------------------

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
  return r !== null && r >= (1 - MATCHER_CONFIG.ACRES_TOLERANCE);
}

// ---- Scoring + decision ----------------------------------------------------

function scoreCandidate(m77Field, jdField) {
  const nameMatch = namesMatch(m77Field.name, jdField.name);
  const overlap = polygonOverlapPercent(m77Field.boundary, jdField.boundary);
  const acresMatch = acresWithinTolerance(m77Field.acres, jdField.acres);
  const ratio = acresRatio(m77Field.acres, jdField.acres);

  let decision = 'none';
  let reason = 'no usable signal';
  let score = 0;

  if (overlap !== null) {
    if (overlap >= MATCHER_CONFIG.AUTO_MATCH_OVERLAP) {
      decision = 'auto';
      reason = `overlap ${(overlap * 100).toFixed(1)}% >= auto threshold`;
    } else if (overlap >= MATCHER_CONFIG.REVIEW_MIN_OVERLAP && nameMatch && acresMatch) {
      decision = 'auto';
      reason = `overlap ${(overlap * 100).toFixed(1)}% + name match + acres match`;
    } else if (overlap >= MATCHER_CONFIG.REVIEW_MIN_OVERLAP) {
      decision = 'review';
      reason = `overlap ${(overlap * 100).toFixed(1)}% in review band`;
    } else {
      reason = `overlap ${(overlap * 100).toFixed(1)}% below review threshold`;
    }
    score = overlap
      + (nameMatch ? MATCHER_CONFIG.NAME_MATCH_SCORE_BONUS : 0)
      + (acresMatch ? MATCHER_CONFIG.ACRES_MATCH_SCORE_BONUS : 0);
  } else if (nameMatch) {
    decision = 'review';
    reason = 'name match without usable GPS on at least one side';
    score = MATCHER_CONFIG.NAME_ONLY_REVIEW_SCORE
      + (acresMatch ? MATCHER_CONFIG.ACRES_MATCH_SCORE_BONUS : 0);
  }

  return {
    overlap: overlap === null ? null : Number(overlap.toFixed(4)),
    nameMatch,
    acresMatch,
    acresRatio: ratio === null ? null : Number(ratio.toFixed(4)),
    score: Number(score.toFixed(4)),
    decision,
    reason
  };
}

// For one M77 field, evaluate against an array of JD candidates and pick the
// best non-'none'. If two candidates tie on score, prefers the one with
// higher overlap (deterministic).
function bestMatch(m77Field, jdCandidates) {
  let best = null;
  for (const jd of jdCandidates) {
    const s = scoreCandidate(m77Field, jd);
    if (s.decision === 'none') continue;
    if (!best
        || s.score > best.score
        || (s.score === best.score && (s.overlap || 0) > (best.overlap || 0))) {
      best = { jdField: jd, ...s };
    }
  }
  return best;
}

module.exports = {
  MATCHER_CONFIG,
  NAME_NORMALIZATION_RULES,
  normalizeName,
  namesMatch,
  polygonOverlapPercent,
  acresRatio,
  acresWithinTolerance,
  scoreCandidate,
  bestMatch
};
