/**
 * Vehicles Capital Investment Seed Data
 * Run: node server/seeds/vehicles-capital.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CapitalInvestment = require('../models/capitalInvestment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

const vehicleData = [
  // Farm Trucks - Combined loan account *9803
  {
    name: '2011 Ford F-250 (Grey)',
    type: 'vehicle',
    category: 'truck',
    description: 'Grey 2011 Ford F-250 work truck',
    acquisition: {
      notes: 'Farm work truck'
    },
    currentValue: {
      estimatedValue: 20000
    },
    loans: [
      {
        lender: 'Bank (Account *9803 - Pickups)',
        originalAmount: 0,
        currentBalance: 11266.57,  // Half of $22,533.13 total
        interestRate: 0,
        paymentAmount: 5973.43,  // Half of $11,946.85
        paymentFrequency: 'annual',
        nextPaymentDate: new Date('2026-09-15'),
        notes: 'Pickups loan (shared) - total $22,533.13, payment $11,946.85 due 09/15/2026'
      }
    ],
    status: 'owned',
    notes: 'Personal/Farm vehicle - Loan account *9803'
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
      estimatedValue: 20000
    },
    loans: [
      {
        lender: 'Bank (Account *9803 - Pickups)',
        originalAmount: 0,
        currentBalance: 11266.56,  // Half of $22,533.13 total
        interestRate: 0,
        paymentAmount: 5973.42,  // Half of $11,946.85
        paymentFrequency: 'annual',
        nextPaymentDate: new Date('2026-09-15'),
        notes: 'Pickups loan (shared) - total $22,533.13, payment $11,946.85 due 09/15/2026'
      }
    ],
    status: 'owned',
    notes: 'Personal/Farm vehicle - Loan account *9803'
  },

  // Personal Vehicles
  {
    name: 'Cadillac Escalade',
    type: 'vehicle',
    category: 'car',
    description: 'Cadillac Escalade SUV',
    vehicleDetails: {
      make: 'Cadillac',
      model: 'Escalade',
      mileage: 104000
    },
    acquisition: {
      notes: 'Personal vehicle'
    },
    currentValue: {
      estimatedValue: 35000
    },
    status: 'owned',
    notes: 'Personal vehicle - 104,000 miles'
  },
  {
    name: 'Toyota Camry',
    type: 'vehicle',
    category: 'car',
    description: "Brandi's Grey Camry",
    vehicleDetails: {
      make: 'Toyota',
      model: 'Camry',
      color: 'Grey'
    },
    acquisition: {
      notes: 'Personal vehicle'
    },
    currentValue: {
      estimatedValue: 15000
    },
    status: 'owned',
    notes: 'Personal vehicle'
  },
  {
    name: 'Pontiac Trans Am',
    type: 'vehicle',
    category: 'car',
    description: '1979 Pontiac Trans Am',
    vehicleDetails: {
      year: 1979,
      make: 'Pontiac',
      model: 'Trans AM',
      vin: '2W87K9L155721',
      mileage: 65000
    },
    acquisition: {
      purchasePrice: 6753,
      notes: 'Classic/Collector vehicle'
    },
    currentValue: {
      estimatedValue: 7000
    },
    status: 'owned',
    notes: 'Personal vehicle - Unit #57, Title: 37E061442'
  },

  // RV
  {
    name: 'Monaco Diplomat RV',
    type: 'vehicle',
    category: 'rv',
    description: '2001 Roadmaster Diplomat RV',
    vehicleDetails: {
      year: 2001,
      make: 'Roadmaster',
      model: 'Diplomat',
      vin: '1RF12051312013422',
      mileage: 92000
    },
    acquisition: {
      purchasePrice: 37878,
      notes: 'Recreational vehicle'
    },
    currentValue: {
      estimatedValue: 37500
    },
    loans: [
      {
        lender: 'RV Loan',
        currentBalance: 28274.95,
        notes: 'Unit #58'
      }
    ],
    status: 'owned',
    notes: 'Recreational vehicle - Unit #58'
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
