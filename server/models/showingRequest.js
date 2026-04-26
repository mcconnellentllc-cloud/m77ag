const mongoose = require('mongoose');

const showingRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  preferredDate: { type: Date },
  preferredTime: { type: String },
  notes: { type: String },
  property: { type: String },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('ShowingRequest', showingRequestSchema);
