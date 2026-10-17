const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const controller = require('../controllers/fieldLedgerController');

// Field income, expenses and input prices: staff only.
router.use(authenticate, isStaff);

router.get('/prices', controller.listPrices);
router.put('/prices', controller.setPrice);
router.get('/:id', controller.getLedger);

module.exports = router;
