// Email template for waiver reminder
function getWaiverReminderEmail(booking) {
  const checkinDate = new Date(booking.checkinDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const checkoutDate = new Date(booking.checkoutDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
      background-color: #dc3545;
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
      border-left: 4px solid #2c5530;
      margin: 20px 0;
    }
    .detail-row {
      margin: 10px 0;
    }
    .detail-label {
      font-weight: bold;
      color: #2c5530;
    }
    .warning-box {
      background-color: #f8d7da;
      border: 2px solid #dc3545;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .warning-box h3 {
      color: #721c24;
      margin-top: 0;
    }
    .btn {
      display: inline-block;
      background-color: #dc3545;
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 5px;
      margin: 15px 0;
      font-weight: bold;
      font-size: 16px;
    }
    .info-box {
      background-color: #d1ecf1;
      border: 2px solid #0c5460;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
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
    <h1>⚠️ WAIVER REMINDER ⚠️</h1>
  </div>

  <div class="content">
    <p>Hello ${booking.customerName},</p>

    <p>This is a reminder that <strong>ALL hunters in your party MUST sign the liability waiver before hunting at M77 AG.</strong></p>

    <div class="booking-details">
      <h3 style="margin-top: 0; color: #2c5530;">Your Booking Details:</h3>
      <div class="detail-row">
        <span class="detail-label">Property:</span> ${booking.parcel}
      </div>
      <div class="detail-row">
        <span class="detail-label">Check-in:</span> ${checkinDate}
      </div>
      <div class="detail-row">
        <span class="detail-label">Check-out:</span> ${checkoutDate}
      </div>
      <div class="detail-row">
        <span class="detail-label">Number of Hunters:</span> ${booking.numHunters || booking.numberOfHunters}
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking ID:</span> ${booking._id.toString().slice(-8).toUpperCase()}
      </div>
    </div>

    <div class="warning-box">
      <h3>ACTION REQUIRED</h3>
      <p><strong>Each hunter needs to sign the waiver individually.</strong></p>
      <p>Share this link with your entire hunting party:</p>
      <div style="text-align: center;">
        <a href="https://m77ag.com/sign-waiver.html?bookingId=${booking._id}" class="btn">SIGN WAIVER NOW</a>
      </div>
      <p style="font-size: 14px; color: #666; margin-top: 15px;">
        Each hunter can use your Booking ID: <strong>${booking._id.toString().slice(-8).toUpperCase()}</strong><br>
        Or they can sign manually at the link above.
      </p>
      <p style="margin-top: 15px; color: #721c24; font-weight: bold; font-size: 16px;">
        ⚠️ WARNING: No one will be allowed to hunt without a signed waiver.
      </p>
    </div>

    <div class="info-box">
      <h4 style="margin-top: 0; color: #0c5460;">How to Complete the Waiver:</h4>
      <ol>
        <li>Click the button above or copy this link: https://m77ag.com/sign-waiver.html?bookingId=${booking._id}</li>
        <li>Share the link with ALL hunters in your party</li>
        <li>Each person fills out their information and signs electronically</li>
        <li>You'll receive email confirmation once all waivers are signed</li>
      </ol>
    </div>

    <p>If you have any questions or need assistance, please contact us:</p>
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
    <p>This is an automated reminder email.</p>
  </div>
</body>
</html>
  `;
}

module.exports = { getWaiverReminderEmail };
