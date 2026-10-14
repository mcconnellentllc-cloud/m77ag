const mongoose = require('mongoose');
const Client = require('../models/client');
const M77Farm = require('../models/m77Farm');
const M77Field = require('../models/m77Field');
const CustomWork = require('../models/customWork');
const CustomRate = require('../models/customRate');
const Invoice = require('../models/invoice');

const SERVICE_LABELS = {
  drilling: 'Drilling', planting: 'Planting', spraying: 'Spraying', fertilizer: 'Fertilizer application',
  tillage: 'Tillage', harvesting: 'Harvesting', trucking: 'Trucking', other: 'Custom work'
};
// Invoice line category for each service.
const SERVICE_CATEGORY = {
  drilling: 'planting', planting: 'planting', spraying: 'spraying', fertilizer: 'custom_farming',
  tillage: 'custom_farming', harvesting: 'harvesting', trucking: 'trucking', other: 'custom_farming'
};
const JOB_WRITABLE = ['date', 'cropYear', 'service', 'description', 'm77Field', 'location', 'acres', 'ratePerAcre', 'products', 'interestCarryPct', 'notes'];
const TERMS_DAYS = { due_on_receipt: 0, net_10: 10, net_15: 15, net_30: 30, net_60: 60, net_90: 90 };

function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}
function pick(body, allowed) {
  const out = {};
  for (const k of allowed) if (body[k] !== undefined) out[k] = body[k];
  return out;
}
function validId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

async function customFarm(id) {
  if (!validId(id)) return null;
  const farm = await M77Farm.findById(id);
  return farm && farm.type === 'custom' ? farm : null;
}

// ---------- Customers ----------

// GET /api/custom-work/customers?cropYear=
exports.listCustomers = async (req, res) => {
  try {
    const cropYear = parseInt(req.query.cropYear, 10) || null;
    const farms = await M77Farm.find({ type: 'custom' }).sort({ name: 1 }).lean();
    const ids = farms.map(f => f._id);
    const [fields, jobs, invoices] = await Promise.all([
      M77Field.find({ farm: { $in: ids } }).select('name acres farm').sort({ name: 1 }).lean(),
      CustomWork.find({ customer: { $in: ids }, ...(cropYear ? { cropYear } : {}) }),
      Invoice.find({ type: 'custom_work', m77Farm: { $in: ids }, status: { $ne: 'cancelled' } })
        .select('m77Farm total amountPaid balanceDue status').lean()
    ]);
    const data = farms.map(f => {
      const mine = jobs.filter(j => String(j.customer) === String(f._id));
      const acresByService = {};
      for (const j of mine) acresByService[j.service] = round2((acresByService[j.service] || 0) + j.acres);
      const inv = invoices.filter(i => String(i.m77Farm) === String(f._id));
      return {
        id: f._id,
        name: f.name,
        billingContact: f.billingContact || {},
        notes: f.notes,
        active: f.active !== false,
        fields: fields.filter(x => String(x.farm) === String(f._id)).map(x => ({ id: x._id, name: x.name, acres: x.acres })),
        totals: {
          jobs: mine.length,
          acres: round2(mine.reduce((s, j) => s + j.acres, 0)),
          acresByService,
          unbilled: round2(mine.filter(j => !j.invoice).reduce((s, j) => s + j.total, 0)),
          billed: round2(mine.filter(j => j.invoice).reduce((s, j) => s + j.total, 0)),
          // Balance is across all years: what this customer owes today.
          invoiced: round2(inv.reduce((s, i) => s + (i.total || 0), 0)),
          paid: round2(inv.reduce((s, i) => s + (i.amountPaid || 0), 0)),
          balanceDue: round2(inv.reduce((s, i) => s + (i.balanceDue || 0), 0))
        }
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    console.error('List custom customers error:', err);
    res.status(500).json({ success: false, message: 'Failed to load customers' });
  }
};

// POST /api/custom-work/customers { name, billingContact }
exports.createCustomer = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Customer name is required' });
    let client = await Client.findOne({ type: 'custom' }).sort({ createdAt: 1 });
    if (!client) client = await Client.create({ name: 'Custom', type: 'custom', contact: { name: 'Custom (no portal)' } });
    const exists = await M77Farm.findOne({ client: client._id, name });
    if (exists) return res.status(409).json({ success: false, message: `${name} already exists` });
    const farm = await M77Farm.create({
      name, client: client._id, landlordName: name, type: 'custom', defaultShare: 0,
      billingContact: pick(req.body.billingContact || {}, ['name', 'email', 'phone', 'address'])
    });
    res.status(201).json({ success: true, data: { id: farm._id }, message: `${name} added` });
  } catch (err) {
    console.error('Create custom customer error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/custom-work/customers/:id { billingContact, notes }
exports.updateCustomer = async (req, res) => {
  try {
    const farm = await customFarm(req.params.id);
    if (!farm) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (req.body.billingContact) farm.billingContact = pick(req.body.billingContact, ['name', 'email', 'phone', 'address']);
    if (req.body.notes !== undefined) farm.notes = req.body.notes;
    await farm.save();
    res.json({ success: true, message: `${farm.name} updated` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ---------- Jobs ----------

function jobJson(j) {
  const o = j.toJSON();
  o.products = (j.products || []).map(p => ({
    ...p.toObject ? p.toObject() : p,
    unitPrice: j.productUnitPrice(p),
    amount: round2(p.quantity * j.productUnitPrice(p))
  }));
  return o;
}

// GET /api/custom-work/jobs?customer=&cropYear=&status=unbilled|billed
exports.listJobs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer) {
      if (!validId(req.query.customer)) return res.status(400).json({ success: false, message: 'Invalid customer' });
      filter.customer = req.query.customer;
    }
    if (req.query.cropYear) filter.cropYear = parseInt(req.query.cropYear, 10);
    if (req.query.status === 'unbilled') filter.invoice = null;
    if (req.query.status === 'billed') filter.invoice = { $ne: null };
    const jobs = await CustomWork.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: jobs.map(jobJson) });
  } catch (err) {
    console.error('List custom jobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to load jobs' });
  }
};

async function prepareJob(body, existing) {
  const data = pick(body, JOB_WRITABLE);
  const customerId = body.customer !== undefined ? body.customer : existing && existing.customer;
  const farm = await customFarm(customerId);
  if (!farm) throw Object.assign(new Error('Pick a custom customer'), { status: 400 });
  data.customer = farm._id;
  data.customerName = farm.name;
  if (data.m77Field === '' || data.m77Field === undefined && !existing) data.m77Field = null;
  if (data.m77Field) {
    if (!validId(data.m77Field)) throw Object.assign(new Error('Invalid field'), { status: 400 });
    const field = await M77Field.findById(data.m77Field).select('name farm');
    if (!field || String(field.farm) !== String(farm._id)) {
      throw Object.assign(new Error('That field does not belong to this customer'), { status: 400 });
    }
    if (!data.location) data.location = field.name;
  }
  if (Array.isArray(data.products)) {
    data.products = data.products.filter(p => p && String(p.name || '').trim());
  }
  return data;
}

// POST /api/custom-work/jobs
exports.createJob = async (req, res) => {
  try {
    const data = await prepareJob(req.body, null);
    const job = await CustomWork.create({ ...data, createdBy: req.userId });
    res.status(201).json({ success: true, data: jobJson(job), message: 'Job saved' });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
};

// PUT /api/custom-work/jobs/:id  (unbilled jobs only)
exports.updateJob = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const job = await CustomWork.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.invoice) {
      return res.status(409).json({ success: false, message: `Job is on invoice ${job.invoiceNumber}. Cancel the invoice to edit it.` });
    }
    const data = await prepareJob(req.body, job);
    job.set(data);
    await job.save();
    res.json({ success: true, data: jobJson(job), message: 'Job updated' });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
};

// DELETE /api/custom-work/jobs/:id  (unbilled jobs only)
exports.deleteJob = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const job = await CustomWork.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.invoice) {
      return res.status(409).json({ success: false, message: `Job is on invoice ${job.invoiceNumber}. Cancel the invoice first.` });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
};

// ---------- Rates ----------

// GET /api/custom-work/rates?cropYear=
exports.listRates = async (req, res) => {
  try {
    const filter = req.query.cropYear ? { cropYear: parseInt(req.query.cropYear, 10) } : {};
    const rates = await CustomRate.find(filter).sort({ cropYear: -1, service: 1, description: 1 }).lean();
    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load rates' });
  }
};

// POST /api/custom-work/rates { cropYear, service, description, ratePerAcre, notes }
// Adds a rate, or updates the one with the same year, service and description.
exports.saveRate = async (req, res) => {
  try {
    const cropYear = parseInt(req.body.cropYear, 10);
    const service = String(req.body.service || '');
    const ratePerAcre = Number(req.body.ratePerAcre);
    if (!cropYear || !CustomWork.SERVICES.includes(service) || !(ratePerAcre >= 0)) {
      return res.status(400).json({ success: false, message: 'Crop year, service and rate are required' });
    }
    const description = String(req.body.description || '').trim();
    const rate = await CustomRate.findOneAndUpdate(
      { cropYear, service, description },
      { cropYear, service, description, ratePerAcre, notes: req.body.notes },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: rate, message: 'Rate saved' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/custom-work/rates/:id
exports.deleteRate = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    await CustomRate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rate deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete rate' });
  }
};

// ---------- Invoices ----------

// GET /api/custom-work/invoices?customer=
exports.listInvoices = async (req, res) => {
  try {
    const farms = await M77Farm.find({ type: 'custom' }).select('_id').lean();
    const filter = { type: 'custom_work', m77Farm: { $in: farms.map(f => f._id) } };
    if (req.query.customer) {
      if (!validId(req.query.customer)) return res.status(400).json({ success: false, message: 'Invalid customer' });
      filter.m77Farm = req.query.customer;
    }
    const invoices = await Invoice.find(filter).sort({ issueDate: -1, invoiceNumber: -1 }).lean();
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load invoices' });
  }
};

// POST /api/custom-work/invoices { jobIds, terms, issueDate, notes }
// Bills the chosen unbilled jobs for one customer on one invoice.
exports.createInvoice = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.jobIds) ? req.body.jobIds.filter(validId) : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Pick at least one job' });
    const jobs = await CustomWork.find({ _id: { $in: ids } }).sort({ date: 1 });
    if (jobs.length !== ids.length) return res.status(404).json({ success: false, message: 'One or more jobs were not found' });
    const billed = jobs.filter(j => j.invoice);
    if (billed.length) {
      return res.status(409).json({ success: false, message: `Already billed on ${[...new Set(billed.map(j => j.invoiceNumber))].join(', ')}` });
    }
    const customerIds = [...new Set(jobs.map(j => String(j.customer)))];
    if (customerIds.length !== 1) return res.status(400).json({ success: false, message: 'All jobs on an invoice must be for the same customer' });
    const farm = await customFarm(customerIds[0]);
    if (!farm) return res.status(404).json({ success: false, message: 'Customer not found' });

    const terms = TERMS_DAYS[req.body.terms] !== undefined ? req.body.terms : 'net_30';
    const issueDate = req.body.issueDate ? new Date(req.body.issueDate) : new Date();
    if (isNaN(issueDate)) return res.status(400).json({ success: false, message: 'Invalid invoice date' });
    const dueDate = new Date(issueDate.getTime() + TERMS_DAYS[terms] * 86400000);

    const items = [];
    for (const j of jobs) {
      const label = (j.description || SERVICE_LABELS[j.service]) + ', ' + j.location + ', ' + fmtDate(j.date);
      items.push({
        description: label,
        category: SERVICE_CATEGORY[j.service],
        quantity: j.acres,
        unit: 'acre',
        unitPrice: j.ratePerAcre,
        amount: j.serviceAmount,
        m77Field: j.m77Field || undefined,
        acres: j.acres,
        cropYear: j.cropYear
      });
      for (const p of j.products || []) {
        const unitPrice = j.productUnitPrice(p);
        items.push({
          description: p.name + ', ' + j.location + (j.interestCarryPct ? ' (retail plus ' + j.interestCarryPct + '% interest carry)' : ''),
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          unitPrice,
          amount: round2(p.quantity * unitPrice),
          m77Field: j.m77Field || undefined,
          cropYear: j.cropYear
        });
      }
    }
    const subtotal = round2(items.reduce((s, i) => s + i.amount, 0));
    const contact = farm.billingContact || {};
    const invoice = await Invoice.create({
      invoiceNumber: await Invoice.generateInvoiceNumber('CW'),
      type: 'custom_work',
      status: 'sent',
      to: { name: contact.name || farm.name, company: farm.name, address: contact.address, phone: contact.phone, email: contact.email },
      items,
      subtotal,
      total: subtotal,
      balanceDue: subtotal,
      issueDate,
      dueDate,
      terms,
      m77Farm: farm._id,
      notes: req.body.notes,
      createdBy: req.userId
    });
    await CustomWork.updateMany({ _id: { $in: jobs.map(j => j._id) }, invoice: null },
      { $set: { invoice: invoice._id, invoiceNumber: invoice.invoiceNumber } });
    res.status(201).json({ success: true, data: invoice, message: `Invoice ${invoice.invoiceNumber} created for ${farm.name}` });
  } catch (err) {
    console.error('Create custom invoice error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/custom-work/invoices/:id/cancel
// Cancels an unpaid invoice and returns its jobs to unbilled.
exports.cancelInvoice = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice || invoice.type !== 'custom_work') return res.status(404).json({ success: false, message: 'Invoice not found' });
    if ((invoice.amountPaid || 0) > 0) {
      return res.status(409).json({ success: false, message: 'This invoice has payments recorded and cannot be cancelled' });
    }
    invoice.status = 'cancelled';
    await invoice.save();
    await CustomWork.updateMany({ invoice: invoice._id }, { $set: { invoice: null, invoiceNumber: null } });
    res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} cancelled; its jobs are unbilled again` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel invoice' });
  }
};
