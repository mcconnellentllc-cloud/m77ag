// Fills blank Field Manager (CroppingField) details from data already on
// file, without overwriting anything entered by hand:
//   - soil test history from server/data/soil-field-data.json
//   - section / township / range parsed from the legal description
//   - county from township and range (confirmed on the 2026 RCIS summary)
//   - lease type and landlord from the farm (M77Farm)
//   - soil survey map units and capability class from USDA SSURGO, using
//     the field boundary on the linked M77Field
const https = require('https');
const CroppingField = require('../models/croppingField');
const M77Farm = require('../models/m77Farm');
const M77Field = require('../models/m77Field');
const SOIL_DATA = require('../data/soil-field-data.json');

// Township-range blocks and their county, as printed on the M77 AG 2026
// RCIS insurance summary (Hofmeister, Oct 22, 2025). Blocks not listed are
// left blank rather than guessed.
const COUNTY_BY_TR = {
  '6N-46W': 'Phillips', '6N-47W': 'Phillips', '7N-46W': 'Phillips', '7N-47W': 'Phillips', '8N-47W': 'Phillips',
  '7N-48W': 'Logan', '8N-48W': 'Logan',
  '9N-46W': 'Sedgwick', '9N-47W': 'Sedgwick'
};

const SDA_URL = 'https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest';
const SQ_M_PER_ACRE = 4046.8564224;

function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === '';
}

// "61.N HIGHLAND E" -> { num: '61', suffix: 'N' }; "61-N" and "28 NE" too.
function fieldNumber(name) {
  const m = String(name || '').trim().match(/^#?(\d+)(?:[.\- ]?([NSEW]{1,2}))?(?![\d])/i);
  return m ? { num: m[1], suffix: (m[2] || '').toUpperCase() } : null;
}

// Soil records that belong to a field. A soil ID with a half (61-N) matches
// that half only. A soil ID without one (14) covers every field with that
// number, unless another soil ID names that field's half.
function soilRecordsFor(fieldName) {
  const f = fieldNumber(fieldName);
  if (!f) return [];
  const sameNum = SOIL_DATA.filter(s => { const n = fieldNumber(s.id); return n && n.num === f.num; });
  const exact = sameNum.filter(s => fieldNumber(s.id).suffix && fieldNumber(s.id).suffix === f.suffix);
  if (exact.length) return exact;
  if (f.suffix && sameNum.some(s => fieldNumber(s.id).suffix)) return [];
  return sameNum.filter(s => !fieldNumber(s.id).suffix);
}

function n(v) {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

function historyToSample(h, rec) {
  return {
    year: h.year, crop: h.crop || '', depth: '0-8 in',
    yieldGoal: n(h.yieldGoal) !== null ? h.yieldGoal : (parseFloat(h.yieldGoal) || null),
    ph: n(h.pH), nitrogen: n(h.NO3_ppm), phosphorus: n(h.Olsen_P), potassium: n(h.Potassium_ppm),
    sulfur: n(h.Sulfur_ppm), zinc: n(h.Zinc_ppm), iron: n(h.Iron_ppm), organicMatter: n(h.OM_pct), cec: n(h.CEC),
    bufferPH: n(h.Buffer_pH), NO3ppm: n(h.NO3_ppm), NO3lbs: n(h.NO3_lbs_A), NO3Total: n(h.NO3_lbs_A),
    olsenP: n(h.Olsen_P), bray1P: n(h.Bray1_P), brayP2: n(h.Bray2_P), calcium: n(h.Calcium_ppm),
    magnesium: n(h.Magnesium_ppm), sodium: n(h.Sodium_ppm), manganese: n(h.Manganese_ppm),
    copper: n(h.Copper_ppm), boron: n(h.Boron_ppm),
    baseSat: n(h.Base_Sat_pct), hSat: n(h.H_Sat_pct), caSat: n(h.Ca_Sat_pct), mgSat: n(h.Mg_Sat_pct),
    kSat: n(h.K_Sat_pct), naSat: n(h.Na_Sat_pct),
    notes: 'Soil lab history, field ' + rec.id
  };
}

function currentToSample(rec) {
  const s = rec.soil2026;
  return {
    year: 2026, crop: rec.crop2026 || '', depth: '0-8 in',
    yieldGoal: n(rec.yieldGoal) !== null ? rec.yieldGoal : (parseFloat(rec.yieldGoal) || null),
    ph: n(s.pH), nitrogen: n(s.NO3ppm), phosphorus: n(s.olsenP), potassium: n(s.potassium), sulfur: n(s.sulfur),
    zinc: n(s.zinc), iron: n(s.iron), organicMatter: n(s.OM), cec: n(s.CEC), bufferPH: n(s.bufferPH),
    excessLime: s.excessLime || null, solubleSalts: n(s.solubleSalts), NO3ppm: n(s.NO3ppm), NO3lbs: n(s.NO3lbs),
    NO3Total: n(s.NO3Total), olsenP: n(s.olsenP), brayP2: n(s.brayP2), calcium: n(s.calcium),
    magnesium: n(s.magnesium), sodium: n(s.sodium), manganese: n(s.manganese), copper: n(s.copper), boron: n(s.boron),
    baseSat: n(s.baseSat), hSat: n(s.hSat), caSat: n(s.caSat), mgSat: n(s.mgSat), kSat: n(s.kSat), naSat: n(s.naSat),
    agronomistAlerts: (rec.alerts || []).map(a => ({ type: a.type, message: a.message })),
    notes: 'Soil lab 2026 sample, field ' + rec.id
  };
}

// Soil samples for a field, one per year. When two soil IDs cover the field
// (a whole-field sample listed for both halves), the first one wins.
function soilSamplesFor(fieldName) {
  const byYear = new Map();
  for (const rec of soilRecordsFor(fieldName)) {
    for (const h of rec.history || []) if (h.year && !byYear.has(h.year)) byYear.set(h.year, historyToSample(h, rec));
    // Fields not sampled in 2026 carry an all-blank soil2026 block; skip it.
    const hasValues = rec.soil2026 && Object.values(rec.soil2026).some(v => v !== null && v !== '');
    if (hasValues && !byYear.has(2026)) byYear.set(2026, currentToSample(rec));
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

// "SE4 35-7-47" -> { section: '35', township: '7N', range: '47W' }
function parseLegal(legal) {
  const m = String(legal || '').match(/(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{2})\b/);
  if (!m) return null;
  return { section: String(parseInt(m[1], 10)), township: parseInt(m[2], 10) + 'N', range: parseInt(m[3], 10) + 'W' };
}

function trKey(township, range) {
  const t = String(township || '').toUpperCase().replace(/\s/g, '');
  const r = String(range || '').toUpperCase().replace(/\s/g, '');
  if (!t || !r) return '';
  return (/[NS]$/.test(t) ? t : t + 'N') + '-' + (/[EW]$/.test(r) ? r : r + 'W');
}

// Changes for one field, as { path: value }, filling blanks only.
function plannedChanges(cf, farm, rawSoil) {
  const set = {};
  const notes = [];

  const legal = parseLegal(cf.legal);
  if (legal) {
    for (const k of ['section', 'township', 'range']) if (isBlank(cf[k])) set[k] = legal[k];
  } else if (cf.legal) {
    notes.push('Legal description "' + cf.legal + '" could not be read');
  }
  if (isBlank(cf.county)) {
    const county = COUNTY_BY_TR[trKey(set.township || cf.township, set.range || cf.range)];
    if (county) set.county = county;
    else if (set.township || cf.township) notes.push('County not on file for ' + trKey(set.township || cf.township, set.range || cf.range));
  }

  if (farm) {
    const lease = cf.lease || {};
    if (isBlank(lease.type)) {
      if (farm.type === 'crop-share') set['lease.type'] = 'crop-share';
      else if (farm.type === 'owned') set['lease.type'] = 'owned';
    }
    if (isBlank(lease.landlord) && farm.type === 'crop-share' && farm.landlordName) set['lease.landlord'] = farm.landlordName;
    const leaseType = set['lease.type'] || lease.type;
    if ((lease.sharePercentage === undefined || lease.sharePercentage === null) && leaseType === 'crop-share' && farm.defaultShare) {
      set['lease.sharePercentage'] = Math.round(farm.defaultShare * 100);
    }
  }

  // Soil lab samples for years the field does not have yet.
  const haveYears = new Set(((rawSoil && typeof rawSoil === 'object' && rawSoil.samples) || []).map(s => s.year));
  const samples = soilSamplesFor(cf.field).filter(s => !haveYears.has(s.year));
  if (!soilRecordsFor(cf.field).length) notes.push('No soil lab records for this field number');

  return { set, samples, notes };
}

async function loadContext() {
  const [fields, farms, m77Fields] = await Promise.all([
    CroppingField.find({}).sort({ farm: 1, field: 1 }).lean(),
    M77Farm.find({}).select('name type landlordName defaultShare').lean(),
    M77Field.find({ legacySource: 'CroppingField', legacyId: { $ne: null } }).select('legacyId boundary').lean()
  ]);
  const farmByName = {};
  for (const f of farms) if (!farmByName[f.name]) farmByName[f.name] = f;
  const boundaryByCf = {};
  for (const m of m77Fields) {
    if (m.boundary && Array.isArray(m.boundary.coordinates) && m.boundary.coordinates.length) boundaryByCf[String(m.legacyId)] = m.boundary;
  }
  // Raw soil values, since documents saved before the schema fix may hold a
  // plain string there.
  const raw = await CroppingField.collection.find({}, { projection: { soil: 1 } }).toArray();
  const rawSoil = {};
  for (const r of raw) rawSoil[String(r._id)] = r.soil;
  return { fields, farmByName, boundaryByCf, rawSoil };
}

// Preview of every field: what would be filled and what is missing.
async function preview() {
  const { fields, farmByName, boundaryByCf, rawSoil } = await loadContext();
  return fields.map(cf => {
    const plan = plannedChanges(cf, farmByName[cf.farm], rawSoil[String(cf._id)]);
    const rs = rawSoil[String(cf._id)];
    return {
      id: cf._id,
      field: cf.field,
      farm: cf.farm,
      set: plan.set,
      soilSampleYears: plan.samples.map(s => s.year),
      hasBoundary: !!boundaryByCf[String(cf._id)],
      hasSoilSurvey: !!(rs && typeof rs === 'object' && rs.mapUnits && rs.mapUnits.length),
      notes: plan.notes
    };
  });
}

// Writes the planned changes. Returns a per-field summary.
async function apply() {
  const { fields, farmByName, rawSoil } = await loadContext();
  const results = [];
  for (const cf of fields) {
    const rs = rawSoil[String(cf._id)];
    const plan = plannedChanges(cf, farmByName[cf.farm], rs);
    const update = {};
    if (typeof rs === 'string') {
      // Repair: a string here was meant as the soil type.
      update.$set = { soil: { type: rs, samples: plan.samples } };
    } else {
      if (Object.keys(plan.set).length) update.$set = { ...plan.set };
      if (plan.samples.length) {
        if (rs && typeof rs === 'object' && Array.isArray(rs.samples)) update.$push = { 'soil.samples': { $each: plan.samples } };
        else update.$set = { ...(update.$set || {}), 'soil.samples': plan.samples };
      }
    }
    if (typeof rs === 'string' && Object.keys(plan.set).length) Object.assign(update.$set, plan.set);
    if (!update.$set && !update.$push) continue;
    // Validate the new samples through the model before the raw update.
    await CroppingField.updateOne({ _id: cf._id }, update, { runValidators: true });
    results.push({ id: cf._id, field: cf.field, filled: Object.keys(plan.set), soilSamplesAdded: plan.samples.map(s => s.year) });
  }
  return results;
}

// ---------- SSURGO ----------

function polygonWkt(boundary) {
  const ring = boundary.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const pts = ring.map(p => Number(p[0]).toFixed(7) + ' ' + Number(p[1]).toFixed(7));
  if (pts[0] !== pts[pts.length - 1]) pts.push(pts[0]);
  if (!pts.every(p => /^-?\d+\.\d+ -?\d+\.\d+$/.test(p))) return null;
  return 'POLYGON((' + pts.join(',') + '))';
}

function sdaQuery(sql) {
  const body = JSON.stringify({ format: 'JSON+COLUMNNAME', query: sql });
  return new Promise((resolve, reject) => {
    const req = https.request(SDA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 60000 }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error('Soil survey service returned ' + res.statusCode));
        try {
          const j = JSON.parse(data || '{}');
          const [head, ...rows] = j.Table || [];
          resolve(head ? rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]]))) : []);
        } catch (e) {
          reject(new Error('Soil survey service sent an unreadable reply'));
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('Soil survey service timed out')));
    req.on('error', reject);
    req.end(body);
  });
}

// Looks up soil map units inside the field boundary and stores them with
// the dominant map unit as soil type and the area-weighted dominant
// non-irrigated capability class as soil class.
async function soilSurvey(croppingFieldId) {
  const cf = await CroppingField.findById(croppingFieldId);
  if (!cf) throw Object.assign(new Error('Field not found'), { status: 404 });
  const m = await M77Field.findOne({ legacySource: 'CroppingField', legacyId: cf._id }).select('boundary').lean();
  if (!m || !m.boundary || !Array.isArray(m.boundary.coordinates) || !m.boundary.coordinates.length) {
    throw Object.assign(new Error('No field boundary on file'), { status: 409 });
  }
  const wkt = polygonWkt(m.boundary);
  if (!wkt) throw Object.assign(new Error('Field boundary could not be read'), { status: 409 });
  const g = `geometry::STGeomFromText('${wkt}',4326).MakeValid()`;
  const rows = await sdaQuery(`SELECT P.mukey, MU.musym, MU.muname, A.niccdcd,
    SUM(geography::STGeomFromText(P.mupolygongeo.STIntersection(${g}).STAsText(),4326).MakeValid().STArea()) AS sqm
    FROM mupolygon P INNER JOIN mapunit MU ON MU.mukey = P.mukey LEFT JOIN muaggatt A ON A.mukey = P.mukey
    WHERE P.mupolygongeo.STIntersects(${g}) = 1
    GROUP BY P.mukey, MU.musym, MU.muname, A.niccdcd ORDER BY sqm DESC`);
  const units = rows.map(r => ({
    mukey: String(r.mukey), musym: r.musym, name: r.muname,
    acres: Math.round((parseFloat(r.sqm) || 0) / SQ_M_PER_ACRE * 10) / 10,
    capabilityClass: r.niccdcd ? parseInt(r.niccdcd, 10) : null
  })).filter(u => u.acres > 0);
  if (!units.length) throw Object.assign(new Error('No soil survey map units found inside the boundary'), { status: 404 });
  const total = units.reduce((s, u) => s + u.acres, 0);
  units.forEach(u => { u.percent = Math.round(u.acres / total * 1000) / 10; });

  // Dominant capability class: the class covering the most acres.
  const byClass = {};
  for (const u of units) if (u.capabilityClass) byClass[u.capabilityClass] = (byClass[u.capabilityClass] || 0) + u.acres;
  const dominantClass = Object.keys(byClass).sort((a, b) => byClass[b] - byClass[a])[0];

  const set = {
    'soil.mapUnits': units,
    'soil.capabilityClass': dominantClass ? parseInt(dominantClass, 10) : null,
    'soil.surveySource': 'USDA NRCS SSURGO (Soil Data Access)',
    'soil.surveyDate': new Date()
  };
  // Hand-entered soil type and class are kept.
  if (isBlank(cf.soil && cf.soil.type)) set['soil.type'] = units[0].name + ' (' + units[0].percent + '%)';
  if (isBlank(cf.soil && cf.soil.class) && dominantClass) {
    set['soil.class'] = 'Class ' + dominantClass + ' non-irrigated (' + Math.round(byClass[dominantClass] / total * 100) + '% of field)';
  }
  await CroppingField.updateOne({ _id: cf._id }, { $set: set }, { runValidators: true });
  return { field: cf.field, mapUnits: units, capabilityClass: set['soil.capabilityClass'] };
}

module.exports = { preview, apply, soilSurvey, soilSamplesFor, parseLegal, fieldNumber, COUNTY_BY_TR };
