const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const controller = require('../controllers/fieldInsuranceController');

// Crop insurance and claim data is financial: staff only.
router.use(authenticate, isStaff);

router.get('/', controller.listEntries);
router.get('/claims/:claimId', controller.getClaim);
router.post('/claims/:claimId/attach', controller.attachClaimUnit);
router.put('/:id', controller.updateEntry);
router.delete('/:id', controller.deleteEntry);

module.exports = router;
