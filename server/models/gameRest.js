const mongoose = require('mongoose');

const gameRestSchema = new mongoose.Schema({
  parcel: {
    type: String,
    required: true,
    enum: ['Heritage Farm', 'Prairie Peace', 'Both Properties']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    default: 'Automatic rest period after weekend booking'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
gameRestSchema.index({ parcel: 1, startDate: 1, endDate: 1 });

const GameRest = mongoose.model('GameRest', gameRestSchema);

module.exports = GameRest;
