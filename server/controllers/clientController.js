const Client = require('../models/client');
const M77Farm = require('../models/m77Farm');
const M77Field = require('../models/m77Field');

// Whitelist of fields the API allows on create/update — keeps the surface tight.
const CLIENT_WRITABLE = ['name', 'type', 'contact', 'defaultShare', 'users', 'active', 'notes'];

function pick(body, allowed) {
  const out = {};
  for (const k of allowed) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// GET /api/clients — also returns nested farm + field counts for the
// hierarchy UI in PR C-2.
exports.list = async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ name: 1 }).lean();

    // Aggregate farm count + field count per client in one pass.
    const farmCounts = await M77Farm.aggregate([
      { $group: { _id: '$client', count: { $sum: 1 } } }
    ]);
    const fieldCounts = await M77Field.aggregate([
      { $group: { _id: '$client', count: { $sum: 1 }, acres: { $sum: '$acres' } } }
    ]);
    const farmCountByClient = new Map(farmCounts.map(r => [String(r._id), r.count]));
    const fieldByClient = new Map(fieldCounts.map(r => [String(r._id), r]));

    const enriched = clients.map(c => ({
      ...c,
      farmCount: farmCountByClient.get(String(c._id)) || 0,
      fieldCount: (fieldByClient.get(String(c._id)) || {}).count || 0,
      totalAcres: (fieldByClient.get(String(c._id)) || {}).acres || 0
    }));

    res.json({ success: true, count: enriched.length, clients: enriched });
  } catch (err) {
    console.error('Error listing clients:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const client = await Client.create(pick(req.body, CLIENT_WRITABLE));
    res.status(201).json({ success: true, client });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      pick(req.body, CLIENT_WRITABLE),
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    // Refuse if any farm or field still references it.
    const [farms, fields] = await Promise.all([
      M77Farm.countDocuments({ client: req.params.id }),
      M77Field.countDocuments({ client: req.params.id })
    ]);
    if (farms > 0 || fields > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete client: ${farms} farm(s), ${fields} field(s) still reference it.`
      });
    }
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
