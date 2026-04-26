const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, isStaff } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Dashboard and reports
router.get('/dashboard', isStaff, invoiceController.getDashboardStats);
router.get('/aging', isStaff, invoiceController.getAgingReport);
router.get('/revenue', isStaff, invoiceController.getRevenueSummary);

// CRUD operations
router.get('/', isStaff, invoiceController.getInvoices);
router.post('/', isStaff, invoiceController.createInvoice);
router.get('/:id', isStaff, invoiceController.getInvoice);
router.put('/:id', isStaff, invoiceController.updateInvoice);

// Invoice actions
router.post('/:id/payment', isStaff, invoiceController.recordPayment);
router.post('/:id/send', isStaff, invoiceController.sendInvoice);
router.post('/:id/cancel', isStaff, invoiceController.cancelInvoice);

module.exports = router;
