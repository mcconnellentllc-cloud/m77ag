const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const c = require('../controllers/fertilityStandardController');

// Fertility Standards sheet: staff only.
router.use(authenticate, isStaff);

router.get('/', c.list);
router.put('/prices', c.updatePrices);
router.put('/:key', c.update);
router.post('/:key/reset', c.reset);

module.exports = router;
