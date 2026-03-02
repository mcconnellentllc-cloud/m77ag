const mongoose = require('mongoose');

// ============================================================
// BUSINESS ENTITIES — The core organizational structure
// ============================================================
const entitySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String },
  expenseCategories: [{ type: String }]
}, { timestamps: true });

// ============================================================
// EMAIL ACCOUNTS — Connected email accounts
// ============================================================
const emailAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true, enum: ['gmail', 'outlook'] },
  emailAddress: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  lastSyncAt: { type: Date },
  syncEnabled: { type: Boolean, default: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEntity' },
  color: { type: String },
  isSharedMailbox: { type: Boolean, default: false },
  primaryAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEmailAccount' }
}, { timestamps: true });

// ============================================================
// EMAILS — Metadata only, not full bodies
// ============================================================
const emailSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEmailAccount', required: true, index: true },
  providerMessageId: { type: String, required: true },
  threadId: { type: String },
  subject: { type: String },
  senderEmail: { type: String, required: true, index: true },
  senderName: { type: String },
  recipients: { type: mongoose.Schema.Types.Mixed },
  snippet: { type: String },
  bodyPreview: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEntity', index: true },
  priority: { type: String, default: 'medium', enum: ['critical', 'high', 'medium', 'low', 'none'], index: true },
  isBill: { type: Boolean, default: false, index: true },
  needsResponse: { type: Boolean, default: false, index: true },
  aiSummary: { type: String },
  isRead: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false, index: true },
  hasAttachments: { type: Boolean, default: false },
  snoozedUntil: { type: Date },
  assignedTo: { type: String },
  receivedAt: { type: Date, required: true, index: true },
  processedAt: { type: Date }
}, { timestamps: true });

emailSchema.index({ accountId: 1, providerMessageId: 1 }, { unique: true });

// ============================================================
// EMAIL RULES — User-defined sorting rules
// ============================================================
const emailRuleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conditionType: { type: String, required: true, enum: ['sender', 'domain', 'subject', 'keyword'] },
  conditionValue: { type: String, required: true },
  assignEntityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEntity' },
  assignPriority: { type: String, enum: ['critical', 'high', 'medium', 'low', 'none'] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ============================================================
// BLOCKED SENDERS
// ============================================================
const blockedSenderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emailOrDomain: { type: String, required: true },
  blockedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ============================================================
// BILLS — All bills from all sources
// ============================================================
const billSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emailId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEmail' },
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEntity', required: true, index: true },
  vendor: { type: String, required: true },
  invoiceNumber: { type: String },
  amount: { type: Number, required: true },
  dueDate: { type: Date, index: true },
  paymentTerms: { type: String },
  status: { type: String, default: 'pending', enum: ['pending', 'paid', 'overdue', 'disputed'], index: true },
  isRecurring: { type: Boolean, default: false },
  lineItems: { type: mongoose.Schema.Types.Mixed },
  scannedImageUrl: { type: String },
  source: { type: String, default: 'manual', enum: ['email', 'scan', 'manual'] },
  expenseCategory: { type: String }
}, { timestamps: true });

// ============================================================
// PAYMENTS — Payment records when bills are paid
// ============================================================
const paymentSchema = new mongoose.Schema({
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailBill', required: true },
  paidByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentDate: { type: Date, required: true },
  checkNumber: { type: String },
  bankAccount: { type: String },
  amountPaid: { type: Number, required: true },
  notes: { type: String }
}, { timestamps: true });

// ============================================================
// EXPENSES — Auto-created from payments + manual entry
// ============================================================
const expenseSchema = new mongoose.Schema({
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEntity', required: true, index: true },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailBill' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailPayment' },
  date: { type: Date, required: true, index: true },
  vendor: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  subcategory: { type: String },
  checkNumber: { type: String },
  bankAccount: { type: String },
  notes: { type: String },
  source: { type: String, default: 'manual', enum: ['bill_payment', 'manual'] },
  receiptUrl: { type: String }
}, { timestamps: true });

// ============================================================
// ACTIVITY LOG — Who did what when
// ============================================================
const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actionType: { type: String, required: true },
  description: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEntity' },
  relatedId: { type: String }
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });

// ============================================================
// SENDER CACHE — Cached sender categorizations
// ============================================================
const senderCacheSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MailEntity' },
  priority: { type: String },
  isBill: { type: Boolean, default: false },
  hitCount: { type: Number, default: 1 }
}, { timestamps: true });

// Create and export models
const MailEntity = mongoose.model('MailEntity', entitySchema);
const MailEmailAccount = mongoose.model('MailEmailAccount', emailAccountSchema);
const MailEmail = mongoose.model('MailEmail', emailSchema);
const MailEmailRule = mongoose.model('MailEmailRule', emailRuleSchema);
const MailBlockedSender = mongoose.model('MailBlockedSender', blockedSenderSchema);
const MailBill = mongoose.model('MailBill', billSchema);
const MailPayment = mongoose.model('MailPayment', paymentSchema);
const MailExpense = mongoose.model('MailExpense', expenseSchema);
const MailActivityLog = mongoose.model('MailActivityLog', activityLogSchema);
const MailSenderCache = mongoose.model('MailSenderCache', senderCacheSchema);

module.exports = {
  MailEntity,
  MailEmailAccount,
  MailEmail,
  MailEmailRule,
  MailBlockedSender,
  MailBill,
  MailPayment,
  MailExpense,
  MailActivityLog,
  MailSenderCache
};
