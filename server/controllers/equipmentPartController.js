const EquipmentPart = require('../models/equipmentPart');
const DEFAULTS = require('../data/equipmentPartsDefaults');

const FIELDS = ['category', 'name', 'spec', 'partNumber', 'fits', 'qtyNeeded', 'amazonUrl', 'otherUrl', 'notes'];

function pick(body) {
  const out = {};
  FIELDS.forEach(f => { if (body[f] !== undefined) out[f] = body[f]; });
  ['amazonUrl', 'otherUrl'].forEach(f => {
    if (out[f] && !/^https?:\/\//i.test(out[f])) out[f] = 'https://' + out[f];
  });
  if (out.qtyNeeded !== undefined) out.qtyNeeded = Math.max(0, parseInt(out.qtyNeeded, 10) || 0);
  return out;
}

// The list starts with the defaults the first time it is opened.
exports.list = async (req, res) => {
  try {
    if (await EquipmentPart.estimatedDocumentCount() === 0) await EquipmentPart.insertMany(DEFAULTS);
    const parts = await EquipmentPart.find().sort({ category: 1, name: 1 }).lean();
    res.json({ success: true, data: parts });
  } catch (error) {
    console.error('Error listing parts:', error);
    res.status(500).json({ success: false, message: 'Failed to load parts' });
  }
};

exports.create = async (req, res) => {
  try {
    const data = pick(req.body || {});
    if (!data.name) return res.status(400).json({ success: false, message: 'Part name is required' });
    const part = await EquipmentPart.create(data);
    res.status(201).json({ success: true, data: part, message: 'Part added' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const part = await EquipmentPart.findByIdAndUpdate(req.params.id, pick(req.body || {}), { new: true, runValidators: true });
    if (!part) return res.status(404).json({ success: false, message: 'Part not found' });
    res.json({ success: true, data: part, message: 'Part saved' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const part = await EquipmentPart.findByIdAndDelete(req.params.id);
    if (!part) return res.status(404).json({ success: false, message: 'Part not found' });
    res.json({ success: true, message: 'Part deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
