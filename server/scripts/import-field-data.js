/**
 * Import field data from CSV files into the CroppingField collection.
 *
 * Usage:
 *   node server/scripts/import-field-data.js --crop-history path/to/crop-history.csv
 *   node server/scripts/import-field-data.js --field-details path/to/field-details.csv
 *   node server/scripts/import-field-data.js --soil-samples path/to/soil-samples.csv
 *   node server/scripts/import-field-data.js --all path/to/directory/
 *
 * The --all flag imports all three CSV types from a directory (looks for
 * crop-history.csv, field-details.csv, soil-samples.csv).
 *
 * CSV format is documented in docs/csv-import-instructions.md
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const CroppingField = require('../models/croppingField');

// Simple CSV parser (handles quoted fields with commas)
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function numOrNull(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// === IMPORT CROP HISTORY ===
async function importCropHistory(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(text);
  console.log(`\nParsed ${rows.length} crop history rows from ${path.basename(filePath)}`);

  let updated = 0;
  let notFound = 0;
  const missing = [];

  for (const row of rows) {
    const field = await CroppingField.findOne({ farm: row.farm, field: row.field });
    if (!field) {
      if (!missing.find(m => m.farm === row.farm && m.field === row.field)) {
        missing.push({ farm: row.farm, field: row.field });
      }
      notFound++;
      continue;
    }

    const year = parseInt(row.year);
    if (!year) continue;

    const entry = {
      year,
      crop: row.crop || '',
      variety: row.variety || '',
      yieldPerAcre: num(row.yieldPerAcre),
      pricePerBushel: num(row.pricePerBushel),
      costs: {
        seed: num(row.seed),
        fertilizer: num(row.fertilizer),
        chemicals: num(row.chemicals),
        cropInsurance: num(row.cropInsurance),
        fuelOil: num(row.fuelOil),
        repairs: num(row.repairs),
        customHire: num(row.customHire),
        landRent: num(row.landRent),
        dryingHauling: num(row.dryingHauling),
        taxes: num(row.taxes),
        misc: num(row.misc)
      },
      notes: row.notes || ''
    };

    // Calculate totals
    const c = entry.costs;
    entry.totalCost = c.seed + c.fertilizer + c.chemicals + c.cropInsurance +
      c.fuelOil + c.repairs + c.customHire + c.landRent + c.dryingHauling +
      c.taxes + c.misc;

    const acres = field.acres || 0;
    entry.grossRevenue = entry.yieldPerAcre * entry.pricePerBushel * acres;
    entry.netIncome = entry.grossRevenue - (entry.totalCost * acres);
    entry.profitPerAcre = (acres > 0) ? (entry.grossRevenue / acres) - entry.totalCost : 0;

    // Upsert: replace if same year exists, otherwise add
    const existingIdx = field.cropHistory.findIndex(h => h.year === year);
    if (existingIdx >= 0) {
      field.cropHistory[existingIdx] = { ...field.cropHistory[existingIdx].toObject(), ...entry };
    } else {
      field.cropHistory.push(entry);
    }

    field.cropHistory.sort((a, b) => b.year - a.year);

    // Also update the cropXXXX field if it exists
    const cropKey = `crop${year}`;
    if (field.schema.paths[cropKey] && entry.crop) {
      field[cropKey] = entry.crop;
    }

    await field.save();
    updated++;
  }

  console.log(`  Updated: ${updated} field-year records`);
  if (notFound > 0) {
    console.log(`  Not found: ${notFound} rows (field not in database)`);
    missing.forEach(m => console.log(`    - ${m.farm} / ${m.field}`));
  }
}

// === IMPORT FIELD DETAILS ===
async function importFieldDetails(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(text);
  console.log(`\nParsed ${rows.length} field detail rows from ${path.basename(filePath)}`);

  let updated = 0;
  let notFound = 0;

  for (const row of rows) {
    const field = await CroppingField.findOne({ farm: row.farm, field: row.field });
    if (!field) {
      console.log(`  Not found: ${row.farm} / ${row.field}`);
      notFound++;
      continue;
    }

    // Location
    if (row.county) field.county = row.county;

    // Soil
    if (row.soilType || row.soilClass) {
      if (!field.soil) field.soil = {};
      if (row.soilType) field.soil.type = row.soilType;
      if (row.soilClass) field.soil.class = row.soilClass;
    }

    // Lease
    if (row.leaseType) {
      field.lease = {
        type: row.leaseType,
        landlord: row.landlord || '',
        rentPerAcre: num(row.rentPerAcre),
        sharePercentage: num(row.sharePercentage)
      };
    }

    // Insurance
    if (row.insProvider || row.insType) {
      field.insurance = {
        provider: row.insProvider || '',
        type: row.insType || '',
        level: num(row.insLevel),
        guaranteedYield: num(row.insGuaranteedYield),
        guaranteedPrice: num(row.insGuaranteedPrice),
        premiumPerAcre: num(row.insPremiumPerAcre),
        subsidy: num(row.insSubsidy),
        netPremium: num(row.insNetPremium)
      };
    }

    // Taxes
    if (row.propertyTaxPerAcre || row.assessedValue) {
      field.taxes = {
        propertyTaxPerAcre: num(row.propertyTaxPerAcre),
        assessedValue: num(row.assessedValue),
        taxingAuthority: row.taxAuthority || ''
      };
    }

    // Notes
    if (row.notes) field.notes = row.notes;

    await field.save();
    updated++;
  }

  console.log(`  Updated: ${updated} fields`);
  if (notFound > 0) console.log(`  Not found: ${notFound} fields`);
}

// === IMPORT SOIL SAMPLES ===
async function importSoilSamples(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(text);
  console.log(`\nParsed ${rows.length} soil sample rows from ${path.basename(filePath)}`);

  let updated = 0;
  let notFound = 0;

  for (const row of rows) {
    const field = await CroppingField.findOne({ farm: row.farm, field: row.field });
    if (!field) {
      console.log(`  Not found: ${row.farm} / ${row.field}`);
      notFound++;
      continue;
    }

    if (!field.soil) field.soil = { samples: [] };
    if (!field.soil.samples) field.soil.samples = [];

    const sample = {
      date: row.date ? new Date(row.date) : null,
      depth: row.depth || '',
      ph: numOrNull(row.ph),
      nitrogen: numOrNull(row.nitrogen),
      phosphorus: numOrNull(row.phosphorus),
      potassium: numOrNull(row.potassium),
      sulfur: numOrNull(row.sulfur),
      zinc: numOrNull(row.zinc),
      iron: numOrNull(row.iron),
      organicMatter: numOrNull(row.organicMatter),
      cec: numOrNull(row.cec),
      salts: numOrNull(row.salts),
      notes: row.notes || ''
    };

    field.soil.samples.push(sample);
    field.soil.samples.sort((a, b) => new Date(b.date) - new Date(a.date));

    await field.save();
    updated++;
  }

  console.log(`  Updated: ${updated} soil samples`);
  if (notFound > 0) console.log(`  Not found: ${notFound} rows`);
}

// === MAIN ===
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage:');
    console.log('  node server/scripts/import-field-data.js --crop-history <file.csv>');
    console.log('  node server/scripts/import-field-data.js --field-details <file.csv>');
    console.log('  node server/scripts/import-field-data.js --soil-samples <file.csv>');
    console.log('  node server/scripts/import-field-data.js --all <directory/>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const flag = args[0];
  const filePath = args[1];

  try {
    if (flag === '--all') {
      const dir = filePath;
      const cropFile = path.join(dir, 'crop-history.csv');
      const detailsFile = path.join(dir, 'field-details.csv');
      const soilFile = path.join(dir, 'soil-samples.csv');

      if (fs.existsSync(cropFile)) await importCropHistory(cropFile);
      else console.log('No crop-history.csv found, skipping');

      if (fs.existsSync(detailsFile)) await importFieldDetails(detailsFile);
      else console.log('No field-details.csv found, skipping');

      if (fs.existsSync(soilFile)) await importSoilSamples(soilFile);
      else console.log('No soil-samples.csv found, skipping');

    } else if (flag === '--crop-history') {
      await importCropHistory(filePath);
    } else if (flag === '--field-details') {
      await importFieldDetails(filePath);
    } else if (flag === '--soil-samples') {
      await importSoilSamples(filePath);
    } else {
      console.log('Unknown flag:', flag);
      process.exit(1);
    }
  } catch (error) {
    console.error('Import error:', error);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main();
