const mongoose = require('mongoose');

// For all communication between landlord and tenant
const propertyMessageSchema = new mongoose.Schema({
  // References
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalProperty',
    required: true
  },
  lease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  // Message details
  messageType: {
    type: String,
    enum: [
      'general',           // General communication
      'repair_request',    // Maintenance request
      'repair_update',     // Update on repair
      'payment_reminder',  // Payment due reminder
      'payment_receipt',   // Payment received
      'lease_notice',      // Lease-related notice
      'inspection_notice', // Inspection scheduled
      'violation_notice',  // Lease violation
      'move_out_notice',   // Move out notice
      'legal_notice'       // Legal/formal notice
    ],
    default: 'general'
  },
  // Direction
  direction: {
    type: String,
    enum: ['tenant_to_landlord', 'landlord_to_tenant', 'system'],
    required: true
  },
  // Content
  subject: String,
  message: {
    type: String,
    required: true
  },
  // For repair requests
  repairDetails: {
    category: {
      type: String,
      enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other']
    },
    urgency: {
      type: String,
      enum: ['emergency', 'urgent', 'normal', 'low'],
      default: 'normal'
    },
    location: String, // e.g., "Master bathroom"
    description: String,
    preferredAccessTimes: String,
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'reported'
    },
    scheduledDate: Date,
    completedDate: Date,
    vendorName: String,
    vendorPhone: String,
    cost: Number,
    paidBy: { type: String, enum: ['landlord', 'tenant'] }
  },
  // Attachments (photos, documents)
  attachments: [{
    filename: String,
    url: String,
    type: { type: String }, // 'image', 'pdf', 'document'
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  // For legal purposes - delivery confirmation
  deliveryMethod: {
    type: String,
    enum: ['portal', 'email', 'mail', 'in_person'],
    default: 'portal'
  },
  emailSent: { type: Boolean, default: false },
  emailSentDate: Date,
  mailedDate: Date,
  mailedTrackingNumber: String,
  // For formal notices
  requiresResponse: { type: Boolean, default: false },
  responseDeadline: Date,
  respondedAt: Date,
  // Important flag for court documentation
  isImportant: {
    type: Boolean,
    default: false
  },
  // Thread for conversation tracking
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyMessage'
  },
  threadId: String
}, {
  timestamps: true
});

// Generate thread ID for new conversations
propertyMessageSchema.pre('save', function(next) {
  if (this.isNew && !this.parentMessage && !this.threadId) {
    this.threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Indexes for efficient queries
propertyMessageSchema.index({ property: 1, createdAt: -1 });
propertyMessageSchema.index({ tenant: 1, createdAt: -1 });
propertyMessageSchema.index({ lease: 1 });
propertyMessageSchema.index({ messageType: 1 });
propertyMessageSchema.index({ threadId: 1 });
propertyMessageSchema.index({ 'repairDetails.status': 1 });
propertyMessageSchema.index({ isImportant: 1 });

const PropertyMessage = mongoose.model('PropertyMessage', propertyMessageSchema);

module.exports = PropertyMessage;
