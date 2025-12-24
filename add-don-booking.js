const mongoose = require('mongoose');

// MongoDB connection - will use the MongoDB URI from environment or production
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cluster0.mongodb.net/m77ag';

// Booking schema (simplified)
const bookingSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  phone: String,
  parcel: String,
  checkinDate: Date,
  checkoutDate: Date,
  numHunters: Number,
  gameSpecies: String,
  campingFee: Number,
  totalPrice: Number,
  originalPrice: Number,
  discountCode: String,
  discountPercent: Number,
  paymentStatus: String,
  paymentMethod: String,
  paypalTransactionId: String,
  dailyRate: Number,
  numNights: Number,
  status: String,
  waiverSigned: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const Booking = mongoose.model('HuntingBooking', bookingSchema);

async function addDonBurtisBooking() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Create Don Burtis booking
    const booking = new Booking({
      customerName: 'Don Burtis',
      email: 'D.burtis@yahoo.com',
      phone: '', // Can be updated later
      parcel: 'Both Properties',
      checkinDate: new Date('2024-12-31T00:00:00.000Z'),
      checkoutDate: new Date('2024-12-31T23:59:59.999Z'),
      numHunters: 1,
      gameSpecies: 'Hunting',
      campingFee: 0,
      totalPrice: 147.05,
      originalPrice: 196.07,
      discountCode: 'HUNTAGAIN',
      discountPercent: 25,
      paymentStatus: 'paid',
      paymentMethod: 'venmo',
      paypalTransactionId: 'VENMO-MANUAL',
      dailyRate: 300,
      numNights: 0,
      status: 'confirmed',
      waiverSigned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await booking.save();
    console.log('\n✅ SUCCESS! Don Burtis booking added:');
    console.log('-----------------------------------');
    console.log('Name:', booking.customerName);
    console.log('Email:', booking.email);
    console.log('Date: December 31, 2024');
    console.log('Property: Both Properties');
    console.log('Hunters:', booking.numHunters);
    console.log('Payment: Venmo - $147.05 (HUNTAGAIN 25% off)');
    console.log('Status:', booking.status);
    console.log('Booking ID:', booking._id);
    console.log('-----------------------------------\n');

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

addDonBurtisBooking();
