const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const jdController = require('../controllers/jdController');

// All JD admin endpoints require admin role.
router.get('/auth/start', authenticate, isAdmin, jdController.startAuth);
router.get('/status',     authenticate, isAdmin, jdController.getStatus);
router.post('/disconnect', authenticate, isAdmin, jdController.disconnect);

module.exports = router;
