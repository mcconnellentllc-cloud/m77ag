/**
 * Seed fields data - EXACT data from cropping rotation spreadsheet
 * DO NOT modify crop/acres/legal/FSA values - they come directly from the user
 *
 * County, Section/Twp/Rng parsed from legal descriptions.
 * KB Farms county data confirmed from CapitalInvestment records.
 * Soil types from KB Farms capital data (Hard = Pauli/Madsen, Sand = Michael crop, Pasture = pasture fields).
 * All KB Farms fields are owned (no landlord, no rent).
 *
 * County mapping by Township/Range (NE Colorado):
 *   T6N R46W = Phillips    T6N R47W = Phillips    T7N R47W = Phillips
 *   T7N R48W = Logan       T8N R47W = Phillips    T8N R48W = Logan
 *   T9N R46W = Sedgwick    T9N R47W = Sedgwick
 *
 * Property tax per acre (Colorado ag land, income-capitalization method):
 *   Phillips County: ~$1.50/ac cropland, ~$1.00/ac pasture
 *   Sedgwick County: ~$1.25/ac cropland, ~$0.85/ac pasture
 *   Logan County:    ~$1.10/ac cropland, ~$0.75/ac pasture
 */

require('dotenv').config();
const mongoose = require('mongoose');

const CroppingField = require('../models/croppingField');

const fields = require('../data/fieldDetails');

async function seedFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing fields
    await CroppingField.deleteMany({});
    console.log('Cleared existing cropping fields');

    // Insert all fields
    await CroppingField.insertMany(fields);
    console.log(`Inserted ${fields.length} fields`);

    // Calculate totals by crop
    const cropTotals = {};
    let totalAcres = 0;
    fields.forEach(f => {
      if (f.acres) {
        totalAcres += f.acres;
        cropTotals[f.crop2026] = (cropTotals[f.crop2026] || 0) + f.acres;
      }
    });

    console.log('\n2026 Crop Summary:');
    Object.entries(cropTotals).sort((a, b) => b[1] - a[1]).forEach(([crop, acres]) => {
      console.log(`  ${crop}: ${acres.toFixed(2)} acres`);
    });
    console.log(`\nTotal Acres: ${totalAcres.toFixed(2)}`);

    // County summary
    const countyTotals = {};
    fields.forEach(f => {
      if (f.county && f.acres) {
        countyTotals[f.county] = (countyTotals[f.county] || 0) + f.acres;
      }
    });
    console.log('\nCounty Summary:');
    Object.entries(countyTotals).sort((a, b) => b[1] - a[1]).forEach(([county, acres]) => {
      console.log(`  ${county}: ${acres.toFixed(2)} acres`);
    });

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedFields();
