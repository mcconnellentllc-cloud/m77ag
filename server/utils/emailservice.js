const nodemailer = require('nodemailer');

// Create email transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'm77ag.notify@gmail.com',
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking) => {
  try {
    const transporter = createTransporter();
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2d5016; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #d4af37; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          h2 { color: #2d5016; }
          .price { font-size: 24px; font-weight: bold; color: #d4af37; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>M77 AG Hunting Reservation Confirmed</h1>
          </div>
          
          <div class="content">
            <h2>Thank you for booking with M77 AG!</h2>
            <p>Your hunting reservation has been confirmed. Here are your booking details:</p>
            
            <div class="details">
              <h3>Booking Information</h3>
              <p><strong>Property:</strong> ${booking.parcel}</p>
              <p><strong>Check-in Date:</strong> ${new Date(booking.checkinDate).toLocaleDateString()}</p>
              <p><strong>Check-out Date:</strong> ${new Date(booking.checkoutDate).toLocaleDateString()}</p>
              <p><strong>Number of Hunters:</strong> ${booking.numHunters}</p>
              <p><strong>Number of Nights:</strong> ${booking.numNights}</p>
              ${booking.campingFee > 0 ? `<p><strong>Camping:</strong> Included</p>` : ''}
              <p class="price"><strong>Total Price:</strong> $${booking.totalPrice}</p>
              <p><strong>Payment Status:</strong> ${booking.paymentStatus === 'pending' ? 'Pay on Arrival' : 'Paid via PayPal'}</p>
            </div>
            
            <h3>Important Information:</h3>
            <ul>
              <li>All hunters must have valid Colorado hunting licenses</li>
              <li>Check-in time: 30 minutes before sunrise</li>
              <li>Call Kyle for downed game protocol: <strong>970-571-1015</strong></li>
              <li>Respect property boundaries and game rest periods</li>
              <li>Pack out what you pack in</li>
            </ul>
            
            <div style="background: #fff3cd; border: 2px solid #856404; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ REQUIRED: Sign Liability Waiver</h3>
              <p style="margin: 10px 0;"><strong>Before your hunt, you MUST sign the liability waiver.</strong></p>
              <a href="https://m77ag.com/hunting.html#waiver" style="background: #d4af37; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; margin: 10px 0; border-radius: 5px; font-weight: bold;">SIGN WAIVER NOW</a>
              <p style="font-size: 14px; margin: 10px 0;">You will not be allowed to hunt without a signed waiver.</p>
            </div>
            
            <h3>Property Maps & Boundaries:</h3>
            <p>Download your property map and boundary information:</p>
            <ul>
              <li><a href="https://m77ag.com/maps/${booking.parcel === 'M77 AG Heritage Farm' ? 'heritage-farm-map.pdf' : 'prairie-peace-map.pdf'}" style="color: #2d5016; font-weight: bold;">📍 Download ${booking.parcel} Map</a></li>
              <li>Respect all posted boundaries and game rest areas</li>
              <li>Orange areas on map indicate rest periods (no hunting)</li>
            </ul>
            
            <h3>Contact Information:</h3>
            <p><strong>Kyle McConnell</strong></p>
            <p>Phone: <a href="tel:970-571-1015">970-571-1015</a></p>
            <p>Email: <a href="mailto:office@m77ag.com">office@m77ag.com</a></p>
          </div>
          
          <div class="footer">
            <p>M77 AG - Four Generations of Northeast Colorado Farming</p>
            <p>Sedgwick County | Logan County</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Email to customer
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'm77ag.notify@gmail.com'}>`,
      replyTo: 'office@m77ag.com',
      to: booking.email,
      subject: `Hunting Reservation Confirmed - ${booking.parcel}`,
      html: emailHTML
    });
    
    // Email to admin/Kyle
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'm77ag.notify@gmail.com'}>`,
      replyTo: 'office@m77ag.com',
      to: 'hunting@m77ag.com',
      subject: `New Booking: ${booking.customerName} - ${booking.parcel}`,
      html: `
        <h2>New Hunting Reservation</h2>
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Property:</strong> ${booking.parcel}</p>
        <p><strong>Dates:</strong> ${new Date(booking.checkinDate).toLocaleDateString()} to ${new Date(booking.checkoutDate).toLocaleDateString()}</p>
        <p><strong>Hunters:</strong> ${booking.numHunters}</p>
        <p><strong>Total:</strong> $${booking.totalPrice}</p>
        <p><strong>Payment:</strong> ${booking.paymentStatus === 'pending' ? 'Pay on Arrival' : 'Paid via PayPal'}</p>
      `
    });
    
    console.log('Booking confirmation emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation
};