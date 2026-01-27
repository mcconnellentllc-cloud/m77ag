/**
 * Real Estate Seed Script
 * Imports M77 AG land holdings into MongoDB
 */

const mongoose = require('mongoose');
require('dotenv').config();

const RealEstate = require('../models/realEstate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Property data based on available information
// Update with legal descriptions from 2025 Master Workbook
const propertyData = [
  {
    name: '1324 Property',
    propertyType: 'Mixed Use',
    county: 'Phillips County',
    state: 'CO',
    acres: 0, // Update with actual acres
    legalDescription: '', // Add from 2025 Master Workbook
    currentValue: 0, // Update with current value
    annualTaxes: 0, // Update with tax amount
    hasLoan: false,
    amountOwed: 0,
    owner: 'M77 AG',
    notes: 'Update with details from 2025 Master Workbook',
    forSale: false
  },
  {
    name: 'Neals Pasture',
    propertyType: 'Pasture',
    county: 'Phillips County',
    state: 'CO',
    acres: 0, // Update with actual acres
    legalDescription: '', // Add from 2025 Master Workbook
    currentValue: 0, // Update with current value
    annualTaxes: 0, // Update with tax amount
    hasLoan: false,
    amountOwed: 0,
    owner: 'M77 AG',
    notes: 'Update with details from 2025 Master Workbook',
    forSale: false
  },
  {
    name: 'Madsen Pasture',
    propertyType: 'Pasture',
    county: 'Phillips County',
    state: 'CO',
    acres: 0, // Update with actual acres
    legalDescription: '', // Add from 2025 Master Workbook
    currentValue: 0, // Update with current value
    annualTaxes: 0, // Update with tax amount
    hasLoan: false,
    amountOwed: 0,
    owner: 'M77 AG',
    notes: 'Update with details from 2025 Master Workbook',
    forSale: false
  },
  {
    name: 'Pauli Section',
    propertyType: 'Pasture',
    county: 'Phillips County',
    state: 'CO',
    acres: 640, // Typical section size
    legalDescription: '', // Add from 2025 Master Workbook
    currentValue: 0, // Update with current value
    annualTaxes: 0, // Update with tax amount
    hasLoan: true,
    amountOwed: 239634.21,
    lender: 'Bank',
    loanAccountNumber: '*9767',
    paymentAmount: 38583.17,
    paymentFrequency: 'semi-annual',
    nextPaymentDate: new Date('2026-03-01'),
    owner: 'M77 AG',
    notes: 'Loan payment due 03/01/2026',
    forSale: false
  },
  {
    name: 'Michael Section',
    propertyType: 'Pasture',
    county: 'Phillips County',
    state: 'CO',
    acres: 640, // Typical section size
    legalDescription: '', // Add from 2025 Master Workbook
    currentValue: 0, // Update with current value
    annualTaxes: 0, // Update with tax amount
    hasLoan: true,
    amountOwed: 319199.13,
    lender: 'Michael Ground',
    loanAccountNumber: '*9860',
    paymentAmount: 29502.43,
    paymentFrequency: 'semi-annual',
    nextPaymentDate: new Date('2026-11-01'),
    owner: 'M77 AG',
    notes: 'Loan payment due 11/01/2026',
    forSale: false
  }
];

async function seedRealEstate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    const existingCount = await RealEstate.countDocuments();
    console.log(`Existing properties count: ${existingCount}`);

    const forceImport = process.argv.includes('--force');

    if (existingCount > 0 && forceImport) {
      console.log('\n--force flag detected. Clearing existing properties...');
      await RealEstate.deleteMany({});
      console.log('Cleared existing property data.');
    } else if (existingCount > 0) {
      console.log('\nWARNING: There are existing properties in the database.');
      console.log('Use --force flag to clear existing data and reimport.');
      console.log('Proceeding to add properties (may create duplicates)...');
    }

    console.log(`\nImporting ${propertyData.length} properties...`);

    let imported = 0;
    let errors = 0;

    for (const item of propertyData) {
      try {
        const property = new RealEstate(item);
        await property.save();
        imported++;
        console.log(`  Added: ${item.name}`);
      } catch (err) {
        errors++;
        console.error(`  Error importing "${item.name}": ${err.message}`);
      }
    }

    console.log(`\nImport complete!`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Errors: ${errors}`);

    // Calculate summary
    const allProperties = await RealEstate.find();
    let totalValue = 0;
    let totalOwed = 0;
    let totalAcres = 0;

    allProperties.forEach(prop => {
      totalValue += prop.currentValue || 0;
      totalOwed += prop.amountOwed || 0;
      totalAcres += prop.acres || 0;
    });

    console.log(`\n=== Real Estate Summary ===`);
    console.log(`Total Properties: ${allProperties.length}`);
    console.log(`Total Acres: ${totalAcres.toLocaleString()}`);
    console.log(`Total Value: $${totalValue.toLocaleString()}`);
    console.log(`Total Owed: $${totalOwed.toLocaleString()}`);
    console.log(`Net Equity: $${(totalValue - totalOwed).toLocaleString()}`);

    console.log('\n*** IMPORTANT ***');
    console.log('Please update the following in the admin panel:');
    console.log('- Legal descriptions from 2025 Master Workbook');
    console.log('- Current property values');
    console.log('- Annual tax amounts');
    console.log('- Actual acreage for each property');

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

if (require.main === module) {
  seedRealEstate();
}

module.exports = { propertyData, seedRealEstate };
