// Email template for hunting booking confirmation
function getHuntingConfirmationEmail(booking) {
  const propertyName = booking.property === 'heritage-farm' ? 'M77 AG Heritage Farm' : 'Prairie Peace';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2c5530;
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .booking-details {
      background-color: white;
      padding: 20px;
      border-left: 4px solid #d4a54a;
      margin: 20px 0;
    }
    .detail-row {
      margin: 10px 0;
    }
    .detail-label {
      font-weight: bold;
      color: #2c5530;
    }
    .price {
      font-size: 24px;
      color: #d4a54a;
      font-weight: bold;
      margin: 15px 0;
    }
    .important-info {
      background-color: #fff3cd;
      border: 2px solid #d4a54a;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .important-info h3 {
      color: #856404;
      margin-top: 0;
    }
    .warning-box {
      background-color: #f8d7da;
      border: 2px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .warning-box h3 {
      color: #721c24;
      margin-top: 0;
    }
    .btn {
      display: inline-block;
      background-color: #d4a54a;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 15px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Hunting Reservation Confirmed!</h1>
    <p>M77 AG - Four Generations of Agricultural Excellence</p>
  </div>
  
  <div class="content">
    <p>Dear ${booking.customerName},</p>
    
    <p>Thank you for booking your hunting experience with M77 AG! Your reservation has been confirmed.</p>
    
    <div class="booking-details">
      <h2 style="color: #2c5530; margin-top: 0;">Booking Information</h2>
      
      <div class="detail-row">
        <span class="detail-label">Property:</span> ${propertyName}
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Check-in Date:</span> ${new Date(booking.checkinDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Check-out Date:</span> ${new Date(booking.checkoutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Number of Hunters:</span> ${booking.numberOfHunters}
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Number of Nights:</span> ${booking.numberOfNights}
      </div>
      
      <div class="price">
        Total Price: $${booking.totalPrice}
      </div>

      <div class="detail-row">
        <span class="detail-label">Payment Status:</span> ${booking.paymentStatus === 'paid' ? 'Paid' : 'Pay on Arrival'}
      </div>

      ${booking.discountCode ? `
      <div style="background: #e8f5e9; border: 2px solid #4caf50; padding: 15px; margin-top: 15px; border-radius: 8px; text-align: center;">
        <h3 style="color: #2e7d32; margin: 0 0 10px 0;">KYLE CARES PROGRAM</h3>
        <p style="margin: 0; color: #2e7d32; font-size: 16px;">
          Thank you for being a valued member of the Kyle Cares Program!<br>
          <strong>${booking.discountPercent}% discount applied</strong><br>
          ${booking.originalPrice ? `<span style="text-decoration: line-through;">Original: $${booking.originalPrice}</span>` : ''}
        </p>
        <p style="margin: 10px 0 0 0; color: #2e7d32; font-style: italic;">
          We truly appreciate you and are honored to have you hunt with us.
        </p>
      </div>
      ` : ''}
    </div>

    <div class="warning-box">
      <h3>REQUIRED: All Hunters Must Sign Waiver</h3>
      <p><strong>EVERY hunter in your party MUST sign the liability waiver before hunting.</strong></p>
      <p><strong>You have ${booking.numberOfHunters || booking.numHunters} hunters booked.</strong> Each person needs to sign individually.</p>
      <p style="margin-top: 15px;"><strong>Share this link with your entire hunting party:</strong></p>
      <a href="https://m77ag.com/sign-waiver.html?bookingId=${booking._id}" class="btn" style="margin-bottom: 15px;">SIGN WAIVER - ALL HUNTERS</a>
      <p style="font-size: 14px; color: #666; margin-top: 10px;">
        Each hunter can sign using your Booking ID: <strong>${booking._id.toString().slice(-8).toUpperCase()}</strong><br>
        Or they can sign manually and we'll match it to your booking by date.
      </p>
      <p style="margin-top: 15px; color: #721c24; font-weight: bold;">
        WARNING: No one will be allowed to hunt without a signed waiver.
      </p>
    </div>
    
    <div class="important-info">
      <h3>Important Information:</h3>
      <ul>
        <li><strong>All hunters must have valid Colorado hunting licenses</strong></li>
        <li><strong>Call Kyle for downed game protocol: 970-571-1015</strong></li>
        <li>Respect property boundaries and game rest periods</li>
        <li>Pack out what you pack in</li>
        <li>You have reserved the entire property for the day(s) selected</li>
      </ul>
    </div>

    <p>If you have any questions or need to make changes to your reservation, please contact us:</p>
    <p>
      <strong>Kyle McConnell</strong><br>
      Phone: 970-571-1015<br>
      Email: hunting@m77ag.com
    </p>
    
    <p>We look forward to hosting you!</p>
    
    <p>Best regards,<br>
    <strong>The M77 AG Team</strong><br>
    <em>Four Generations Strong Since the Late 1800s</em></p>
  </div>
  
  <div class="footer">
    <p>M77 AG | Northeast Colorado</p>
    <p>This is an automated confirmation email.</p>
  </div>
</body>
</html>
  `;
}

// Admin notification email
function getAdminNotificationEmail(booking) {
  const propertyName = booking.property === 'heritage-farm' ? 'M77 AG Heritage Farm' : 'Prairie Peace';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c5530; color: white; padding: 20px; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .detail { margin: 10px 0; }
    .label { font-weight: bold; color: #2c5530; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Hunting Booking Received</h2>
    </div>
    
    <div class="content">
      <h3>Customer Information:</h3>
      <div class="detail"><span class="label">Name:</span> ${booking.customerName}</div>
      <div class="detail"><span class="label">Email:</span> ${booking.email}</div>
      <div class="detail"><span class="label">Phone:</span> ${booking.phone}</div>
      
      <h3>Booking Details:</h3>
      <div class="detail"><span class="label">Property:</span> ${propertyName}</div>
      <div class="detail"><span class="label">Check-in:</span> ${new Date(booking.checkinDate).toLocaleDateString()}</div>
      <div class="detail"><span class="label">Check-out:</span> ${new Date(booking.checkoutDate).toLocaleDateString()}</div>
      <div class="detail"><span class="label">Hunters:</span> ${booking.numberOfHunters}</div>
      <div class="detail"><span class="label">Nights:</span> ${booking.numberOfNights}</div>
      <div class="detail"><span class="label">Total Price:</span> $${booking.totalPrice}</div>
      <div class="detail"><span class="label">Payment Status:</span> ${booking.paymentStatus}</div>
      ${booking.discountCode ? `
      <div class="detail" style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-left: 3px solid #4caf50;">
        <span class="label" style="color: #2e7d32;">Kyle Cares Program:</span> ${booking.discountCode} (${booking.discountPercent}% off)
        ${booking.originalPrice ? `<br><span style="color: #666;">Original Price: $${booking.originalPrice}</span>` : ''}
      </div>
      ` : ''}
      
      <p style="margin-top: 20px;">
        <a href="https://m77ag.com/admin/hunting-bookings.html" style="background-color: #2c5530; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Admin Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  getHuntingConfirmationEmail,
  getAdminNotificationEmail
};