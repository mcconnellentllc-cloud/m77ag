const mongoose = require('mongoose');

// Entity schema to track different business/personal entities
const entitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['business', 'personal', 'trust', 'partnership'],
    default: 'business'
  },
  description: {
    type: String
  },

  // Additional assets not tracked elsewhere
  additionalAssets: [{
    name: String,
    category: {
      type: String,
      enum: ['Cash', 'Investments', 'Accounts Receivable', 'Inventory', 'Other Assets']
    },
    value: Number,
    notes: String
  }],

  // Additional liabilities not tracked elsewhere
  additionalLiabilities: [{
    name: String,
    category: {
      type: String,
      enum: ['Credit Cards', 'Lines of Credit', 'Accounts Payable', 'Other Liabilities']
    },
    amount: Number,
    interestRate: Number,
    minimumPayment: Number,
    dueDate: Date,
    notes: String
  }],

  // Settings
  includeInTotal: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#2d5a27'
  }
}, {
  timestamps: true
});

const Entity = mongoose.model('Entity', entitySchema);

module.exports = Entity;
