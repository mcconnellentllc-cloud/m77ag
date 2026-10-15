const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const rates2026 = require('../data/fieldOperationRates2026');

// Field operation rate list (85% of the ISU/CSU midpoint average): staff only.
router.get('/', authenticate, isStaff, (req, res) => {
  res.json({ success: true, data: rates2026 });
});

module.exports = router;
