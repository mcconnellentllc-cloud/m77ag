const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const controller = require('../controllers/landlordSummaryController');

// Staff see every landlord farm; a landlord sees only the farms linked to
// their login. Scoping is enforced in the controller.
router.get('/', authenticate, controller.getSummary);

// Portal access management: admin only.
router.get('/access', authenticate, isAdmin, controller.listAccess);
router.post('/access', authenticate, isAdmin, controller.grantAccess);
router.delete('/access/:farmId/:userId', authenticate, isAdmin, controller.revokeAccess);

module.exports = router;
