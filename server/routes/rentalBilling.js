const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/auth');
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
router.post('/billing/invoices/generate', adminOnly, generateMonthlyInvoice);
router.post('/billing/invoices/auto-generate', adminOnly, autoGenerateInvoices);

// Payment recording (admin only)
router.post('/billing/invoices/:invoiceId/payment', adminOnly, recordPayment);

// Invoice retrieval
router.get('/billing/invoices', adminOnly, getAllInvoices);
router.get('/billing/invoices/:id', adminOnly, getInvoiceById);

// Automated tasks (should be called by cron jobs)
router.post('/billing/apply-late-fees', adminOnly, applyLateFees);
router.post('/billing/send-reminders', adminOnly, sendPaymentReminders);

module.exports = router;
