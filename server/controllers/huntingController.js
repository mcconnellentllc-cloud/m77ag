// controllers/huntingController.js
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { generateHuntingConfirmationEmail } = require('../email-templates/hunting-confirmation-email');

// Hunting Booking Schema
const huntingBookingSchema = new mongoose.Schema({
    bookingNumber: {
        type: String,
        required: true,
        unique: true
    },
    property: {
        type: String,
        required: true,
        enum: ['M77 AG Heritage Farm', 'Heritage Farm', 'Prairie Peace']
    },
    hunterInfo: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: String,
        city: String,
        state: String,
        zip: String
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    numberOfHunters: {
        type: Number,
        required: true,
        min: 1
    },
    gameSpecies: [{
        type: String,
        required: true
    }],
    camping: {
        type: Boolean,
        default: false
    },
    totalCost: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentMethod: String,
    paymentTransactionId: String,
    waiverSigned: {
        type: Boolean,
        default: false
    },
    waiverSignedDate: Date,
    waiverData: {
        participantName: String,
        participantEmail: String,
        participantPhone: String,
        signatureDate: Date,
        signature: String,
        ipAddress: String,
        timestamp: Date
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const HuntingBooking = mongoose.model('HuntingBooking', huntingBookingSchema);

// Email transporter setup
const createEmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate unique booking number
const generateBookingNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `M77-${year}${month}-${random}`;
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        const bookingNumber = generateBookingNumber();
        
        const booking = new HuntingBooking({
            bookingNumber,
            ...req.body
        });

        await booking.save();

        // Generate waiver URL
        const waiverUrl = `${process.env.SITE_URL || 'https://m77ag.com'}/hunting-liability-waiver.html?booking=${booking._id}&bookingNumber=${bookingNumber}&property=${encodeURIComponent(booking.property)}&dates=${encodeURIComponent(booking.startDate.toLocaleDateString() + ' to ' + booking.endDate.toLocaleDateString())}`;

        // Generate payment URL (PayPal or your payment page)
        const paymentUrl = `${process.env.SITE_URL || 'https://m77ag.com'}/hunting-payment.html?booking=${booking._id}`;

        // Prepare email data
        const emailData = {
            bookingNumber: booking.bookingNumber,
            property: booking.property,
            hunterInfo: booking.hunterInfo,
            startDate: booking.startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            endDate: booking.endDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            numberOfHunters: booking.numberOfHunters,
            gameSpecies: booking.gameSpecies,
            camping: booking.camping,
            totalCost: booking.totalCost,
            paymentStatus: booking.paymentStatus,
            waiverUrl,
            paymentUrl
        };

        // Send confirmation email
        const transporter = createEmailTransporter();
        const emailContent = generateHuntingConfirmationEmail(emailData);

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'M77 AG Hunting <hunting@m77ag.com>',
            to: booking.hunterInfo.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        });

        // Send copy to admin
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'M77 AG Hunting <hunting@m77ag.com>',
            to: process.env.ADMIN_EMAILS || 'admin@m77ag.com',
            subject: `NEW BOOKING: ${bookingNumber} - ${booking.property}`,
            html: `
                <h2>New Hunting Reservation</h2>
                <p><strong>Booking Number:</strong> ${bookingNumber}</p>
                <p><strong>Property:</strong> ${booking.property}</p>
                <p><strong>Hunter:</strong> ${booking.hunterInfo.name}</p>
                <p><strong>Email:</strong> ${booking.hunterInfo.email}</p>
                <p><strong>Phone:</strong> ${booking.hunterInfo.phone}</p>
                <p><strong>Dates:</strong> ${emailData.startDate} to ${emailData.endDate}</p>
                <p><strong>Number of Hunters:</strong> ${booking.numberOfHunters}</p>
                <p><strong>Game Species:</strong> ${booking.gameSpecies.join(', ')}</p>
                <p><strong>Camping:</strong> ${booking.camping ? 'Yes' : 'No'}</p>
                <p><strong>Total Cost:</strong> $${booking.totalCost}</p>
                <p><strong>Payment Status:</strong> ${booking.paymentStatus}</p>
                <hr>
                <p><a href="${process.env.SITE_URL}/admin/bookings/${booking._id}">View in Admin Dashboard</a></p>
            `
        });

        res.status(201).json({
            success: true,
            message: 'Booking created successfully. Confirmation email sent.',
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                waiverUrl,
                paymentUrl
            }
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
};

// Submit liability waiver
exports.submitWaiver = async (req, res) => {
    try {
        const { bookingId, participantName, participantEmail, participantPhone, signatureDate, signature } = req.body;

        const booking = await HuntingBooking.findById(bookingId);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Get IP address
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Update booking with waiver data
        booking.waiverSigned = true;
        booking.waiverSignedDate = new Date();
        booking.waiverData = {
            participantName,
            participantEmail,
            participantPhone,
            signatureDate: new Date(signatureDate),
            signature,
            ipAddress,
            timestamp: new Date()
        };
        booking.status = 'confirmed';
        booking.updatedAt = new Date();

        await booking.save();

        // Send confirmation email
        const transporter = createEmailTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'M77 AG Hunting <hunting@m77ag.com>',
            to: booking.hunterInfo.email,
            subject: `Waiver Completed - ${booking.bookingNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2d5016; color: white; padding: 30px; text-align: center;">
                        <h1>LIABILITY WAIVER COMPLETED</h1>
                    </div>
                    <div style="padding: 30px; background: #f8f6f3;">
                        <h2>Thank You, ${participantName}!</h2>
                        <p>Your liability waiver has been successfully submitted and your hunting reservation is now complete.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Reservation Summary</h3>
                            <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
                            <p><strong>Property:</strong> ${booking.property}</p>
                            <p><strong>Dates:</strong> ${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()}</p>
                            ${booking.paymentStatus !== 'paid' ? `
                            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 15px;">
                                <strong>Payment Status:</strong> Payment still required before arrival<br>
                                <strong>Amount Due:</strong> $${booking.totalCost}
                            </div>
                            ` : ''}
                        </div>
                        
                        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Important Reminders</h3>
                            <ul>
                                <li>Download and review property boundary maps</li>
                                <li>Save emergency contact: Kyle McConnell 970-571-1015</li>
                                <li>Ensure all hunters have valid Colorado licenses</li>
                                <li>Arrive prepared with appropriate gear and equipment</li>
                            </ul>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            We look forward to seeing you!<br>
                            <strong>M77 AG</strong>
                        </p>
                    </div>
                </div>
            `
        });

        // Notify admin
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'M77 AG Hunting <hunting@m77ag.com>',
            to: process.env.ADMIN_EMAILS || 'admin@m77ag.com',
            subject: `WAIVER SIGNED: ${booking.bookingNumber}`,
            html: `
                <h2>Liability Waiver Signed</h2>
                <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
                <p><strong>Signed By:</strong> ${participantName}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${ipAddress}</p>
                <hr>
                <p><a href="${process.env.SITE_URL}/admin/bookings/${booking._id}">View Booking</a></p>
            `
        });

        res.json({
            success: true,
            message: 'Waiver submitted successfully',
            bookingNumber: booking.bookingNumber
        });

    } catch (error) {
        console.error('Error submitting waiver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit waiver',
            error: error.message
        });
    }
};

// Update payment status
exports.updatePayment = async (req, res) => {
    try {
        const { bookingId, paymentMethod, transactionId, amount } = req.body;

        const booking = await HuntingBooking.findById(bookingId);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.paymentStatus = 'paid';
        booking.paymentMethod = paymentMethod;
        booking.paymentTransactionId = transactionId;
        booking.updatedAt = new Date();

        await booking.save();

        // Send payment confirmation email
        const transporter = createEmailTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'M77 AG Hunting <hunting@m77ag.com>',
            to: booking.hunterInfo.email,
            subject: `Payment Confirmed - ${booking.bookingNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2d5016; color: white; padding: 30px; text-align: center;">
                        <h1>PAYMENT CONFIRMED</h1>
                    </div>
                    <div style="padding: 30px; background: #f8f6f3;">
                        <h2>Payment Received</h2>
                        <p>Thank you for your payment!</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
                            <p><strong>Amount:</strong> $${amount || booking.totalCost}</p>
                            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                            <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        </div>
                        
                        <p>Your hunting reservation is confirmed and paid in full.</p>
                        <p>See you soon!</p>
                    </div>
                </div>
            `
        });

        res.json({
            success: true,
            message: 'Payment confirmed',
            booking: {
                bookingNumber: booking.bookingNumber,
                paymentStatus: booking.paymentStatus
            }
        });

    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment',
            error: error.message
        });
    }
};

// Get all bookings (admin)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await HuntingBooking.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await HuntingBooking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await HuntingBooking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.status = 'cancelled';
        booking.updatedAt = new Date();
        await booking.save();

        // Send cancellation email
        const transporter = createEmailTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'M77 AG Hunting <hunting@m77ag.com>',
            to: booking.hunterInfo.email,
            subject: `Booking Cancelled - ${booking.bookingNumber}`,
            html: `
                <h2>Booking Cancelled</h2>
                <p>Your hunting reservation ${booking.bookingNumber} has been cancelled.</p>
                <p>If you have any questions, please contact us at 970-571-1015.</p>
            `
        });

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
};

module.exports = exports;