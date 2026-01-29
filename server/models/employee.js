const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: String,
  phone: String,

  // Employment Details
  employmentType: {
    type: String,
    enum: ['contract', 'full-time', 'part-time', 'seasonal'],
    default: 'contract'
  },
  position: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },

  // Compensation
  payType: {
    type: String,
    enum: ['salary', 'hourly', 'monthly'],
    default: 'salary'
  },
  annualSalary: {
    type: Number,
    default: 0
  },
  monthlyRate: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  payFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'semi-monthly', 'monthly'],
    default: 'monthly'
  },

  // Profit Sharing
  hasProfitShare: {
    type: Boolean,
    default: false
  },
  profitSharePercent: {
    type: Number,
    default: 0
  },

  // Time Tracking
  timeEntries: [{
    clockIn: Date,
    clockOut: Date,
    hoursWorked: Number,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Current clock status
  isClockedIn: {
    type: Boolean,
    default: false
  },
  currentClockIn: Date,

  // Time Off Requests
  timeOffRequests: [{
    startDate: Date,
    endDate: Date,
    type: {
      type: String,
      enum: ['vacation', 'sick', 'personal', 'unpaid'],
      default: 'vacation'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending'
    },
    notes: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: Date,
    reviewedBy: String
  }],

  // Payroll Records
  paychecks: [{
    payPeriodStart: Date,
    payPeriodEnd: Date,
    payDate: Date,
    grossAmount: Number,
    deductions: Number,
    netAmount: Number,
    type: {
      type: String,
      enum: ['regular', 'bonus', 'profit-share', 'reimbursement'],
      default: 'regular'
    },
    notes: String,
    checkNumber: String,
    paid: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Reimbursements
  reimbursements: [{
    date: Date,
    amount: Number,
    description: String,
    category: {
      type: String,
      enum: ['fuel', 'supplies', 'equipment', 'travel', 'meals', 'other'],
      default: 'other'
    },
    receiptUrl: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'denied'],
      default: 'pending'
    },
    paidDate: Date,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Notes
  notes: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
employeeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for total wages earned (based on time since start date)
employeeSchema.virtual('totalWagesEarned').get(function() {
  if (!this.startDate) return 0;

  const now = new Date();
  const start = new Date(this.startDate);
  const monthsWorked = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (this.payType === 'salary') {
    return (this.annualSalary / 12) * Math.max(0, monthsWorked);
  } else if (this.payType === 'monthly') {
    return this.monthlyRate * Math.max(0, monthsWorked);
  }
  return 0;
});

// Virtual for total paychecks paid
employeeSchema.virtual('totalPaid').get(function() {
  return (this.paychecks || [])
    .filter(p => p.paid)
    .reduce((sum, p) => sum + (p.netAmount || 0), 0);
});

// Virtual for total reimbursements owed
employeeSchema.virtual('totalReimbursementsOwed').get(function() {
  return (this.reimbursements || [])
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
});

// Virtual for total reimbursements paid
employeeSchema.virtual('totalReimbursementsPaid').get(function() {
  return (this.reimbursements || [])
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
});

// Virtual for credit owed (wages earned - paid + reimbursements owed)
employeeSchema.virtual('creditOwed').get(function() {
  const wagesEarned = this.totalWagesEarned || 0;
  const paid = this.totalPaid || 0;
  const reimbursementsOwed = this.totalReimbursementsOwed || 0;
  return wagesEarned - paid + reimbursementsOwed;
});

// Ensure virtuals are included in JSON
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
