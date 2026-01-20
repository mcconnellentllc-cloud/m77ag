const mongoose = require('mongoose');

const rentalApplicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  moveInDate: { type: Date },
  notes: { type: String },
  property: { type: String },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'denied'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('RentalApplication', rentalApplicationSchema);
