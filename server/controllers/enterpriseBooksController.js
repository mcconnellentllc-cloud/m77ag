const EnterpriseEntry = require('../models/enterpriseEntry');
const LEASE = require('../data/luekingLease2026');

// Books for enterprises kept apart from M77 AG's financials. Only these may
// be recorded; each may carry a lease that drives its profit-share math.
const ENTERPRISES = { Lueking: LEASE };

const FIELDS = ['type', 'category', 'description', 'amount', 'cropYear', 'date', 'dueDate', 'paid', 'party', 'reference', 'fieldName', 'notes'];
const round2 = n => Math.round(n * 100) / 100;

function clean(body) {
  const out = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  if (out.amount !== undefined) out.amount = Number(out.amount);
  if (out.cropYear !== undefined) out.cropYear = Number(out.cropYear);
  for (const k of ['date', 'dueDate']) if (out[k] === '' || out[k] === null) out[k] = undefined;
  if (out.paid !== undefined) out.paid = out.paid === true || out.paid === 'true';
  return out;
}

function checkCategory(e) {
  const list = EnterpriseEntry.CATEGORIES[e.type] || [];
  return list.includes(e.category) ? null : `Category ${e.category} is not ${e.type === "income" ? "an income" : "an expense"} category`;
}

// Rent installments from the lease schedule, entered once each as unpaid.
async function seedLeaseSchedule() {
  const out = [];
  for (const [enterprise, lease] of Object.entries(ENTERPRISES)) {
    for (const i of (lease.rent && lease.rent.installments) || []) {
      if (await EnterpriseEntry.exists({ seedKey: i.seedKey })) continue;
      await EnterpriseEntry.create({
        enterprise, type: 'expense', category: 'rent', amount: i.amount, cropYear: lease.rent.cropYear,
        dueDate: new Date(i.dueDate + 'T12:00:00Z'), paid: false, party: lease.parties.owner,
        description: `Cash rent installment due ${i.dueDate}`, seedKey: i.seedKey,
        notes: `From the ${lease.name}. Mark paid with the date and check number when paid.`, createdBy: 'lease schedule'
      });
      out.push(`${enterprise}: rent installment ${i.dueDate} $${i.amount.toFixed(2)} entered`);
    }
  }
  return out;
}

function summarize(entries, lease) {
  const sum = list => round2(list.reduce((a, e) => a + e.amount, 0));
  const byKey = (list, key) => {
    const m = {};
    for (const e of list) { const k = e[key] || 'Unassigned'; m[k] = round2((m[k] || 0) + e.amount); }
    return m;
  };
  const income = entries.filter(e => e.type === 'income');
  const expense = entries.filter(e => e.type === 'expense');
  const totals = { income: sum(income), expenses: sum(expense) };
  totals.net = round2(totals.income - totals.expenses);
  const out = {
    totals,
    incomeByCategory: byKey(income, 'category'),
    expensesByCategory: byKey(expense, 'category'),
    expensesByField: byKey(expense, 'fieldName'),
    unpaid: expense.filter(e => !e.paid).map(e => ({ _id: e._id, description: e.description, amount: e.amount, dueDate: e.dueDate, party: e.party }))
  };
  if (lease && lease.profitShare) {
    // Lease: net profit = gross revenue (grain, government payments, crop
    // insurance) - operating expenses - base rent. Hunting and grazing rent
    // is split separately.
    const gross = sum(income.filter(e => ['grain_sale', 'government_payment', 'crop_insurance_payment'].includes(e.category)));
    const rent = sum(expense.filter(e => e.category === 'rent'));
    const operating = sum(expense.filter(e => e.category !== 'rent'));
    const netProfit = round2(gross - operating - rent);
    const above = Math.max(0, round2(netProfit - lease.profitShare.threshold));
    const otherUse = sum(income.filter(e => e.category === 'hunting_grazing_rent'));
    out.profitShare = {
      grossRevenue: gross, operatingExpenses: operating, baseRent: rent, netProfit,
      threshold: lease.profitShare.threshold, aboveThreshold: above,
      landlordShare: round2(above * lease.profitShare.landlordShare),
      tenantShare: round2(above * lease.profitShare.tenantShare),
      settles: lease.profitShare.settles,
      otherUseRent: otherUse,
      otherUseLandlord: round2(otherUse * lease.otherUseRent.landlordShare),
      otherUseTenant: round2(otherUse * lease.otherUseRent.tenantShare)
    };
  }
  return out;
}

module.exports = {
  seedLeaseSchedule,

  // GET /api/enterprise-books/:enterprise?year=2026
  list: async (req, res) => {
    try {
      const enterprise = req.params.enterprise;
      if (!ENTERPRISES[enterprise]) return res.status(404).json({ success: false, message: 'Unknown enterprise' });
      const years = (await EnterpriseEntry.distinct('cropYear', { enterprise })).sort((a, b) => b - a);
      const year = Number(req.query.year) || years[0] || new Date().getFullYear();
      const entries = await EnterpriseEntry.find({ enterprise, cropYear: year }).sort({ date: -1, dueDate: -1, createdAt: -1 }).lean();
      const lease = ENTERPRISES[enterprise];
      res.json({
        success: true,
        data: {
          enterprise, year, years: years.length ? years : [year], entries,
          categories: EnterpriseEntry.CATEGORIES,
          lease: { name: lease.name, parties: lease.parties, signed: lease.signed, term: lease.term, rent: lease.rent, totals: lease.totals, profitShare: lease.profitShare, otherUseRent: lease.otherUseRent },
          summary: summarize(entries, lease)
        }
      });
    } catch (error) {
      console.error('Enterprise books list failed:', error);
      res.status(500).json({ success: false, message: 'Failed to load the books' });
    }
  },

  // POST /api/enterprise-books/:enterprise
  create: async (req, res) => {
    try {
      const enterprise = req.params.enterprise;
      if (!ENTERPRISES[enterprise]) return res.status(404).json({ success: false, message: 'Unknown enterprise' });
      const data = clean(req.body || {});
      const bad = checkCategory(data);
      if (bad) return res.status(400).json({ success: false, message: bad });
      const entry = await EnterpriseEntry.create({ ...data, enterprise, createdBy: (req.user && req.user.email) || '' });
      res.status(201).json({ success: true, data: entry, message: 'Entry saved' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.name === 'ValidationError' ? error.message : 'Failed to save the entry' });
    }
  },

  // PUT /api/enterprise-books/:enterprise/:id
  update: async (req, res) => {
    try {
      const entry = await EnterpriseEntry.findOne({ _id: req.params.id, enterprise: req.params.enterprise });
      if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
      Object.assign(entry, clean(req.body || {}));
      const bad = checkCategory(entry);
      if (bad) return res.status(400).json({ success: false, message: bad });
      await entry.save();
      res.json({ success: true, data: entry, message: 'Entry updated' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.name === 'ValidationError' || error.name === 'CastError' ? error.message : 'Failed to update the entry' });
    }
  },

  // DELETE /api/enterprise-books/:enterprise/:id
  remove: async (req, res) => {
    try {
      const r = await EnterpriseEntry.deleteOne({ _id: req.params.id, enterprise: req.params.enterprise });
      if (!r.deletedCount) return res.status(404).json({ success: false, message: 'Entry not found' });
      res.json({ success: true, message: 'Entry deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Failed to delete the entry' });
    }
  }
};
