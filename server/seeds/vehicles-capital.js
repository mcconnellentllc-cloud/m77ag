/**
 * Vehicles Capital Investment Seed Data
 * Run: node server/seeds/vehicles-capital.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CapitalInvestment = require('../models/capitalInvestment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

const vehicleData = [
  // Farm Trucks
  {
    name: '2011 Ford F-250 (Grey)',
    type: 'vehicle',
    category: 'truck',
    description: 'Grey 2011 Ford F-250 work truck',
    acquisition: {
      notes: 'Farm work truck'
    },
    currentValue: {
      estimatedValue: 0
    },
    status: 'owned',
    notes: 'Personal/Farm vehicle'
  },
  {
    name: '2011 Dodge Ram 1500',
    type: 'vehicle',
    category: 'truck',
    description: '2011 Dodge Ram 1500 pickup truck',
    acquisition: {
      notes: 'Farm work truck'
    },
    currentValue: {
      estimatedValue: 0
    },
    status: 'owned',
    notes: 'Personal/Farm vehicle'
  },

  // Personal Vehicles
  {
    name: 'Cadillac Escalade',
    type: 'vehicle',
    category: 'car',
    description: 'Cadillac Escalade SUV',
    acquisition: {
      notes: 'Personal vehicle'
    },
    currentValue: {
      estimatedValue: 0
    },
    status: 'owned',
    notes: 'Personal vehicle'
  },
  {
    name: 'Toyota Camry',
    type: 'vehicle',
    category: 'car',
    description: 'Toyota Camry sedan',
    acquisition: {
      notes: 'Personal vehicle'
    },
    currentValue: {
      estimatedValue: 0
    },
    status: 'owned',
    notes: 'Personal vehicle - found in master workbook'
  },
  {
    name: 'Pontiac Trans Am',
    type: 'vehicle',
    category: 'car',
    description: 'Pontiac Trans Am',
    acquisition: {
      notes: 'Personal/Collector vehicle'
    },
    currentValue: {
      estimatedValue: 0
    },
    status: 'owned',
    notes: 'Personal vehicle'
  },

  // RV
  {
    name: 'Monaco Diplomat RV',
    type: 'vehicle',
    category: 'rv',
    description: 'Monaco Diplomat motorhome/RV',
    acquisition: {
      notes: 'Recreational vehicle'
    },
    currentValue: {
      estimatedValue: 0
    },
    status: 'owned',
    notes: 'Recreational vehicle'
  }
];

async function seedVehicles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if vehicle data already exists
    const existing = await CapitalInvestment.findOne({ type: 'vehicle' });
    if (existing) {
      console.log('Vehicle data already exists. Skipping seed.');
      console.log('To re-seed, first delete existing vehicle entries.');
      await mongoose.disconnect();
      return;
    }

    // Insert vehicle data
    const result = await CapitalInvestment.insertMany(vehicleData);
    console.log(`Successfully seeded ${result.length} vehicles:`);
    result.forEach(item => {
      console.log(`  - ${item.name}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding vehicle data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedVehicles();
}

module.exports = { vehicleData, seedVehicles };
