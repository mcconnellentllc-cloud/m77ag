/**
 * Script to close equipment items without working images
 * Run with: node server/scripts/close-items-no-images.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Equipment = require('../models/equipment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/m77ag';

// Items to close (remove from sale) - no pictures
const itemsToClose = [
  '1982 Chevrolet C70 Feed Truck',
  'Drago GT 12 Row Corn Head',
  'Demco Sidequest Tanks'
];

async function closeItems() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully\n');

    for (const title of itemsToClose) {
      const result = await Equipment.findOneAndUpdate(
        { title: title },
        {
          forSale: false,
          saleStatus: 'not-for-sale'
        },
        { new: true }
      );

      if (result) {
        console.log(`Closed: ${title}`);
        console.log(`  - forSale: ${result.forSale}`);
        console.log(`  - saleStatus: ${result.saleStatus}\n`);
      } else {
        console.log(`NOT FOUND: ${title}\n`);
      }
    }

    // Show remaining items for sale
    const forSale = await Equipment.find({ forSale: true, saleStatus: 'available' });
    console.log('=== Remaining Equipment For Sale ===');
    forSale.forEach(item => {
      const hasImages = item.images && item.images.length > 0;
      console.log(`- ${item.title} (${hasImages ? item.images.length + ' images' : 'NO IMAGES'})`);
    });
    console.log(`\nTotal for sale: ${forSale.length}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDone.');
    process.exit(0);
  }
}

closeItems();
