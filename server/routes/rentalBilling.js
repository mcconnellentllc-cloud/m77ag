const express = require('express');
const router = express.Router();
const {
  generateMonthlyInvoice,
  autoGenerateInvoices,
  recordPayment,
  getAllInvoices,
  getInvoiceById,
  applyLateFees,
  sendPaymentReminders
} = require('../controllers/rentalBillingController');

// Invoice generation routes (admin only in production)
router.post('/billing/invoices/generate', generateMonthlyInvoice);
router.post('/billing/invoices/auto-generate', autoGenerateInvoices);

// Payment recording (admin only)
router.post('/billing/invoices/:invoiceId/payment', recordPayment);

// Invoice retrieval
router.get('/billing/invoices', getAllInvoices);
router.get('/billing/invoices/:id', getInvoiceById);

// Automated tasks (should be called by cron jobs)
router.post('/billing/apply-late-fees', applyLateFees);
router.post('/billing/send-reminders', sendPaymentReminders);

module.exports = router;
