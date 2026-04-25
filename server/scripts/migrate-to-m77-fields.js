/**
 * One-time migration: legacy Field + CroppingField -> m77fields.
 *
 * Source collections are read-only. This script never writes back to them.
 * Idempotent: re-running upserts by (legacySource, legacyId) instead of duplicating.
 *
 * If a CroppingField record matches an already-migrated Field by case-insensitive
 * name, the CroppingField data is merged onto the existing M77Field record
 * (filling in county, crop2026, rotationGroup) instead of creating a duplicate.
 *
 * Usage:
 *   npm run migrate:m77fields              # live run
 *   DRY_RUN=1 npm run migrate:m77fields    # report only, no writes
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Field = require('../models/field');
const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

// ---- Mappers ----------------------------------------------------------------

function mapLeaseTypeToOwner(leaseType) {
  switch (leaseType) {
    case 'owned':       return 'm77';
    case 'cash-rent':   return 'landlord';
    case 'crop-share':  return 'shared';
    case 'flex-lease':  return 'shared';
    default:            return 'm77';
  }
}

function shareSplit(leaseType, sharePercentage) {
  // sharePercentage = landlord's percent on crop-share / flex.
  if (leaseType === 'crop-share' || leaseType === 'flex-lease') {
    const landlord = Number.isFinite(sharePercentage) ? sharePercentage : 0;
    return { m77: Math.max(0, 100 - landlord), landlord };
  }
  if (leaseType === 'cash-rent') return { m77: 100, landlord: 0 };
  return { m77: 100, landlord: 0 };
}

function mapStatus(s) {
  if (!s) return 'active';
  if (s === 'CRP') return 'retired';
  if (['active', 'fallow', 'retired'].includes(s)) return s;
  return 'active';
}

function fromField(doc) {
  const leaseType = doc.leaseTerms?.leaseType;
  const sharePct = doc.leaseTerms?.sharePercentage;
  const split = shareSplit(leaseType, sharePct);

  // Pick a 2026 crop from currentCrop or cropPlan.
  let crop2026 = '';
  if (doc.currentCrop?.year === 2026 && doc.currentCrop.cropType) {
    crop2026 = doc.currentCrop.cropType;
  } else if (Array.isArray(doc.cropPlan)) {
    const plan = doc.cropPlan.find(p => p.year === 2026);
    if (plan?.cropType) crop2026 = plan.cropType;
  }

  const out = {
    name: doc.fieldName,
    county: '',
    acres: doc.acres || 0,
    owner: mapLeaseTypeToOwner(leaseType),
    landlordName: doc.landlordName || '',
    m77SharePercent: split.m77,
    landlordSharePercent: split.landlord,
    irrigation: doc.irrigated ? 'pivot' : 'dryland',
    crop2026,
    rotationGroup: '',
    status: mapStatus(doc.status),
    notes: doc.notes || '',
    legacySource: 'Field',
    legacyId: doc._id
  };

  if (doc.boundary && doc.boundary.type === 'Polygon'
      && Array.isArray(doc.boundary.coordinates)
      && doc.boundary.coordinates.length > 0) {
    out.boundary = { type: 'Polygon', coordinates: doc.boundary.coordinates };
  }

  return out;
}

function fromCroppingField(doc) {
  const leaseType = doc.lease?.type;
  const sharePct = doc.lease?.sharePercentage;
  const split = shareSplit(leaseType, sharePct);

  return {
    name: doc.field,
    county: doc.county || '',
    acres: doc.acres || 0,
    owner: mapLeaseTypeToOwner(leaseType),
    landlordName: doc.lease?.landlord || '',
    m77SharePercent: split.m77,
    landlordSharePercent: split.landlord,
    irrigation: doc.soil?.irrigated ? 'pivot' : 'dryland',
    crop2026: doc.crop2026 || '',
    rotationGroup: doc.farm || '',
    status: 'active',
    notes: doc.notes || '',
    legacySource: 'CroppingField',
    legacyId: doc._id
  };
}

// ---- Migration --------------------------------------------------------------

function normName(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function migrateFields() {
  let created = 0;
  let updated = 0;

  const fields = await Field.find({}).lean();
  console.log(`  Found ${fields.length} legacy Field records`);

  for (const f of fields) {
    if (!f.fieldName) continue;
    const payload = fromField(f);

    if (DRY_RUN) { created++; continue; }

    const existing = await M77Field.findOne({ legacySource: 'Field', legacyId: f._id });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated++;
    } else {
      await M77Field.create(payload);
      created++;
    }
  }
  return { created, updated };
}

async function migrateCroppingFields() {
  let created = 0;
  let updated = 0;
  let mergedIntoField = 0;

  const cfs = await CroppingField.find({}).lean();
  console.log(`  Found ${cfs.length} legacy CroppingField records`);

  // Build a lookup of M77Field records that originated from Field, keyed by
  // normalized name. Used to merge CroppingField data into them when names match.
  const fromFieldByName = new Map();
  if (!DRY_RUN) {
    const existingFromField = await M77Field.find({ legacySource: 'Field' }).select(
      '_id name county crop2026 rotationGroup landlordName'
    );
    for (const m of existingFromField) {
      fromFieldByName.set(normName(m.name), m);
    }
  }

  for (const cf of cfs) {
    if (!cf.field) continue;
    const payload = fromCroppingField(cf);

    if (DRY_RUN) { created++; continue; }

    const alreadyMigrated = await M77Field.findOne({
      legacySource: 'CroppingField',
      legacyId: cf._id
    });
    if (alreadyMigrated) {
      Object.assign(alreadyMigrated, payload);
      await alreadyMigrated.save();
      updated++;
      continue;
    }

    // If a Field-origin M77Field exists with the same normalized name,
    // merge CroppingField fields onto it instead of duplicating.
    const sibling = fromFieldByName.get(normName(cf.field));
    if (sibling) {
      let changed = false;
      if (!sibling.county && payload.county) { sibling.county = payload.county; changed = true; }
      if (!sibling.crop2026 && payload.crop2026) { sibling.crop2026 = payload.crop2026; changed = true; }
      if (!sibling.rotationGroup && payload.rotationGroup) { sibling.rotationGroup = payload.rotationGroup; changed = true; }
      if (!sibling.landlordName && payload.landlordName) { sibling.landlordName = payload.landlordName; changed = true; }
      if (changed) {
        await sibling.save();
        mergedIntoField++;
      }
      continue;
    }

    await M77Field.create(payload);
    created++;
  }

  return { created, updated, mergedIntoField };
}

// ---- Main -------------------------------------------------------------------

(async () => {
  console.log('='.repeat(60));
  console.log('M77 Fields Migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`MongoDB: ${MONGODB_URI.split('@')[1] || MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const beforeField = await Field.countDocuments();
    const beforeCropping = await CroppingField.countDocuments();
    const beforeM77 = await M77Field.countDocuments();

    console.log('\nBefore counts:');
    console.log(`  Field          : ${beforeField}`);
    console.log(`  CroppingField  : ${beforeCropping}`);
    console.log(`  M77Field       : ${beforeM77}`);

    console.log('\nMigrating Field -> M77Field ...');
    const f = await migrateFields();
    console.log(`  created=${f.created} updated=${f.updated}`);

    console.log('\nMigrating CroppingField -> M77Field ...');
    const c = await migrateCroppingFields();
    console.log(`  created=${c.created} updated=${c.updated} merged-into-Field-row=${c.mergedIntoField}`);

    const afterField = await Field.countDocuments();
    const afterCropping = await CroppingField.countDocuments();
    const afterM77 = await M77Field.countDocuments();

    console.log('\nAfter counts:');
    console.log(`  Field          : ${afterField}  ${afterField === beforeField ? '(unchanged)' : '!!! CHANGED !!!'}`);
    console.log(`  CroppingField  : ${afterCropping}  ${afterCropping === beforeCropping ? '(unchanged)' : '!!! CHANGED !!!'}`);
    console.log(`  M77Field       : ${afterM77}  (was ${beforeM77})`);

    if (afterField !== beforeField || afterCropping !== beforeCropping) {
      console.error('\nWARNING: source collection counts changed. Investigate before trusting this run.');
      process.exitCode = 2;
    } else {
      console.log('\nDone. Source collections untouched.');
    }
  } catch (err) {
    console.error('\nMigration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected.');
  }
})();
