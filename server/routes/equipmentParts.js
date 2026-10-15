const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const c = require('../controllers/equipmentPartController');
const o = require('../controllers/partOrderController');

// Common parts list: staff only.
router.use(authenticate, isStaff);

// Vendors and orders come before /:id so they are not read as part ids.
router.get('/vendors', o.listVendors);
router.post('/vendors', o.createVendor);
router.put('/vendors/:id', o.updateVendor);
router.delete('/vendors/:id', o.removeVendor);

router.get('/orders', o.listOrders);
router.get('/orders/summary', o.summary);
router.post('/orders', o.createOrder);
router.put('/orders/:id', o.updateOrder);
router.delete('/orders/:id', o.removeOrder);

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
