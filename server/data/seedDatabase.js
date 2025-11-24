const mongoose = require('mongoose');
const ChemicalProduct = require('../models/chemicalProduct');
const ChemicalProgram = require('../models/chemicalProgram');
const chemicalProducts = require('./seedChemicalProducts');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Drop-off points
const dropOffPoints = [
  {
    locationName: 'M77 AG',
    address: 'M77 AG Location, Northeast Colorado',
    deliveryFee: 0,
    notes: 'Primary location - No delivery fee'
  },
  {
    locationName: 'Mollohan Farms',
    address: 'Mollohan Farms, Northeast Colorado',
    deliveryFee: 0,
    notes: 'Secondary location - No delivery fee'
  }
];

// Default chemical programs
const defaultPrograms = [
  {
    programName: 'Basic Burndown Program',
    programType: 'basic',
    description: 'Essential burndown program for early season weed control',
    targetCrops: ['Corn', 'Soybeans', 'Wheat'],
    applicationTiming: 'Pre-plant burndown',
    season: 'Spring',
    availableDropOffPoints: dropOffPoints,
    paymentTerms: 'Payment due 10 days prior to delivery. Chemical sales at direct cost - no volume discounts.',
    minimumAcres: 50,
    active: true
  },
  {
    programName: 'Standard Post-Emerge Program',
    programType: 'standard',
    description: 'Comprehensive post-emergence weed control program',
    targetCrops: ['Corn', 'Soybeans'],
    applicationTiming: 'Post-emerge',
    season: 'Spring/Summer',
    availableDropOffPoints: dropOffPoints,
    paymentTerms: 'Payment due 10 days prior to delivery. Chemical sales at direct cost - no volume discounts.',
    minimumAcres: 50,
    active: true
  },
  {
    programName: 'Premium Full Season Program',
    programType: 'premium',
    description: 'Complete season-long weed control with residual protection',
    targetCrops: ['Corn', 'Soybeans'],
    applicationTiming: 'Pre-emerge + Post-emerge',
    season: 'Full Season',
    availableDropOffPoints: dropOffPoints,
    paymentTerms: 'Payment due 10 days prior to delivery. Chemical sales at direct cost - no volume discounts.',
    minimumAcres: 100,
    active: true
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Clear existing data (optional - comment out to preserve existing data)
    console.log('\nClearing existing chemical products and programs...');
    await ChemicalProduct.deleteMany({});
    await ChemicalProgram.deleteMany({});
    console.log('Cleared existing data');

    // Seed chemical products
    console.log('\nSeeding chemical products...');
    const createdProducts = await ChemicalProduct.insertMany(chemicalProducts);
    console.log(`Successfully created ${createdProducts.length} chemical products`);

    // Display products by category
    const categories = [...new Set(createdProducts.map(p => p.category))];
    categories.forEach(category => {
      const productsInCategory = createdProducts.filter(p => p.category === category);
      console.log(`  - ${category}: ${productsInCategory.length} products`);
    });

    // Seed chemical programs
    console.log('\nSeeding chemical programs...');
    const createdPrograms = await ChemicalProgram.insertMany(defaultPrograms);
    console.log(`Successfully created ${createdPrograms.length} chemical programs`);
    createdPrograms.forEach(program => {
      console.log(`  - ${program.programName} (${program.programType})`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`  Chemical Products: ${createdProducts.length}`);
    console.log(`  Chemical Programs: ${createdPrograms.length}`);
    console.log(`  Drop-off Points: ${dropOffPoints.length}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
