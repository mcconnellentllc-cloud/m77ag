const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const jdController = require('../controllers/jdController');

// All JD admin endpoints require admin role.
router.get('/auth/start', authenticate, isAdmin, jdController.startAuth);
router.get('/status',     authenticate, isAdmin, jdController.getStatus);
router.post('/disconnect', authenticate, isAdmin, jdController.disconnect);

// Sync + audit log
router.post('/sync',                authenticate, isAdmin, jdController.sync);
router.get('/sync/runs',            authenticate, isAdmin, jdController.listRuns);
router.get('/sync/runs/:runId',     authenticate, isAdmin, jdController.getRun);

// Review queue
router.get('/reviews',              authenticate, isAdmin, jdController.listReviews);
router.post('/reviews/:id/decide',  authenticate, isAdmin, jdController.decideReview);

module.exports = router;
