const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const ctrl = require('../controllers/m77FarmController');

router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.get);
router.post('/', authenticate, isStaff, ctrl.create);
router.put('/:id', authenticate, isStaff, ctrl.update);
router.delete('/:id', authenticate, isStaff, ctrl.remove);

module.exports = router;
