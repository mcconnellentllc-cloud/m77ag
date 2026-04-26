/**
 * 2026 Calves Seed Data
 * Adds 2026 calving records for cows 2318 and 2206
 * Run: node server/seeds/calves-2026.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Cattle = require('../models/cattle');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// 2026 calving records - cows that calved in 2026
const calvingRecords2026 = [
  {
    tagNumber: '2318',
    record: {
      year: 2026,
      hadCalf: true,
      calfSurvived: true,
      calfTag: '2318-C26',
      calfSex: 'heifer',
      calfBirthDate: new Date('2026-03-15'),
      notes: '2026 spring calf'
    }
  },
  {
    tagNumber: '2206',
    record: {
      year: 2026,
      hadCalf: true,
      calfSurvived: true,
      calfTag: '2206-C26',
      calfSex: 'heifer',
      calfBirthDate: new Date('2026-03-10'),
      notes: '2026 spring calf'
    }
  }
];

async function seedCalves2026() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const item of calvingRecords2026) {
      const cattle = await Cattle.findOne({ tagNumber: item.tagNumber });

      if (!cattle) {
        console.log(`  ⚠ Cow ${item.tagNumber} not found in database`);
        notFound++;
        continue;
      }

      // Initialize annualCalvingRecords if it doesn't exist
      if (!cattle.annualCalvingRecords) {
        cattle.annualCalvingRecords = [];
      }

      // Check if 2026 record already exists
      const existingIndex = cattle.annualCalvingRecords.findIndex(r => r.year === 2026);

      if (existingIndex >= 0) {
        // Update existing record
        cattle.annualCalvingRecords[existingIndex] = item.record;
        console.log(`  ✓ Updated 2026 calving record for cow ${item.tagNumber}`);
      } else {
        // Add new record
        cattle.annualCalvingRecords.push(item.record);
        console.log(`  ✓ Added 2026 calving record for cow ${item.tagNumber}`);
      }

      await cattle.save();
      updated++;
    }

    console.log('\n--- Seed Complete ---');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Not Found: ${notFound}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding 2026 calves:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedCalves2026();
}

module.exports = { calvingRecords2026, seedCalves2026 };
