const mongoose = require('mongoose');

const croppingFieldSchema = new mongoose.Schema({
  client: {
    type: String,
    default: 'MCC. ENT.'
  },
  farm: {
    type: String,
    required: true,
    enum: ['LAFARMS', 'KBFARMS', 'PETERSON', 'HDFARMS', 'MEFARMS', 'A1FARMS']
  },
  field: {
    type: String,
    required: true
  },
  legal: {
    type: String
  },
  fsaFarm: {
    type: String
  },
  tract: {
    type: String
  },
  acres: {
    type: Number
  },
  crop2026: {
    type: String
  },
  // For future years
  crop2027: String,
  crop2028: String,
  crop2029: String,
  crop2030: String,
  // Cost tracking
  costPerAcre: Number,
  estimatedRevenue: Number,
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
croppingFieldSchema.index({ farm: 1 });
croppingFieldSchema.index({ crop2026: 1 });
croppingFieldSchema.index({ fsaFarm: 1, tract: 1 });

module.exports = mongoose.model('CroppingField', croppingFieldSchema);
