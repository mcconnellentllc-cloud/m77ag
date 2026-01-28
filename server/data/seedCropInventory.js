/**
 * Seed script for Crop Inventory - Bin Storage
 * Run with: node server/data/seedCropInventory.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CropInventory = require('../models/cropInventory');
const Farm = require('../models/farm');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

const binInventory = [
  {
    binName: 'North East Small Bin',
    binNumber: 'NE-SMALL',
    storageLocation: 'on-farm-bin',
    cropType: 'wheat', // Assuming wheat - can be changed
    currentQuantity: 10000,
    initialQuantity: 10000,
    year: 2025,
    quality: {
      moisture: 12.5,
      testWeight: 60
    },
    costBasis: {
      productionCostPerBushel: 4.25,
      storageCostPerBushel: 0.05,
      totalCostPerBushel: 4.30
    },
    slidingScale: {
      enabled: true,
      minimumPrice: 5.50,
      targetPrice: 7.00,
      tiers: [
        { pricePerBushel: 6.25, percentToSell: 25, triggerType: 'price-reaches', executed: false },
        { pricePerBushel: 6.75, percentToSell: 35, triggerType: 'price-reaches', executed: false },
        { pricePerBushel: 7.00, percentToSell: 40, triggerType: 'price-reaches', executed: false }
      ]
    }
  },
  {
    binName: 'South East Small Bin',
    binNumber: 'SE-SMALL',
    storageLocation: 'on-farm-bin',
    cropType: 'wheat', // Assuming wheat - can be changed
    currentQuantity: 10000,
    initialQuantity: 10000,
    year: 2025,
    quality: {
      moisture: 12.3,
      testWeight: 60
    },
    costBasis: {
      productionCostPerBushel: 4.25,
      storageCostPerBushel: 0.05,
      totalCostPerBushel: 4.30
    },
    slidingScale: {
      enabled: true,
      minimumPrice: 5.50,
      targetPrice: 7.00,
      tiers: [
        { pricePerBushel: 6.25, percentToSell: 25, triggerType: 'price-reaches', executed: false },
        { pricePerBushel: 6.75, percentToSell: 35, triggerType: 'price-reaches', executed: false },
        { pricePerBushel: 7.00, percentToSell: 40, triggerType: 'price-reaches', executed: false }
      ]
    }
  },
  {
    binName: 'South West Big Bin',
    binNumber: 'SW-BIG',
    storageLocation: 'on-farm-bin',
    cropType: 'milo',
    currentQuantity: 22000,
    initialQuantity: 22000,
    year: 2025,
    quality: {
      moisture: 13.0,
      testWeight: 56
    },
    costBasis: {
      productionCostPerBushel: 3.75,
      storageCostPerBushel: 0.05,
      totalCostPerBushel: 3.80
    },
    slidingScale: {
      enabled: true,
      minimumPrice: 4.00,
      targetPrice: 5.25,
      tiers: [
        { pricePerBushel: 4.75, percentToSell: 33, triggerType: 'price-reaches', executed: false },
        { pricePerBushel: 5.00, percentToSell: 33, triggerType: 'price-reaches', executed: false },
        { pricePerBushel: 5.25, percentToSell: 34, triggerType: 'price-reaches', executed: false }
      ]
    }
  }
];

async function seedCropInventory() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the default farm
    let farm = await Farm.findOne({ active: true });

    if (!farm) {
      console.log('No active farm found. Creating default farm...');
      farm = await Farm.create({
        farmName: 'M77 AG Operations',
        farmCode: 'M77AG',
        active: true
      });
    }

    console.log(`Using farm: ${farm.farmName} (${farm.farmCode})`);

    // Clear existing inventory for this year (optional - comment out to keep existing)
    // await CropInventory.deleteMany({ farm: farm._id, year: 2025 });
    // console.log('Cleared existing 2025 inventory');

    // Check for existing entries by bin number to avoid duplicates
    for (const bin of binInventory) {
      const existing = await CropInventory.findOne({
        farm: farm._id,
        binNumber: bin.binNumber,
        year: bin.year
      });

      if (existing) {
        // Update existing
        existing.currentQuantity = bin.currentQuantity;
        existing.initialQuantity = bin.initialQuantity;
        existing.cropType = bin.cropType;
        existing.quality = bin.quality;
        existing.costBasis = bin.costBasis;
        existing.slidingScale = bin.slidingScale;
        existing.status = 'active';

        // Calculate bushels for tiers
        existing.slidingScale.tiers = existing.slidingScale.tiers.map(tier => ({
          ...tier,
          bushelsToSell: Math.round((tier.percentToSell / 100) * existing.currentQuantity)
        }));

        await existing.save();
        console.log(`Updated: ${bin.binName} - ${bin.currentQuantity.toLocaleString()} bu ${bin.cropType}`);
      } else {
        // Create new
        const newInventory = new CropInventory({
          farm: farm._id,
          year: bin.year,
          cropType: bin.cropType,
          storageLocation: bin.storageLocation,
          binNumber: bin.binNumber,
          currentQuantity: bin.currentQuantity,
          initialQuantity: bin.initialQuantity,
          reservedQuantity: 0,
          availableQuantity: bin.currentQuantity,
          quality: bin.quality,
          costBasis: bin.costBasis,
          slidingScale: {
            ...bin.slidingScale,
            tiers: bin.slidingScale.tiers.map(tier => ({
              ...tier,
              bushelsToSell: Math.round((tier.percentToSell / 100) * bin.currentQuantity)
            }))
          },
          status: 'active',
          notes: bin.binName
        });

        await newInventory.save();
        console.log(`Created: ${bin.binName} - ${bin.currentQuantity.toLocaleString()} bu ${bin.cropType}`);
      }
    }

    // Display summary
    const summary = await CropInventory.aggregate([
      { $match: { farm: farm._id, year: 2025, status: 'active' } },
      { $group: {
        _id: '$cropType',
        totalBushels: { $sum: '$currentQuantity' },
        binCount: { $sum: 1 }
      }}
    ]);

    console.log('\n=== Inventory Summary ===');
    summary.forEach(s => {
      console.log(`${s._id.toUpperCase()}: ${s.totalBushels.toLocaleString()} bushels in ${s.binCount} bin(s)`);
    });

    const total = summary.reduce((sum, s) => sum + s.totalBushels, 0);
    console.log(`TOTAL: ${total.toLocaleString()} bushels`);

    console.log('\nCrop inventory seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding crop inventory:', error);
    process.exit(1);
  }
}

seedCropInventory();
