/**
 * Update 6145R and 8320R tractor loan amounts
 * Splits $307,615.94 50-50 between the two tractors
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Equipment = require('../models/equipment');

const TOTAL_LOAN = 307615.94;
const SPLIT_AMOUNT = TOTAL_LOAN / 2; // $153,807.97

async function updateTractorLoans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update 6145R
    const result6145 = await Equipment.findOneAndUpdate(
      { title: /6145/i },
      {
        $set: {
          amountOwed: SPLIT_AMOUNT,
          hasLoan: true,
          lender: 'John Deere Financial',
          loanAccountNumber: '*9885'
        }
      },
      { new: true }
    );

    if (result6145) {
      console.log(`Updated 6145R: ${result6145.title}`);
      console.log(`  Amount Owed: $${SPLIT_AMOUNT.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    } else {
      console.log('6145R not found');
    }

    // Update 8320R
    const result8320 = await Equipment.findOneAndUpdate(
      { title: /8320/i },
      {
        $set: {
          amountOwed: SPLIT_AMOUNT,
          hasLoan: true,
          lender: 'John Deere Financial',
          loanAccountNumber: '*9885'
        }
      },
      { new: true }
    );

    if (result8320) {
      console.log(`Updated 8320R: ${result8320.title}`);
      console.log(`  Amount Owed: $${SPLIT_AMOUNT.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    } else {
      console.log('8320R not found');
    }

    console.log('\nSummary:');
    console.log(`  Total Loan: $${TOTAL_LOAN.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Each Tractor: $${SPLIT_AMOUNT.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateTractorLoans();
