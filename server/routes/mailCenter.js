const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  MailEntity, MailEmailAccount, MailEmail, MailEmailRule,
  MailBlockedSender, MailBill, MailPayment, MailExpense,
  MailActivityLog, MailSenderCache
} = require('../models/mailCenter');

// All mail center routes require admin auth
router.use(authenticate, isAdmin);

// Helper to log activity
async function logActivity({ userId, actionType, description, entityId, relatedId }) {
  try {
    await MailActivityLog.create({ userId, actionType, description, entityId, relatedId });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

// ============================================================
// ENTITIES
// ============================================================

// GET /api/mail-center/entities
router.get('/entities', async (req, res) => {
  try {
    let entities = await MailEntity.find().sort({ name: 1 });
    if (entities.length === 0) {
      entities = await seedDefaultEntities();
    }
    res.json({ success: true, entities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Seed default entities
async function seedDefaultEntities() {
  const defaults = [
    { slug: 'm77ag', name: 'M77 AG', color: '#16a34a', icon: 'Tractor', description: 'Farm & ranch, custom farming', expenseCategories: ['seed', 'chemical', 'fertilizer', 'fuel', 'equipment repairs', 'equipment purchase', 'rent/lease', 'labor', 'insurance', 'utilities', 'trucking', 'custom hire', 'crop insurance', 'irrigation', 'office', 'other'] },
    { slug: 'cattle', name: 'McConnell Cattle', color: '#92400e', icon: 'Beef', description: 'Cattle operations', expenseCategories: ['feed', 'mineral', 'vet', 'hauling', 'processing', 'pasture rent', 'fencing', 'equipment', 'insurance', 'other'] },
    { slug: 'pioneer', name: 'Pioneer Seeds', color: '#f59e0b', icon: 'Wheat', description: 'Pioneer/Corteva seed sales', expenseCategories: ['marketing', 'travel', 'customer events', 'supplies', 'other'] },
    { slug: 'togoag', name: 'ToGoAG', color: '#ec4899', icon: 'Store', description: 'Retail business', expenseCategories: ['inventory', 'shipping', 'licensing', 'insurance', 'supplies', 'marketing', 'other'] },
    { slug: 'acreprofit', name: 'AcreProfit', color: '#8b5cf6', icon: 'FlaskConical', description: 'Chemical sales', expenseCategories: ['chemical inventory', 'shipping', 'licensing', 'insurance', 'supplies', 'marketing', 'other'] },
    { slug: 'hunting', name: 'Hunting', color: '#78716c', icon: 'Target', description: 'Commercial hunting operations', expenseCategories: ['lease costs', 'improvements', 'insurance', 'equipment', 'marketing', 'other'] },
    { slug: 'mcconnellent', name: 'McConnell Enterprises', color: '#3b82f6', icon: 'Building2', description: 'Holding company, bills', expenseCategories: ['utilities', 'insurance', 'accounting', 'legal', 'office', 'other'] },
    { slug: 'personal', name: 'Personal / Family', color: '#06b6d4', icon: 'Users', description: 'Kyle & Brandi personal', expenseCategories: ['groceries', 'utilities', 'mortgage', 'vehicles', 'medical', 'kids activities', 'other'] },
    { slug: 'flamesoffury', name: 'Flames of Fury', color: '#ef4444', icon: 'Flame', description: 'Book project', expenseCategories: ['writing', 'publishing', 'marketing', 'travel', 'other'] }
  ];
  return await MailEntity.insertMany(defaults);
}

// POST /api/mail-center/entities/seed — Force re-seed entities
router.post('/entities/seed', async (req, res) => {
  try {
    await MailEntity.deleteMany({});
    const entities = await seedDefaultEntities();
    res.json({ success: true, entities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EMAIL STATS (Dashboard)
// ============================================================

// GET /api/mail-center/emails/stats
router.get('/emails/stats', async (req, res) => {
  try {
    const entities = await MailEntity.find();
    const unreadByEntity = {};

    for (const entity of entities) {
      unreadByEntity[entity.slug] = await MailEmail.countDocuments({
        entityId: entity._id,
        isRead: false,
        isArchived: false,
        priority: { $ne: 'none' }
      });
    }

    unreadByEntity['unassigned'] = await MailEmail.countDocuments({
      entityId: null,
      isRead: false,
      isArchived: false,
      priority: { $ne: 'none' }
    });

    const actionRequired = await MailEmail.countDocuments({
      needsResponse: true,
      isArchived: false
    });

    const noiseCount = await MailEmail.countDocuments({
      priority: 'none',
      isArchived: false
    });

    const totalUnread = await MailEmail.countDocuments({
      isRead: false,
      isArchived: false,
      priority: { $ne: 'none' }
    });

    const billCount = await MailEmail.countDocuments({
      isBill: true,
      isArchived: false
    });

    res.json({ success: true, unreadByEntity, actionRequired, noiseCount, totalUnread, billCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EMAILS
// ============================================================

// GET /api/mail-center/emails
router.get('/emails', async (req, res) => {
  try {
    const { entity, priority, account, view, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Default: exclude snoozed
    filter.$or = [
      { snoozedUntil: null },
      { snoozedUntil: { $lte: new Date() } }
    ];

    if (entity) {
      const ent = await MailEntity.findOne({ slug: entity });
      if (ent) filter.entityId = ent._id;
    }
    if (priority) filter.priority = priority;
    if (account) filter.accountId = account;

    if (view === 'action_required') {
      filter.needsResponse = true;
      filter.isArchived = false;
    } else if (view === 'noise') {
      filter.priority = 'none';
    } else if (view === 'bills') {
      filter.isBill = true;
    } else {
      filter.isArchived = false;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$and = [{
        $or: [
          { subject: searchRegex },
          { senderEmail: searchRegex },
          { senderName: searchRegex },
          { aiSummary: searchRegex }
        ]
      }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [emails, total] = await Promise.all([
      MailEmail.find(filter)
        .populate('accountId', 'emailAddress displayName provider color')
        .populate('entityId', 'slug name color icon')
        .sort({ priority: 1, receivedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MailEmail.countDocuments(filter)
    ]);

    // Map for frontend compatibility
    const mapped = emails.map(e => ({
      id: e._id,
      subject: e.subject,
      senderEmail: e.senderEmail,
      senderName: e.senderName,
      snippet: e.snippet,
      bodyPreview: e.bodyPreview,
      aiSummary: e.aiSummary,
      priority: e.priority,
      entityId: e.entityId?._id || null,
      isBill: e.isBill,
      needsResponse: e.needsResponse,
      isRead: e.isRead,
      isStarred: e.isStarred,
      hasAttachments: e.hasAttachments,
      receivedAt: e.receivedAt,
      account: e.accountId ? {
        emailAddress: e.accountId.emailAddress,
        displayName: e.accountId.displayName,
        provider: e.accountId.provider
      } : { emailAddress: '', displayName: 'Unknown', provider: '' },
      entity: e.entityId ? {
        slug: e.entityId.slug,
        name: e.entityId.name,
        color: e.entityId.color,
        icon: e.entityId.icon
      } : null
    }));

    res.json({
      success: true,
      emails: mapped,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mail-center/emails/:id/actions
router.post('/emails/:id/actions', async (req, res) => {
  try {
    const email = await MailEmail.findById(req.params.id);
    if (!email) return res.status(404).json({ success: false, message: 'Email not found' });

    const { action } = req.body;
    const userId = req.user.id;

    switch (action) {
      case 'archive':
        await MailEmail.findByIdAndUpdate(req.params.id, { isArchived: true, isRead: true });
        await logActivity({ userId, actionType: 'email_archived', description: `Archived email from ${email.senderEmail}: ${email.subject}`, entityId: email.entityId, relatedId: email._id.toString() });
        break;

      case 'unarchive':
        await MailEmail.findByIdAndUpdate(req.params.id, { isArchived: false });
        break;

      case 'read':
        await MailEmail.findByIdAndUpdate(req.params.id, { isRead: true });
        break;

      case 'unread':
        await MailEmail.findByIdAndUpdate(req.params.id, { isRead: false });
        break;

      case 'star':
        await MailEmail.findByIdAndUpdate(req.params.id, { isStarred: !email.isStarred });
        break;

      case 'snooze': {
        const { until } = req.body;
        if (!until) return res.status(400).json({ success: false, message: 'Snooze date required' });
        await MailEmail.findByIdAndUpdate(req.params.id, { snoozedUntil: new Date(until), isArchived: true });
        await logActivity({ userId, actionType: 'email_snoozed', description: `Snoozed email until ${until}: ${email.subject}`, entityId: email.entityId, relatedId: email._id.toString() });
        break;
      }

      case 'reclassify': {
        const { entitySlug, priority: newPriority } = req.body;
        const update = {};
        let entity = null;
        if (entitySlug) {
          entity = await MailEntity.findOne({ slug: entitySlug });
          if (entity) update.entityId = entity._id;
        }
        if (newPriority) update.priority = newPriority;
        await MailEmail.findByIdAndUpdate(req.params.id, update);

        if (entity) {
          await MailSenderCache.findOneAndUpdate(
            { email: email.senderEmail.toLowerCase() },
            { entityId: entity._id, priority: newPriority || email.priority, isBill: email.isBill },
            { upsert: true }
          );
        }
        await logActivity({ userId, actionType: 'email_reclassified', description: `Reclassified email from ${email.senderEmail} to ${entitySlug || 'unchanged'}`, entityId: entity?._id || email.entityId, relatedId: email._id.toString() });
        break;
      }

      case 'block_sender':
        await MailBlockedSender.create({ userId, emailOrDomain: email.senderEmail.toLowerCase() });
        await MailEmail.updateMany({ senderEmail: email.senderEmail }, { isArchived: true, priority: 'none' });
        await logActivity({ userId, actionType: 'sender_blocked', description: `Blocked sender: ${email.senderEmail}`, relatedId: email._id.toString() });
        break;

      case 'create_bill': {
        const bill = await MailBill.create({
          userId,
          emailId: email._id,
          entityId: email.entityId,
          vendor: email.senderName || email.senderEmail,
          amount: 0,
          status: 'pending',
          source: 'email'
        });
        await logActivity({ userId, actionType: 'bill_created', description: `Created bill from email: ${email.subject}`, entityId: email.entityId, relatedId: bill._id.toString() });
        return res.json({ success: true, billId: bill._id });
      }

      default:
        return res.status(400).json({ success: false, message: 'Unknown action' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// BILLS
// ============================================================

// GET /api/mail-center/bills
router.get('/bills', async (req, res) => {
  try {
    const { entity, status, view } = req.query;
    const filter = {};

    if (entity) {
      const ent = await MailEntity.findOne({ slug: entity });
      if (ent) filter.entityId = ent._id;
    }
    if (status) filter.status = status;

    if (view === 'upcoming') {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      filter.dueDate = { $lte: thirtyDays };
      filter.status = 'pending';
    } else if (view === 'overdue') {
      filter.dueDate = { $lt: new Date() };
      filter.status = 'pending';
    }

    const bills = await MailBill.find(filter)
      .populate('entityId', 'slug name color')
      .populate('userId', 'name')
      .sort({ dueDate: 1 });

    const mapped = bills.map(b => ({
      id: b._id,
      vendor: b.vendor,
      invoiceNumber: b.invoiceNumber,
      amount: b.amount.toString(),
      dueDate: b.dueDate,
      paymentTerms: b.paymentTerms,
      status: b.status,
      expenseCategory: b.expenseCategory,
      source: b.source,
      createdAt: b.createdAt,
      entity: b.entityId ? { slug: b.entityId.slug, name: b.entityId.name, color: b.entityId.color } : null,
      user: b.userId ? { name: b.userId.name } : null
    }));

    res.json({ success: true, bills: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mail-center/bills
router.post('/bills', async (req, res) => {
  try {
    const { entitySlug, vendor, invoiceNumber, amount, dueDate, paymentTerms, expenseCategory } = req.body;
    if (!entitySlug || !vendor || amount === undefined) {
      return res.status(400).json({ success: false, message: 'entitySlug, vendor, and amount are required' });
    }

    const entity = await MailEntity.findOne({ slug: entitySlug });
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found' });

    const bill = await MailBill.create({
      userId: req.user.id,
      entityId: entity._id,
      vendor,
      invoiceNumber: invoiceNumber || null,
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      paymentTerms: paymentTerms || null,
      expenseCategory: expenseCategory || null,
      source: 'manual'
    });

    await logActivity({
      userId: req.user.id,
      actionType: 'bill_created',
      description: `Created bill: ${vendor} $${amount}`,
      entityId: entity._id,
      relatedId: bill._id.toString()
    });

    res.status(201).json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mail-center/bills/:id/pay
router.post('/bills/:id/pay', async (req, res) => {
  try {
    const bill = await MailBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const { checkNumber, paymentDate, bankAccount, notes } = req.body;

    const payment = await MailPayment.create({
      billId: bill._id,
      paidByUserId: req.user.id,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      checkNumber: checkNumber || null,
      bankAccount: bankAccount || null,
      amountPaid: bill.amount,
      notes: notes || null
    });

    await MailBill.findByIdAndUpdate(req.params.id, { status: 'paid' });

    // Auto-create expense from payment
    await MailExpense.create({
      entityId: bill.entityId,
      billId: bill._id,
      paymentId: payment._id,
      date: paymentDate ? new Date(paymentDate) : new Date(),
      vendor: bill.vendor,
      amount: bill.amount,
      category: bill.expenseCategory || 'other',
      checkNumber: checkNumber || null,
      bankAccount: bankAccount || null,
      notes: notes || null,
      source: 'bill_payment'
    });

    await logActivity({
      userId: req.user.id,
      actionType: 'bill_paid',
      description: `Paid bill: ${bill.vendor} $${bill.amount}`,
      entityId: bill.entityId,
      relatedId: bill._id.toString()
    });

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EXPENSES
// ============================================================

// GET /api/mail-center/expenses
router.get('/expenses', async (req, res) => {
  try {
    const { entity, category, start, end } = req.query;
    const filter = {};

    if (entity) {
      const ent = await MailEntity.findOne({ slug: entity });
      if (ent) filter.entityId = ent._id;
    }
    if (category) filter.category = new RegExp(category, 'i');
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    const expenses = await MailExpense.find(filter)
      .populate('entityId', 'slug name color')
      .sort({ date: -1 });

    const mapped = expenses.map(e => ({
      id: e._id,
      vendor: e.vendor,
      amount: e.amount.toString(),
      category: e.category,
      subcategory: e.subcategory,
      date: e.date,
      checkNumber: e.checkNumber,
      bankAccount: e.bankAccount,
      notes: e.notes,
      source: e.source,
      entity: e.entityId ? { slug: e.entityId.slug, name: e.entityId.name, color: e.entityId.color } : null
    }));

    res.json({ success: true, expenses: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/mail-center/expenses/summary
router.get('/expenses/summary', async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(parseInt(year) || new Date().getFullYear(), month ? parseInt(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(parseInt(year) || new Date().getFullYear(), parseInt(month), 0, 23, 59, 59)
      : new Date(parseInt(year) || new Date().getFullYear(), 11, 31, 23, 59, 59);

    const entities = await MailEntity.find();
    const result = {};

    for (const entity of entities) {
      const expenses = await MailExpense.find({
        entityId: entity._id,
        date: { $gte: startDate, $lte: endDate }
      });
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      if (total > 0) {
        const byCategory = {};
        expenses.forEach(e => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
        });
        result[entity.slug] = { name: entity.name, color: entity.color, total, byCategory };
      }
    }

    res.json({ success: true, summary: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mail-center/expenses
router.post('/expenses', async (req, res) => {
  try {
    const { entitySlug, date, vendor, amount, category, subcategory, checkNumber, bankAccount, notes } = req.body;
    if (!entitySlug || !vendor || !amount || !category) {
      return res.status(400).json({ success: false, message: 'entitySlug, vendor, amount, and category are required' });
    }

    const entity = await MailEntity.findOne({ slug: entitySlug });
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found' });

    const expense = await MailExpense.create({
      entityId: entity._id,
      date: date ? new Date(date) : new Date(),
      vendor,
      amount,
      category,
      subcategory: subcategory || null,
      checkNumber: checkNumber || null,
      bankAccount: bankAccount || null,
      notes: notes || null,
      source: 'manual'
    });

    await logActivity({
      userId: req.user.id,
      actionType: 'expense_created',
      description: `Created expense: ${vendor} $${amount} (${category})`,
      entityId: entity._id,
      relatedId: expense._id.toString()
    });

    res.status(201).json({ success: true, expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// FINANCIAL OVERVIEW (Dashboard)
// ============================================================

// GET /api/mail-center/financial/overview
router.get('/financial/overview', async (req, res) => {
  try {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Bills due this week
    const billsDueThisWeek = await MailBill.find({
      status: 'pending',
      dueDate: { $lte: weekFromNow, $gte: now }
    }).populate('entityId', 'slug name color').limit(10);

    const billsDueAmount = billsDueThisWeek.reduce((sum, b) => sum + b.amount, 0);

    // Overdue bills
    const overdueBills = await MailBill.find({
      status: 'pending',
      dueDate: { $lt: now }
    }).select('vendor amount').limit(5);

    // Expenses by entity this month
    const entities = await MailEntity.find();
    const expensesByEntity = {};
    let totalExpensesThisMonth = 0;

    for (const entity of entities) {
      const total = await MailExpense.aggregate([
        { $match: { entityId: entity._id, date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const amount = total[0]?.total || 0;
      if (amount > 0) expensesByEntity[entity.slug] = amount;
      totalExpensesThisMonth += amount;
    }

    // Recent activity
    const recentActivity = await MailActivityLog.find()
      .populate('userId', 'name')
      .populate('entityId', 'slug name color')
      .sort({ createdAt: -1 })
      .limit(10);

    const activityMapped = recentActivity.map(a => ({
      id: a._id,
      actionType: a.actionType,
      description: a.description,
      user: a.userId ? { name: a.userId.name } : { name: 'System' },
      entity: a.entityId ? { slug: a.entityId.slug, name: a.entityId.name, color: a.entityId.color } : null,
      createdAt: a.createdAt
    }));

    const billsMapped = billsDueThisWeek.map(b => ({
      id: b._id,
      vendor: b.vendor,
      amount: b.amount.toString(),
      dueDate: b.dueDate,
      entity: b.entityId ? { slug: b.entityId.slug, name: b.entityId.name, color: b.entityId.color } : null
    }));

    res.json({
      success: true,
      billsDueThisWeek: billsMapped,
      billsDueAmount,
      overdueBills: overdueBills.map(b => ({ id: b._id, vendor: b.vendor, amount: b.amount.toString() })),
      expensesByEntity,
      totalExpensesThisMonth,
      recentActivity: activityMapped
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EMAIL ACCOUNTS
// ============================================================

// GET /api/mail-center/accounts
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await MailEmailAccount.find()
      .populate('entityId', 'slug name color')
      .select('-accessToken -refreshToken');

    const mapped = accounts.map(a => ({
      id: a._id,
      emailAddress: a.emailAddress,
      displayName: a.displayName,
      provider: a.provider,
      lastSyncAt: a.lastSyncAt,
      syncEnabled: a.syncEnabled,
      entity: a.entityId ? { slug: a.entityId.slug, name: a.entityId.name, color: a.entityId.color } : null
    }));

    res.json({ success: true, accounts: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mail-center/accounts
router.post('/accounts', async (req, res) => {
  try {
    const { emailAddress, displayName, provider, entitySlug } = req.body;
    if (!emailAddress || !displayName || !provider) {
      return res.status(400).json({ success: false, message: 'emailAddress, displayName, and provider are required' });
    }

    let entityId = null;
    if (entitySlug) {
      const entity = await MailEntity.findOne({ slug: entitySlug });
      if (entity) entityId = entity._id;
    }

    const account = await MailEmailAccount.create({
      userId: req.user.id,
      emailAddress,
      displayName,
      provider,
      entityId,
      syncEnabled: false
    });

    res.status(201).json({ success: true, account });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email account already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EMAIL RULES
// ============================================================

// GET /api/mail-center/rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await MailEmailRule.find()
      .populate('assignEntityId', 'slug name color')
      .sort({ createdAt: 1 });

    const mapped = rules.map(r => ({
      id: r._id,
      conditionType: r.conditionType,
      conditionValue: r.conditionValue,
      assignPriority: r.assignPriority,
      isActive: r.isActive,
      entity: r.assignEntityId ? { slug: r.assignEntityId.slug, name: r.assignEntityId.name, color: r.assignEntityId.color } : null
    }));

    res.json({ success: true, rules: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mail-center/rules
router.post('/rules', async (req, res) => {
  try {
    const { conditionType, conditionValue, entitySlug, priority } = req.body;
    if (!conditionValue) {
      return res.status(400).json({ success: false, message: 'conditionValue is required' });
    }

    let assignEntityId = null;
    if (entitySlug) {
      const entity = await MailEntity.findOne({ slug: entitySlug });
      if (entity) assignEntityId = entity._id;
    }

    const rule = await MailEmailRule.create({
      userId: req.user.id,
      conditionType: conditionType || 'sender',
      conditionValue,
      assignEntityId,
      assignPriority: priority || null
    });

    await logActivity({
      userId: req.user.id,
      actionType: 'rule_created',
      description: `Created rule: ${conditionType} = ${conditionValue}`,
      relatedId: rule._id.toString()
    });

    res.status(201).json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/mail-center/rules/:id
router.delete('/rules/:id', async (req, res) => {
  try {
    await MailEmailRule.findByIdAndDelete(req.params.id);
    await logActivity({
      userId: req.user.id,
      actionType: 'rule_deleted',
      description: 'Deleted email rule',
      relatedId: req.params.id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// SYNC ENGINE
// ============================================================
const { syncAllAccounts, syncSingleAccount } = require('../utils/syncEngine');

// POST /api/mail-center/sync — trigger sync for all accounts
router.post('/sync', async (req, res) => {
  try {
    const results = await syncAllAccounts();
    const totalNew = results.reduce((sum, r) => sum + r.newEmails, 0);

    await logActivity({
      userId: req.user.id,
      actionType: 'sync_completed',
      description: `Synced all accounts: ${totalNew} new emails`
    });

    res.json({ success: true, results, totalNew });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/mail-center/sync/:accountId — sync single account
router.post('/sync/:accountId', async (req, res) => {
  try {
    const result = await syncSingleAccount(req.params.accountId);

    await logActivity({
      userId: req.user.id,
      actionType: 'sync_completed',
      description: `Synced ${result.emailAddress}: ${result.newEmails} new emails`
    });

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// OAUTH CONNECT — Google
// ============================================================

// GET /api/mail-center/auth/google — initiate Google OAuth flow
router.get('/auth/google', async (req, res) => {
  try {
    const { accountId } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ success: false, message: 'GOOGLE_CLIENT_ID not configured' });

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/mail-center/auth/google/callback`;

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', accountId || '');

    res.redirect(authUrl.toString());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/mail-center/auth/google/callback
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state: accountId, error } = req.query;

    if (error || !code) {
      return res.redirect('/admin/mail-center?error=' + encodeURIComponent(error || 'Unknown error'));
    }

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/mail-center/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      return res.redirect('/admin/mail-center?error=Token+exchange+failed');
    }

    const tokens = await tokenRes.json();

    if (accountId && tokens.access_token) {
      await MailEmailAccount.findByIdAndUpdate(accountId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
        syncEnabled: true
      });
    }

    res.redirect('/admin/mail-center?connected=google');
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect('/admin/mail-center?error=OAuth+callback+failed');
  }
});

// ============================================================
// OAUTH CONNECT — Microsoft
// ============================================================

// GET /api/mail-center/auth/microsoft — initiate Microsoft OAuth flow
router.get('/auth/microsoft', async (req, res) => {
  try {
    const { accountId } = req.query;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) return res.status(500).json({ success: false, message: 'MICROSOFT_CLIENT_ID not configured' });

    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/mail-center/auth/microsoft/callback`;

    const scopes = [
      'openid', 'profile', 'email', 'offline_access',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Read.Shared',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Mail.Send.Shared'
    ].join(' ');

    const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('state', accountId || '');

    res.redirect(authUrl.toString());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/mail-center/auth/microsoft/callback
router.get('/auth/microsoft/callback', async (req, res) => {
  try {
    const { code, state: accountId, error } = req.query;

    if (error || !code) {
      const errorDesc = req.query.error_description || 'Unknown error';
      return res.redirect('/admin/mail-center?error=' + encodeURIComponent(errorDesc));
    }

    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/mail-center/auth/microsoft/callback`;

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID || '',
          client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      }
    );

    if (!tokenRes.ok) {
      return res.redirect('/admin/mail-center?error=Token+exchange+failed');
    }

    const tokens = await tokenRes.json();

    if (accountId) {
      await MailEmailAccount.findByIdAndUpdate(accountId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        syncEnabled: true
      });
    }

    res.redirect('/admin/mail-center?connected=microsoft');
  } catch (err) {
    console.error('Microsoft OAuth callback error:', err);
    res.redirect('/admin/mail-center?error=OAuth+callback+failed');
  }
});

module.exports = router;
