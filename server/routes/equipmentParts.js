const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const c = require('../controllers/equipmentPartController');

// Common parts list: staff only.
router.use(authenticate, isStaff);

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
