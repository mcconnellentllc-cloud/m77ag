const express = require('express');
const router = express.Router();
const { authenticate, isStaff } = require('../middleware/auth');
const FsaCropReport = require('../models/fsaCropReport');
const M77Field = require('../models/m77Field');

// FSA acreage reports carry producer shares: staff only.
router.use(authenticate, isStaff);

// GET /api/fsa-reports?programYear=  Every CLU line with the cards it is on.
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.programYear) filter.programYear = Number(req.query.programYear);
    const data = await FsaCropReport.find(filter).sort({ programYear: -1, farm: 1, tract: 1, clu: 1 }).lean();
    // Field Manager cards are CroppingField records; M77Field keeps the link in legacyId.
    const ids = new Set();
    for (const l of data) for (const c of [...(l.cards || []), ...(l.openOn || [])]) if (c.m77Field) ids.add(String(c.m77Field));
    const regs = await M77Field.find({ _id: { $in: [...ids] }, legacySource: 'CroppingField' }).select('legacyId').lean();
    const legacy = {};
    for (const r of regs) legacy[String(r._id)] = r.legacyId ? String(r.legacyId) : null;
    for (const l of data) for (const c of [...(l.cards || []), ...(l.openOn || [])]) c.croppingFieldId = c.m77Field ? legacy[String(c.m77Field)] || null : null;
    res.json({ success: true, data });
  } catch (err) {
    console.error('List FSA reports error:', err);
    res.status(500).json({ success: false, message: 'Failed to load the FSA reports' });
  }
});

module.exports = router;
