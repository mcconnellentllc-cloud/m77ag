const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const controller = require('../controllers/seedCostShareController');

// Seed cost and landlord share data is financial: staff only.
router.use(authenticate, isStaff);

router.get('/', controller.listEntries);
router.post('/', controller.createEntry);
router.post('/prices', controller.setPrices);
router.post('/statements', controller.generateStatements);
router.put('/:id', controller.updateEntry);
router.delete('/:id', controller.deleteEntry);

module.exports = router;
