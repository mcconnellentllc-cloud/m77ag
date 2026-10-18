// Field ledger: every expense and income on one field card for one crop
// year, gathered from the records already on file.
//
//  Expenses
//   Machine work      field passes (JD Ops seeding, spray, tillage, harvest) at the rate list
//   Products          spray and fertilizer products on those passes x the crop-year price
//   Seed              seed cost-share entries (ticket pounds x price per bushel)
//   Crop expenses     CropExpense entries posted to this field
//   Rent              cash rent per acre on the card
//   Property tax      owned ground, tax per acre on the card
//   Crop history      the year's cost summary, only for years with nothing above
//  Income
//   Grain             delivered bushels on harvest records x the crop-year grain price
//   Crop insurance    indemnity on the field's insurance units
//   Crop history      the year's gross revenue, only when no harvest records
//
// Nothing is estimated: a quantity or price that is not on file is listed
// under "missing" instead of being guessed.
const mongoose = require('mongoose');
const CroppingField = require('../models/croppingField');
const M77Field = require('../models/m77Field');
const FieldOperation = require('../models/fieldOperation');
const FieldInsurance = require('../models/fieldInsurance');
const SeedCostShare = require('../models/seedCostShare');
const CropExpense = require('../models/cropExpense');
const InputPrice = require('../models/inputPrice');
const operationCost = require('../services/operationCost');
const { aphFromDatabase } = require('../services/aphDatabase');
const LUEKING_LEASE = require('../data/luekingLease2026');

const OP_LABELS = { tillage: 'Tillage', spray: 'Spray', fertilizer: 'Fertilizer', seeding: 'Seeding', harvest: 'Harvest', other: 'Other' };
const EXPENSE_LABELS = { seed: 'Seed', fertilizer: 'Fertilizer', chemicals: 'Chemicals', cropInsurance: 'Crop insurance', fuelOil: 'Fuel and oil',
  repairs: 'Repairs', customHire: 'Custom hire', landRent: 'Land rent', dryingHauling: 'Drying and hauling', taxes: 'Taxes', misc: 'Other' };

function round2(n) { return Math.round(n * 100) / 100; }
function cleanUnit(u) { return String(u || '').toLowerCase().replace(/\s+/g, '').replace(/\/ac(re)?$/, ''); }

// Amount of a product in the priced unit, or null when it cannot be
// converted. Fluid ounces (fl oz) convert to gallons; ounces (oz, dry
// weight, as written for dry products) convert to pounds.
const TO_GAL = { gal: 1, floz: 1 / 128, qt: 1 / 4, pt: 1 / 8 };
const TO_LB = { lb: 1, oz: 1 / 16 };
function quantityIn(unit, amount, fromUnit) {
  const u = cleanUnit(fromUnit);
  if (unit === 'gal' && TO_GAL[u] !== undefined) return amount * TO_GAL[u];
  if (unit === 'lb' && TO_LB[u] !== undefined) return amount * TO_LB[u];
  return null;
}
// Suggested price unit for a product from how it is applied.
function defaultUnit(p) {
  const u = cleanUnit(p.rateUnit || p.totalUnit);
  if (TO_LB[u] !== undefined) return 'lb';
  if (TO_GAL[u] !== undefined) return 'gal';
  return 'ac';
}

// Product cost on a pass: { amount, detail } or { missing }.
function productCost(p, op, acres, price) {
  if (!price) return { missing: 'price' };
  if (price.unit === 'ac') {
    if (!(acres > 0)) return { missing: 'acres' };
    return { amount: round2(acres * price.price), detail: `${acres} ac x $${price.price.toFixed(2)}/ac` };
  }
  let qty = null;
  if (p.total != null && p.totalUnit) qty = quantityIn(price.unit, p.total, p.totalUnit);
  if (qty === null && p.rate != null && p.rateUnit) {
    if (!(acres > 0)) return { missing: 'acres' };
    const perAc = quantityIn(price.unit, p.rate, p.rateUnit);
    if (perAc !== null) qty = perAc * acres;
  }
  if (qty === null) return { missing: 'quantity' };
  return { amount: round2(qty * price.price), detail: `${Math.round(qty * 100) / 100} ${price.unit} x $${price.price.toFixed(2)}/${price.unit}` };
}

function inLease(lease, year) {
  if (lease.leaseStart && new Date(lease.leaseStart).getUTCFullYear() > year) return false;
  if (lease.leaseEnd && new Date(lease.leaseEnd).getUTCFullYear() < year) return false;
  return true;
}

// Crops not sold as grain: no projected income or break-even per bushel.
const NOT_SOLD = ['FALLOW', 'PASTURE', 'SORGHUM SUDAN', 'OATS & VETCH', 'WASTE', 'BUILDING SITE', 'CRP'];
function normCrop(c) {
  const x = String(c || '').toUpperCase().trim();
  if (x.startsWith('SUDAN') || x.startsWith('SORGHUM SUDAN') || x.startsWith('SORGHUM-SUDAN')) return 'SORGHUM SUDAN';
  if (x.startsWith('MILO') || x === 'SORGHUM' || x === 'GRAIN SORGHUM' || x.startsWith('SORGHUM (')) return 'SORGHUM';
  return x;
}
// The card's crop for the year: cropYYYY, else the crop history entry.
function cropOf(cf, year, hist) {
  return normCrop(cf['crop' + year] || (hist && hist.crop) || '');
}
// APH for the crop on this field: the insurance unit for the year, else the
// most recent unit for the crop, else the APH entered on the card, else the
// Rain and Hail APH database matched by legal description, else the average
// crop-history yield for the crop (up to the last 10 years before this one).
// When the database holds more than one unit for the section, the reason is
// returned in ambiguity and the next source is used.
async function aphFor(regIds, cf, crop, year) {
  if (!crop) return null;
  const units = regIds.length ? await FieldInsurance.find({ m77Field: { $in: regIds }, aph: { $gt: 0 } }).sort({ cropYear: -1 }).lean() : [];
  const forCrop = units.filter(u => normCrop(u.crop) === crop);
  const unit = forCrop.find(u => u.cropYear === year) || forCrop[0];
  if (unit) return { value: unit.aph, source: `APH, ${unit.cropYear} insurance unit ${unit.unitNumber}` };
  const entered = (cf.aph || []).find(a => normCrop(a.crop) === crop && a.value > 0);
  if (entered) return { value: entered.value, source: entered.source || 'APH entered on the card', entered: true };
  const db = aphFromDatabase(cf, crop);
  if (db && db.value) return db;
  const ambiguity = db && db.ambiguous ? db.detail : null;
  const yields = (cf.cropHistory || []).filter(h => h.year < year && normCrop(h.crop) === crop && h.yieldPerAcre > 0)
    .sort((a, b) => b.year - a.year).slice(0, 10);
  if (!yields.length) return ambiguity ? { value: null, ambiguity } : null;
  const avg = Math.round(yields.reduce((t, h) => t + h.yieldPerAcre, 0) / yields.length * 10) / 10;
  return { value: avg, source: `average yield, ${yields.length} year${yields.length === 1 ? '' : 's'} of crop history`, ambiguity };
}

// GET /api/field-ledger/:id?year=2026   (id = the card's CroppingField id)
exports.getLedger = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year) return res.status(400).json({ success: false, message: 'year is required' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid field' });
    const cf = await CroppingField.findById(req.params.id).lean();
    if (!cf) return res.status(404).json({ success: false, message: 'Field not found' });
    const regs = await M77Field.find({ legacySource: 'CroppingField', legacyId: cf._id }).select('_id').lean();
    const regIds = regs.map(r => r._id);
    const acres = cf.acres || 0;
    const lease = cf.lease || {};

    const [ops, units, seeds, cropExpenses, prices] = await Promise.all([
      regIds.length ? FieldOperation.find({ m77Field: { $in: regIds }, cropYear: year }).sort({ startDate: 1 }).lean() : [],
      regIds.length ? FieldInsurance.find({ m77Field: { $in: regIds }, cropYear: year }).lean() : [],
      regIds.length ? SeedCostShare.find({ m77Field: { $in: regIds }, cropYear: year }) : [],
      CropExpense.find({ year, 'fields.fieldId': cf._id }).lean(),
      InputPrice.find({ year }).lean()
    ]);
    const priceOf = {};
    for (const p of prices) priceOf[p.kind + '|' + p.name.toLowerCase()] = p;

    const expenses = [];
    const income = [];
    const missing = [];
    const pricesNeeded = {};
    const notes = [];

    let invoiceStarter = 0; // starter and planter products from invoices
    // Machine work and products on each pass
    for (const op of ops) {
      if (op.status !== 'completed') continue;
      const when = op.startDate ? new Date(op.startDate).toISOString().slice(0, 10) : '';
      const passLabel = (OP_LABELS[op.type] || op.type) + ': ' + (op.title || '');
      if (op.cost && op.cost.rateKey) {
        expenses.push({ group: 'Machine work', label: passLabel, date: when,
          detail: `${op.cost.units} ${op.cost.unit}${op.cost.units === 1 ? '' : 's'} x $${Number(op.cost.rate).toFixed(2)} (${op.cost.rateLabel})`,
          amount: round2(op.cost.amount || 0), opId: op._id });
      } else if (!(op.type === 'harvest' && !(op.combineAcres > 0) && !(op.acres > 0) && !(op.netBu > 0))) {
        const key = operationCost.defaultRateKey(op);
        const why = !key ? 'Machine cost not set: pick the implement rate on the record'
          : (operationCost.costFor(op, key, 'default').error || 'Machine cost not set: pick a rate on the record');
        missing.push({ label: passLabel + (when ? ' (' + when + ')' : ''), detail: why });
      }
      const passAcres = op.acres > 0 ? op.acres : null;
      // Invoice costs carried on the pass (starter, planter products)
      const covered = new Set();
      for (const c of op.inputCosts || []) {
        if (c.covers) covered.add(c.covers);
        if (c.hold) {
          notes.push(`On hold, not billed or in totals: ${c.product} $${Number(c.amount).toFixed(2)} (${c.quantity} ${c.unit} x $${Number(c.pricePerUnit).toFixed(2)})`);
          continue;
        }
        invoiceStarter += c.amount || 0;
        expenses.push({ group: c.group || 'Products', label: c.product, date: when,
          detail: `${c.quantity} ${c.unit} x $${Number(c.pricePerUnit).toFixed(2)} · ${c.basis}`, amount: round2(c.amount), opId: op._id });
      }
      for (const p of op.products || []) {
        // Seed treatments ride on the seed cost (seed cost-share entries).
        if (op.type === 'seeding' && p.rate == null && p.total == null) continue;
        if (covered.has(p.name)) continue;
        const price = priceOf['product|' + p.name.toLowerCase()];
        const c = productCost(p, op, passAcres, price);
        if (c.missing === 'price') {
          pricesNeeded['product|' + p.name] = { kind: 'product', name: p.name, unit: defaultUnit(p) };
          missing.push({ label: p.name + ' on ' + passLabel, detail: `No ${year} price for ${p.name}` });
        } else if (c.missing) {
          missing.push({ label: p.name + ' on ' + passLabel, detail: c.missing === 'acres' ? 'Acres not on the record' : `Rate unit ${p.rateUnit || p.totalUnit || 'not on file'} does not convert to the ${price.unit} price` });
        } else {
          expenses.push({ group: 'Products', label: p.name, date: when, detail: (p.rate != null ? p.rate + ' ' + (p.rateUnit || '') + ', ' : '') + c.detail + ' · ' + passLabel, amount: c.amount, opId: op._id });
        }
      }
    }

    // Seed (ticket pounds and prices per bushel)
    let landlordSeed = 0;
    for (const s of seeds) {
      const total = s.totalCost;
      if (total === null) {
        missing.push({ label: 'Seed: ' + s.product, detail: 'Seed or treatment price not entered on the seed cost-share entry' });
        continue;
      }
      expenses.push({ group: 'Seed', label: s.product + (s.treatments && s.treatments.length ? ' with ' + s.treatments.map(t => t.name).join(', ') : ''),
        detail: `${s.bushels} bu (${s.quantityLb} lb${s.estimated ? ', estimated' : ''})`, amount: total });
      landlordSeed += s.landlordAmount || 0;
    }
    // Seed from the seed invoice, carried on the planting record
    let invoiceSeed = 0;
    const seedingOps = ops.filter(o => o.type === 'seeding' && o.status === 'completed');
    for (const o of seedingOps) {
      const sc = o.seedCost;
      if (!sc || !sc.lines || !sc.lines.length) continue;
      const when = o.startDate ? new Date(o.startDate).toISOString().slice(0, 10) : '';
      for (const l of sc.lines) {
        if (l.amount === null || l.amount === undefined) {
          missing.push({ label: `Seed: ${l.product}, ${l.acres} ac`, detail: l.basis || 'Not priced' });
          continue;
        }
        const qty = l.units ? `${l.units} ${l.unit}${l.units === 1 ? '' : 's'} x $${Number(l.pricePerUnit).toFixed(2)}` : '';
        const rate = l.seedsPerAcre ? ` (${l.acres} ac at ${Number(l.seedsPerAcre).toLocaleString('en-US')} seeds/ac)` : ` (${l.acres} ac)`;
        expenses.push({ group: 'Seed', label: l.product, date: when, detail: qty + rate + ' · ' + l.basis, amount: round2(l.amount), opId: o._id });
        if (l.spread) expenses.push({ group: 'Seed', label: l.product + ', share of seed used', date: when, detail: `${l.units} ${l.unit}s · ${l.spreadBasis}`, amount: round2(l.spread), opId: o._id });
        if (l.interest) expenses.push({ group: 'Seed', label: l.product + ' interest' + (sc.interestEstimated ? ' (estimate)' : ''), date: when,
          detail: `${l.units} ${l.unit}s, deferred payment interest per unit (prime - 1%, Dec 5, 2025 to Dec 1, 2026)`, amount: round2(l.interest), opId: o._id });
        invoiceSeed += (l.amount || 0) + (l.spread || 0) + (l.interest || 0);
      }
      if (sc.interestPending) notes.push('Seed interest (deferred payment, prime - 1%) is not on file yet; it will be added per bag once known.');
    }
    if (seedingOps.length && !seeds.length && !seedingOps.some(o => o.seedCost && o.seedCost.lines && o.seedCost.lines.length)) {
      missing.push({ label: 'Seed for ' + seedingOps.map(o => o.variety || o.crop).join('; '), detail: 'No seed invoice or seed cost-share entry for this field and year' });
    }

    // Crop expenses posted to this field
    for (const e of cropExpenses) {
      const entry = (e.fields || []).find(x => String(x.fieldId) === String(cf._id));
      const ac = entry && entry.acres > 0 ? entry.acres : acres;
      const amount = round2((e.costPerAcre || 0) * ac);
      const when = e.date ? new Date(e.date).toISOString().slice(0, 10) : '';
      const line = { group: EXPENSE_LABELS[e.category] || 'Other', label: e.description, date: when,
        detail: `${ac} ac x $${Number(e.costPerAcre).toFixed(2)}/ac${e.vendor ? ' · ' + e.vendor : ''}${e.invoiceNumber ? ' · inv ' + e.invoiceNumber : ''}`, amount };
      if (e.status === 'projected') notes.push(`Projected, not in totals: ${e.description} ${'$' + amount.toFixed(2)}`);
      else if (e.paidBy === 'landlord') notes.push(`Paid by the landlord, not in totals: ${e.description} ${'$' + amount.toFixed(2)}`);
      else expenses.push(line);
    }

    // Crop history summary for the year (older years), used only when
    // nothing itemized is on file, so costs are never counted twice.
    const hist = (cf.cropHistory || []).find(h => h.year === year);
    const itemized = expenses.length > 0;
    let histRent = false;
    if (hist && !itemized && hist.costs) {
      for (const [k, v] of Object.entries(hist.costs)) {
        if (!(v > 0) || !acres) continue;
        if (k === 'landRent') histRent = true;
        expenses.push({ group: 'Crop history', label: EXPENSE_LABELS[k] || k, detail: `${acres} ac x $${Number(v).toFixed(2)}/ac`, amount: round2(v * acres) });
      }
    }

    // Rent and property tax from the card
    if ((lease.type === 'cash-rent' || lease.type === 'flex-lease') && !histRent) {
      if (lease.rentPerAcre > 0 && acres && inLease(lease, year)) {
        expenses.push({ group: 'Rent', label: 'Cash rent' + (lease.landlord ? ' to ' + lease.landlord : ''), detail: `${acres} ac x $${Number(lease.rentPerAcre).toFixed(2)}/ac (rate on the card)`, amount: round2(lease.rentPerAcre * acres) });
      } else if (!(lease.rentPerAcre > 0)) {
        missing.push({ label: 'Cash rent', detail: 'Rent per acre not on the card' });
      }
    }
    if (lease.type === 'owned' && cf.taxes && cf.taxes.propertyTaxPerAcre > 0 && acres && (!cf.taxes.taxYear || cf.taxes.taxYear === year)) {
      expenses.push({ group: 'Property tax', label: 'Property tax' + (cf.taxes.taxingAuthority ? ', ' + cf.taxes.taxingAuthority : ''), detail: `${acres} ac x $${Number(cf.taxes.propertyTaxPerAcre).toFixed(2)}/ac`, amount: round2(cf.taxes.propertyTaxPerAcre * acres) });
    }

    // Grain delivered
    const harvests = ops.filter(o => o.type === 'harvest' && o.status === 'completed' && o.netBu > 0);
    const byCrop = {};
    for (const h of harvests) (byCrop[h.crop] = byCrop[h.crop] || []).push(h);
    for (const [crop, list] of Object.entries(byCrop)) {
      const bu = round2(list.reduce((s, h) => s + h.netBu, 0));
      const set = priceOf['grain|' + crop.toLowerCase()];
      const price = set ? set.price : (hist && hist.pricePerBushel > 0 && String(hist.crop || '').toUpperCase() === crop ? hist.pricePerBushel : null);
      if (price === null) {
        pricesNeeded['grain|' + crop] = { kind: 'grain', name: crop, unit: 'bu' };
        missing.push({ label: `${crop} ${bu.toLocaleString('en-US')} bu delivered`, detail: `No ${year} ${crop.toLowerCase()} price` });
        continue;
      }
      const tickets = list.reduce((s, h) => s + (h.tickets || []).length, 0);
      income.push({ group: 'Grain', label: `${crop} delivered`, detail: `${bu} bu x $${price.toFixed(2)}/bu${tickets ? ' · ' + tickets + ' ticket' + (tickets === 1 ? '' : 's') : ''}${set ? '' : ' (crop history price)'}`, amount: round2(bu * price), crop });
    }
    if (!harvests.length && hist && hist.grossRevenue > 0) {
      income.push({ group: 'Crop history', label: `${hist.crop || 'Crop'} revenue`, detail: hist.yieldPerAcre ? `${hist.yieldPerAcre} bu/ac x $${Number(hist.pricePerBushel || 0).toFixed(2)}/bu` : '', amount: round2(hist.grossRevenue) });
    }

    // Crop insurance indemnity
    // Units insured by another entity (McConnell Enterprises LLC): on the
    // field's totals, but their indemnity and premium are that entity's, not
    // M77 AG's.
    let landlordIndemnity = 0, otherIndemnity = 0, otherPremium = 0;
    const otherEntities = new Set();
    for (const u of units) {
      const other = u.insuredName && !/^M77 AG/i.test(u.insuredName);
      const who = other ? ` (${u.insuredName})` : '';
      if (u.premium > 0) {
        expenses.push({ group: 'Crop insurance', label: `${u.crop} premium, unit ${u.unitNumber}${who}`,
          detail: `${u.insuredAcres} ac at ${Math.round((u.insuredShare || 1) * 100)}% share; net premium after subsidy, with the administrative fee and interest`, amount: round2(u.premium) });
        if (other) otherPremium += u.premium;
      }
      if (!u.totalPayable) continue;
      income.push({ group: 'Crop insurance', label: `${u.crop} indemnity, unit ${u.unitNumber}${who}`,
        detail: `${u.company || ''} policy ${u.policyNumber}${u.claimNumber ? ', claim ' + u.claimNumber : ''}${u.guaranteeBuPerAcre ? ' · guarantee ' + u.guaranteeBuPerAcre + ' bu/ac' : ''}${u.productionToCountBu != null ? ' · production ' + u.productionToCountBu + ' bu' : ''}`,
        amount: round2(u.totalPayable) });
      if (other) { otherIndemnity += u.totalPayable; otherEntities.add(u.insuredName); }
      else landlordIndemnity += round2(u.totalPayable * (u.landlordShare || 0));
    }
    if (otherEntities.size) notes.push(`Insured by ${[...otherEntities].join(', ')}: indemnity ${'$' + otherIndemnity.toFixed(2)}${otherPremium ? ' and premium $' + otherPremium.toFixed(2) : ''} are that entity's and are left out of M77 AG's share.`);

    // Projected income: APH x acres x the current average price for the crop
    // (Kyle, Oct 17, 2026). Used when no grain has been delivered for the year.
    const crop = cropOf(cf, year, hist);
    const aphFound = await aphFor(regIds, cf, crop, year);
    const aph = aphFound && aphFound.value ? aphFound : null;
    if (aphFound && aphFound.ambiguity) {
      missing.push({ label: `APH for ${crop.toLowerCase()}`, detail: `${aphFound.ambiguity}. ${aph ? 'Using ' + aph.source + ' until' : 'Enter it on the card or'} pick the unit.` });
    }
    const sold = crop && !NOT_SOLD.includes(crop);
    const priceSet = sold ? priceOf['grain|' + crop.toLowerCase()] : null;
    if (sold && !harvests.length && !(hist && hist.grossRevenue > 0)) {
      if (!priceSet) {
        pricesNeeded['grain|' + crop] = { kind: 'grain', name: crop, unit: 'bu' };
        missing.push({ label: `Projected ${crop.toLowerCase()} income`, detail: `No ${year} ${crop.toLowerCase()} price (current average)` });
      } else if (!aph) {
        missing.push({ label: `Projected ${crop.toLowerCase()} income`, detail: `No APH on file for ${crop.toLowerCase()} on this field` });
      } else if (acres) {
        income.push({ group: 'Projected', projected: true, label: `${crop} at APH`,
          detail: `${aph.value} bu/ac (${aph.source}) x ${acres} ac x $${priceSet.price.toFixed(2)}/bu current average`,
          amount: round2(aph.value * acres * priceSet.price), crop });
      }
    }

    const totalIncome = round2(income.reduce((s, l) => s + l.amount, 0));
    const totalExpenses = round2(expenses.reduce((s, l) => s + l.amount, 0));
    const net = round2(totalIncome - totalExpenses);

    // Crop-share: the landlord's share of the grain, their share of the
    // indemnity, and their seed share. Other input sharing is not on file.
    let split = null;
    // Crop-share landlords pay their crop share of the invoice seed (35%;
    // Kyle, Oct 17, 2026), interest included, and of the starter.
    // Starter and hopper throttle too (Kyle, Oct 17, 2026).
    if (lease.type === 'crop-share' && lease.sharePercentage > 0) landlordSeed += (invoiceSeed + invoiceStarter) * lease.sharePercentage / 100;
    if (String(cf.farm).toUpperCase() === 'LUEKING') {
      // Lueking ground: every expense is billed 100% to its landlord (Kyle, Oct 17, 2026).
      split = { kind: 'billed', billedTo: lease.landlord || LUEKING_LEASE.parties.landlordOnCards, billedPercent: 100,
        billedExpenses: totalExpenses, m77Expenses: 0 };
    } else if (lease.type === 'crop-share' && lease.sharePercentage > 0) {
      const grain = income.filter(l => l.group === 'Grain' || l.group === 'Crop history' || l.group === 'Projected').reduce((s, l) => s + l.amount, 0);
      const landlordGrain = round2(grain * lease.sharePercentage / 100);
      const m77Income = round2(totalIncome - landlordGrain - landlordIndemnity - otherIndemnity);
      const m77Expenses = round2(totalExpenses - landlordSeed - otherPremium);
      split = {
        landlord: lease.landlord || '', landlordPercent: lease.sharePercentage,
        landlordGrain, landlordIndemnity: round2(landlordIndemnity), landlordSeed: round2(landlordSeed),
        m77Income, m77Expenses, m77Net: round2(m77Income - m77Expenses)
      };
    }

    // Break-even price at APH: what each bushel must bring to cover the
    // expenses. M77 AG's on crop-share ground: its expenses over its share of
    // the bushels.
    let breakEven = null;
    if (sold && aph && acres) {
      const bushels = round2(aph.value * acres);
      breakEven = { crop, aph: aph.value, aphSource: aph.source, acres, bushels,
        perBu: bushels ? round2(totalExpenses / bushels) : null,
        price: priceSet ? priceSet.price : null };
      if (split && split.kind !== 'billed' && lease.sharePercentage > 0) {
        const m77Bu = bushels * (1 - lease.sharePercentage / 100);
        breakEven.m77PerBu = m77Bu ? round2(split.m77Expenses / m77Bu) : null;
        breakEven.m77Share = 100 - lease.sharePercentage;
      }
    } else if (sold) {
      missing.push({ label: 'Break-even price', detail: `No APH on file for ${crop.toLowerCase()} on this field` });
    }

    res.json({
      success: true,
      data: {
        crop: crop || '',
        aph: aph ? { value: aph.value, source: aph.source, entered: !!aph.entered } : null,
        aphNeeded: !!(sold && !aph),
        breakEven,
        field: { id: cf._id, name: cf.field, farm: cf.farm || '', acres, lease: { type: lease.type || '', landlord: lease.landlord || '', sharePercentage: lease.sharePercentage, rentPerAcre: lease.rentPerAcre },
          excludeFromFinancials: !!cf.excludeFromFinancials, financialNote: cf.financialNote || '' },
        year,
        income, expenses, missing, notes,
        pricesNeeded: Object.values(pricesNeeded),
        totals: { income: totalIncome, expenses: totalExpenses, net, perAcre: acres ? round2(net / acres) : null,
          expensesPerAcre: acres ? round2(totalExpenses / acres) : null, incomePerAcre: acres ? round2(totalIncome / acres) : null },
        split
      }
    });
  } catch (err) {
    console.error('Field ledger error:', err);
    res.status(500).json({ success: false, message: 'Failed to load the field ledger' });
  }
};

// GET /api/field-ledger/prices?year=2026
exports.listPrices = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year) return res.status(400).json({ success: false, message: 'year is required' });
    const prices = await InputPrice.find({ year }).sort({ kind: 1, name: 1 }).lean();
    res.json({ success: true, data: prices });
  } catch (err) {
    console.error('List input prices error:', err);
    res.status(500).json({ success: false, message: 'Failed to load prices' });
  }
};

// PUT /api/field-ledger/prices  Body: { year, kind, name, unit, price, source }
// price null or '' removes the price.
exports.setPrice = async (req, res) => {
  try {
    const b = req.body || {};
    const year = parseInt(b.year, 10);
    const name = String(b.name || '').trim();
    if (!year || !['product', 'grain'].includes(b.kind) || !name) return res.status(400).json({ success: false, message: 'Year, kind and name are required' });
    if (b.price === null || b.price === '' || b.price === undefined) {
      await InputPrice.deleteOne({ year, kind: b.kind, name });
      return res.json({ success: true, message: `${name} price removed for ${year}` });
    }
    const price = Number(b.price);
    if (!(price >= 0) || !Number.isFinite(price)) return res.status(400).json({ success: false, message: 'Price must be a number, zero or more' });
    const unit = b.kind === 'grain' ? 'bu' : b.unit;
    if (!['gal', 'lb', 'ac'].includes(unit) && b.kind === 'product') return res.status(400).json({ success: false, message: 'Unit must be gal, lb or ac' });
    const doc = await InputPrice.findOneAndUpdate({ year, kind: b.kind, name },
      { year, kind: b.kind, name, unit, price, source: b.source ? String(b.source).slice(0, 200) : undefined, updatedBy: req.user && req.user.email },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ success: true, data: doc, message: `${name}: $${price.toFixed(2)}/${unit} for ${year}` });
  } catch (err) {
    console.error('Set input price error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports._test = { quantityIn, productCost, defaultUnit };

// PUT /api/field-ledger/:id/aph  Body: { crop, value, source }  (value null removes)
exports.setAph = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid field' });
    const crop = normCrop(req.body && req.body.crop);
    if (!crop) return res.status(400).json({ success: false, message: 'Crop is required' });
    const cf = await CroppingField.findById(req.params.id).select('field aph');
    if (!cf) return res.status(404).json({ success: false, message: 'Field not found' });
    const raw = req.body.value;
    const list = (cf.aph || []).filter(a => normCrop(a.crop) !== crop);
    if (raw !== null && raw !== '' && raw !== undefined) {
      const value = Number(raw);
      if (!Number.isFinite(value) || value <= 0 || value > 400) return res.status(400).json({ success: false, message: 'APH must be bu/ac, above 0' });
      list.push({ crop, value, source: req.body.source ? String(req.body.source).slice(0, 120) : 'APH entered on the card', setBy: req.user && req.user.email, setAt: new Date() });
    }
    await CroppingField.updateOne({ _id: cf._id }, { $set: { aph: list } });
    res.json({ success: true, message: `${cf.field}: ${crop.toLowerCase()} APH ${raw ? raw + ' bu/ac' : 'removed'}` });
  } catch (err) {
    console.error('Set APH error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};
