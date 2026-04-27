const M77Farm = require('../models/m77Farm');
const M77Field = require('../models/m77Field');

const FARM_WRITABLE = ['name', 'client', 'county', 'landlordUser', 'shareOverride', 'active', 'notes'];

function pick(body, allowed) {
  const out = {};
  for (const k of allowed) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// GET /api/m77-farms?client=<id>
// If `client` query param is present, scopes the response. Each farm includes
// fieldCount + totalAcres for the hierarchy UI.
exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.client) filter.client = req.query.client;

    const farms = await M77Farm.find(filter).populate('client', 'name type').sort({ name: 1 }).lean();

    const fieldAgg = await M77Field.aggregate([
      ...(req.query.client ? [{ $match: { client: new (require('mongoose').Types.ObjectId)(req.query.client) } }] : []),
      { $group: { _id: '$farm', count: { $sum: 1 }, acres: { $sum: '$acres' } } }
    ]);
    const byFarm = new Map(fieldAgg.map(r => [String(r._id), r]));

    const enriched = farms.map(f => ({
      ...f,
      fieldCount: (byFarm.get(String(f._id)) || {}).count || 0,
      totalAcres: (byFarm.get(String(f._id)) || {}).acres || 0
    }));
    res.json({ success: true, count: enriched.length, farms: enriched });
  } catch (err) {
    console.error('Error listing farms:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const farm = await M77Farm.findById(req.params.id).populate('client').lean();
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, farm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const farm = await M77Farm.create(pick(req.body, FARM_WRITABLE));
    res.status(201).json({ success: true, farm });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const farm = await M77Farm.findByIdAndUpdate(
      req.params.id,
      pick(req.body, FARM_WRITABLE),
      { new: true, runValidators: true }
    );
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true, farm });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const fieldCount = await M77Field.countDocuments({ farm: req.params.id });
    if (fieldCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete farm: ${fieldCount} field(s) still reference it.`
      });
    }
    const farm = await M77Farm.findByIdAndDelete(req.params.id);
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
