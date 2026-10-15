const mongoose = require('mongoose');
const PartVendor = require('../models/partVendor');
const PartOrder = require('../models/partOrder');
const EquipmentPart = require('../models/equipmentPart');
const Equipment = require('../models/equipment');
const SEED = require('../data/partOrdersDefaults');
const { addMissingDefaults } = require('./equipmentPartController');

const VENDOR_FIELDS = ['name', 'website', 'phone', 'accountEmail', 'notes'];
const ORDER_FIELDS = ['vendor', 'vendorName', 'orderDate', 'equipment', 'unitLabel', 'lines', 'shipping', 'tax', 'status', 'poNumber', 'invoiceNumber', 'paidDate', 'notes'];

function pick(body, fields) {
  const out = {};
  fields.forEach(f => { if (body[f] !== undefined) out[f] = body[f]; });
  return out;
}
const money = v => Math.max(0, Math.round((parseFloat(v) || 0) * 100) / 100);
const oid = v => (v && mongoose.Types.ObjectId.isValid(v) ? v : null);

function cleanOrder(data) {
  if (data.lines) {
    data.lines = (Array.isArray(data.lines) ? data.lines : [])
      .filter(l => l && String(l.name || '').trim())
      .map(l => ({ part: oid(l.part), name: String(l.name).trim(), partNumber: String(l.partNumber || '').trim(),
        qty: Math.max(0, parseInt(l.qty, 10) || 0), unitPrice: money(l.unitPrice), packOf: Math.max(1, parseInt(l.packOf, 10) || 1) }));
  }
  ['shipping', 'tax'].forEach(f => { if (data[f] !== undefined) data[f] = money(data[f]); });
  if (data.vendor !== undefined) data.vendor = oid(data.vendor);
  if (data.equipment !== undefined) data.equipment = oid(data.equipment);
  if (data.paidDate === '') data.paidDate = null;
  return data;
}

// Add starting vendors and orders not yet saved. A deleted seeded record stays deleted.
async function ensureSeeds() {
  await addMissingDefaults(); // orders link to starting parts
  for (const v of SEED.vendors) {
    if (await PartVendor.exists({ seedKey: v.seedKey })) continue;
    try { await PartVendor.create(v); } catch (e) { if (e.code !== 11000) throw e; }
  }
  for (const o of SEED.orders) {
    if (await PartOrder.exists({ seedKey: o.seedKey })) continue;
    const vendor = await PartVendor.findOne({ seedKey: o.vendorKey }).lean();
    const unit = o.serial ? await Equipment.findOne({ $or: [{ serialNumber: o.serial }, { vin: o.serial }] }, { _id: 1 }).lean() : null;
    const lines = [];
    for (const l of o.lines) {
      const part = l.partKey ? await EquipmentPart.findOne({ seedKey: l.partKey }, { _id: 1 }).lean() : null;
      lines.push({ part: part ? part._id : null, name: l.name, partNumber: l.partNumber, qty: l.qty, unitPrice: l.unitPrice, packOf: l.packOf || 1 });
    }
    try {
      await PartOrder.create({
        seedKey: o.seedKey, vendor: vendor ? vendor._id : null, vendorName: vendor ? vendor.name : '',
        orderDate: new Date(o.orderDate + 'T12:00:00Z'), equipment: unit ? unit._id : null, unitLabel: o.unitLabel,
        lines, shipping: o.shipping, tax: o.tax || 0, status: o.status, notes: o.notes,
        invoiceNumber: o.invoiceNumber, paidDate: o.paidDate ? new Date(o.paidDate) : null
      });
    } catch (e) { if (e.code !== 11000) throw e; }
  }
}

// Receiving an order takes its quantities off each part's "needed now", once.
async function applyReceived(order) {
  if (order.status !== 'received' || order.receivedApplied) return;
  for (const l of order.lines) {
    if (!l.part || !l.qty) continue;
    const part = await EquipmentPart.findById(l.part);
    if (!part) continue;
    part.qtyNeeded = Math.max(0, (part.qtyNeeded || 0) - l.qty * (l.packOf || 1));
    await part.save();
  }
  order.receivedApplied = true;
  await order.save();
}

function fail(res, error, status = 400) {
  console.error('Parts order error:', error.message);
  res.status(status).json({ success: false, message: error.message });
}

exports.listVendors = async (req, res) => {
  try {
    await ensureSeeds();
    res.json({ success: true, data: await PartVendor.find({ deleted: { $ne: true } }).sort({ name: 1 }).lean() });
  } catch (e) { fail(res, e, 500); }
};

exports.createVendor = async (req, res) => {
  try {
    const data = pick(req.body || {}, VENDOR_FIELDS);
    if (!data.name) return res.status(400).json({ success: false, message: 'Vendor name is required' });
    res.status(201).json({ success: true, data: await PartVendor.create(data), message: 'Vendor added' });
  } catch (e) { fail(res, e); }
};

exports.updateVendor = async (req, res) => {
  try {
    const v = await PartVendor.findByIdAndUpdate(req.params.id, pick(req.body || {}, VENDOR_FIELDS), { new: true, runValidators: true });
    if (!v) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: v, message: 'Vendor saved' });
  } catch (e) { fail(res, e); }
};

exports.removeVendor = async (req, res) => {
  try {
    const v = await PartVendor.findById(req.params.id);
    if (!v) return res.status(404).json({ success: false, message: 'Vendor not found' });
    if (v.seedKey) { v.deleted = true; await v.save(); } else await v.deleteOne();
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (e) { fail(res, e); }
};

exports.listOrders = async (req, res) => {
  try {
    await ensureSeeds();
    const q = { deleted: { $ne: true } };
    if (req.query.equipment) {
      if (!mongoose.Types.ObjectId.isValid(req.query.equipment)) return res.json({ success: true, data: [] });
      q.equipment = req.query.equipment;
    }
    res.json({ success: true, data: await PartOrder.find(q).sort({ orderDate: -1, createdAt: -1 }).lean() });
  } catch (e) { fail(res, e, 500); }
};

// Spend per unit, excluding cancelled orders.
exports.summary = async (req, res) => {
  try {
    await ensureSeeds();
    const rows = await PartOrder.aggregate([
      { $match: { deleted: { $ne: true }, status: { $ne: 'cancelled' }, equipment: { $ne: null } } },
      { $group: { _id: '$equipment', total: { $sum: '$total' }, orders: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: rows.map(r => ({ equipment: r._id, total: Math.round(r.total * 100) / 100, orders: r.orders })) });
  } catch (e) { fail(res, e, 500); }
};

exports.createOrder = async (req, res) => {
  try {
    const data = cleanOrder(pick(req.body || {}, ORDER_FIELDS));
    if (!data.lines || !data.lines.length) return res.status(400).json({ success: false, message: 'Add at least one item' });
    if (data.vendor && !data.vendorName) {
      const v = await PartVendor.findById(data.vendor).lean();
      if (v) data.vendorName = v.name;
    }
    const order = await PartOrder.create(data);
    await applyReceived(order);
    res.status(201).json({ success: true, data: order, message: 'Order added' });
  } catch (e) { fail(res, e); }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await PartOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const data = cleanOrder(pick(req.body || {}, ORDER_FIELDS));
    if (data.vendor) {
      const v = await PartVendor.findById(data.vendor).lean();
      if (v) data.vendorName = v.name;
    }
    order.set(data);
    await order.save();
    await applyReceived(order);
    res.json({ success: true, data: order, message: 'Order saved' });
  } catch (e) { fail(res, e); }
};

exports.removeOrder = async (req, res) => {
  try {
    const order = await PartOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.seedKey) { order.deleted = true; await order.save(); } else await order.deleteOne();
    res.json({ success: true, message: 'Order deleted' });
  } catch (e) { fail(res, e); }
};
