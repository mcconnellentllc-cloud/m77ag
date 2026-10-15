const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const controller = require('../controllers/fieldOperationController');

// Field records include harvest, entity splits and costs: staff only.
router.use(authenticate, isStaff);

router.get('/', controller.listEntries);
router.get('/imports/:importId', controller.getImport);
router.post('/imports/:importId', controller.applyImport);
router.get('/gaps', controller.listGaps);
router.post('/gaps/fill', controller.fillGaps);
router.post('/costs/apply', controller.applyCosts);
router.put('/:id/cost', controller.setCost);
router.delete('/:id', controller.deleteEntry);

module.exports = router;
