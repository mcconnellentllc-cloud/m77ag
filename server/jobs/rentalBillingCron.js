const cron = require('node-cron');
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

/**
 * Automated Rental Billing Cron Jobs
 *
 * These jobs automate the rental billing process:
 * 1. Generate monthly invoices on the 1st of each month
 * 2. Send payment reminders daily
 * 3. Apply late fees on the 6th of each month
 */

// Job 1: Auto-generate monthly invoices
// Runs on the 1st of every month at 6:00 AM
const generateMonthlyInvoicesJob = cron.schedule('0 6 1 * *', async () => {
  console.log('Running auto-generate invoices job...');

  try {
    const response = await axios.post(`${API_BASE_URL}/billing/invoices/auto-generate`, {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

    console.log('Invoices generated successfully:', response.data);
  } catch (error) {
    console.error('Error generating invoices:', error.response?.data || error.message);
  }
}, {
  scheduled: false, // Don't start immediately
  timezone: "America/Denver" // Mountain Time
});

// Job 2: Send payment reminders
// Runs daily at 9:00 AM
const sendPaymentRemindersJob = cron.schedule('0 9 * * *', async () => {
  console.log('Running send payment reminders job...');

  try {
    const response = await axios.post(`${API_BASE_URL}/billing/send-reminders`);

    console.log('Payment reminders sent:', response.data);
  } catch (error) {
    console.error('Error sending reminders:', error.response?.data || error.message);
  }
}, {
  scheduled: false,
  timezone: "America/Denver"
});

// Job 3: Apply late fees
// Runs on the 6th of every month at 8:00 AM
const applyLateFeesJob = cron.schedule('0 8 6 * *', async () => {
  console.log('Running apply late fees job...');

  try {
    const response = await axios.post(`${API_BASE_URL}/billing/apply-late-fees`);

    console.log('Late fees applied:', response.data);
  } catch (error) {
    console.error('Error applying late fees:', error.response?.data || error.message);
  }
}, {
  scheduled: false,
  timezone: "America/Denver"
});

// Start all cron jobs
function startRentalBillingJobs() {
  console.log('Starting rental billing cron jobs...');

  generateMonthlyInvoicesJob.start();
  console.log('✓ Monthly invoice generation job started (1st of month at 6:00 AM MT)');

  sendPaymentRemindersJob.start();
  console.log('✓ Payment reminders job started (daily at 9:00 AM MT)');

  applyLateFeesJob.start();
  console.log('✓ Late fees job started (6th of month at 8:00 AM MT)');
}

// Stop all cron jobs
function stopRentalBillingJobs() {
  console.log('Stopping rental billing cron jobs...');

  generateMonthlyInvoicesJob.stop();
  sendPaymentRemindersJob.stop();
  applyLateFeesJob.stop();

  console.log('All rental billing cron jobs stopped');
}

// Manual trigger functions for testing
async function manualGenerateInvoices() {
  console.log('Manually triggering invoice generation...');
  try {
    const response = await axios.post(`${API_BASE_URL}/billing/invoices/auto-generate`, {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

async function manualSendReminders() {
  console.log('Manually triggering payment reminders...');
  try {
    const response = await axios.post(`${API_BASE_URL}/billing/send-reminders`);
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

async function manualApplyLateFees() {
  console.log('Manually triggering late fee application...');
  try {
    const response = await axios.post(`${API_BASE_URL}/billing/apply-late-fees`);
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  startRentalBillingJobs,
  stopRentalBillingJobs,
  manualGenerateInvoices,
  manualSendReminders,
  manualApplyLateFees
};

// If this file is run directly (for testing)
if (require.main === module) {
  console.log('Rental Billing Cron Jobs - Manual Testing');
  console.log('=========================================');
  console.log('');
  console.log('Available commands:');
  console.log('  npm run billing:generate  - Generate invoices for current month');
  console.log('  npm run billing:reminders - Send payment reminders');
  console.log('  npm run billing:late-fees - Apply late fees');
  console.log('');

  // You can uncomment one of these to test:
  // manualGenerateInvoices();
  // manualSendReminders();
  // manualApplyLateFees();
}
