const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const c = require('../controllers/customWorkController');

// Custom work billing: staff only.
router.use(authenticate, isStaff);

router.get('/customers', c.listCustomers);
router.post('/customers', c.createCustomer);
router.put('/customers/:id', c.updateCustomer);

router.get('/jobs', c.listJobs);
router.post('/jobs', c.createJob);
router.put('/jobs/:id', c.updateJob);
router.delete('/jobs/:id', c.deleteJob);

router.get('/rates', c.listRates);
router.post('/rates', c.saveRate);
router.delete('/rates/:id', c.deleteRate);

router.get('/invoices', c.listInvoices);
router.post('/invoices', c.createInvoice);
router.post('/invoices/:id/cancel', c.cancelInvoice);

module.exports = router;
