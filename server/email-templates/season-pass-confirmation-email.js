// season-pass-confirmation-email.js
// Sent immediately after a season pass is paid for, whether the purchase was
// completed on the website or recorded by the office from an off-site payment
// (PayPal invoice, check, cash). Contains the liability waiver link and the
// property boundary maps so the pass holder has everything before arrival.

const WAIVER_URL = 'https://m77ag.com/sign-waiver.html';

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function passLabel(pass) {
  return pass.type === '10-day' ? '10-Day Season Pass' : '5-Day Season Pass';
}

function getSeasonPassConfirmationEmail(data) {
  const pass = data.seasonPass || {};
  const paymentReference = pass.paymentReference
    ? `<div class="row"><span class="label">Payment Reference:</span> <span class="value">${pass.paymentReference}</span></div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f3f0;
    }
    .header {
      background: #2c5530;
      color: #fff;
      padding: 30px 25px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 1px;
    }
    .header p {
      margin: 8px 0 0 0;
      color: #d4a54a;
      font-size: 15px;
    }
    .content {
      background: #fff;
      padding: 30px 25px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #2c5530;
      font-size: 18px;
      margin: 0 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #d4a54a;
    }
    .row {
      padding: 6px 0;
    }
    .label {
      font-weight: bold;
      color: #2c5530;
      display: inline-block;
      min-width: 180px;
    }
    .value {
      color: #333;
    }
    .action-box {
      background: #f5f3f0;
      border-left: 4px solid #d4a54a;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .btn {
      display: inline-block;
      background: #2d5016;
      color: #fff;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin-top: 10px;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    a {
      color: #2c5530;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 13px;
      padding: 25px 15px 5px 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>M77 AG HUNTING</h1>
    <p>Season Pass Confirmed</p>
  </div>

  <div class="content">
    <p>${data.name},</p>
    <p>Your ${passLabel(pass)} is confirmed and your payment has been received. Your pass covers both properties - Heritage Farm and Prairie Peace - a total of 2,710 acres.</p>

    <div class="section">
      <h2>Pass Details</h2>
      <div class="row"><span class="label">Pass Type:</span> <span class="value">${passLabel(pass)}</span></div>
      <div class="row"><span class="label">Day Credits:</span> <span class="value">${pass.creditsRemaining} of ${pass.creditsTotal} remaining</span></div>
      <div class="row"><span class="label">Purchase Date:</span> <span class="value">${formatDate(pass.purchaseDate)}</span></div>
      <div class="row"><span class="label">Valid Through:</span> <span class="value">${formatDate(pass.expiresAt)}</span></div>
      <div class="row"><span class="label">Amount Paid:</span> <span class="value">${formatCurrency(pass.amountPaid)}</span></div>
      ${paymentReference}
    </div>

    <div class="section">
      <h2>Required: Liability Waiver</h2>
      <div class="action-box">
        <p style="margin-top: 0;"><strong>Every hunter in your party must sign the liability waiver before hunting.</strong> No one will be allowed on the property without a signed waiver on file.</p>
        <p>Share the link below with each member of your party. Each hunter signs individually.</p>
        <a href="${WAIVER_URL}" class="btn">SIGN LIABILITY WAIVER</a>
        <p style="margin-bottom: 0; font-size: 13px; color: #666;">If the button does not work, copy this address into your browser: ${WAIVER_URL}</p>
      </div>
    </div>

    <div class="section">
      <h2>Property Maps and Boundaries</h2>
      <p>Review the property boundaries before you arrive. Hunting is permitted only inside the marked boundaries.</p>
      <p><strong>View and print property guides:</strong></p>
      <ul>
        <li><a href="https://m77ag.com/heritage-farm-map-printable.html">Heritage Farm Property Guide (print version)</a></li>
        <li><a href="https://m77ag.com/prairie-peace-map-printable.html">Prairie Peace Property Guide (print version)</a></li>
      </ul>
      <p><strong>Interactive maps:</strong></p>
      <ul>
        <li><a href="https://m77ag.com/heritage-farm-map.html">Heritage Farm Interactive Map</a></li>
        <li><a href="https://m77ag.com/prairie-peace-map.html">Prairie Peace Interactive Map</a></li>
      </ul>
      <p><strong>GPS boundary files for OnX, Google Earth and handheld units:</strong></p>
      <ul>
        <li><a href="https://m77ag.com/maps/Heritage-Farm-Boundaries.kml">Heritage Farm Boundaries (KML)</a></li>
        <li><a href="https://m77ag.com/maps/Prairie-Peace-Boundaries.kml">Prairie Peace Boundaries (KML)</a></li>
      </ul>
    </div>

    <div class="section">
      <h2>Booking Your Days</h2>
      <p>Each hunt day draws one credit from your pass. Reserve your dates from your account:</p>
      <a href="https://m77ag.com/my-account.html" class="btn">GO TO MY ACCOUNT</a>
    </div>

    <div class="section">
      <h2>Before You Arrive</h2>
      <ul>
        <li>Confirm every hunter has signed the waiver</li>
        <li>Bring a valid Colorado hunting license for each hunter</li>
        <li>Download the property boundaries to your GPS or phone - cell service is limited</li>
        <li>Emergency contact on property: 970-571-1015</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    <p>M77 AG Hunting<br>
    Email: hunting@m77ag.com | Phone: 970-520-1807</p>
  </div>
</body>
</html>
`;
}

function getAdminSeasonPassNotification(data) {
  const pass = data.seasonPass || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f3f0; }
    .header { background: #2c5530; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { background: #fff; padding: 25px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    td { padding: 8px 0; border-bottom: 1px solid #eee; vertical-align: top; }
    td.label { font-weight: bold; color: #2c5530; width: 40%; }
    .btn { display: inline-block; background: #2d5016; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Season Pass Sold - ${data.name}</h1>
  </div>
  <div class="content">
    <table>
      <tr><td class="label">Customer:</td><td>${data.name}</td></tr>
      <tr><td class="label">Email:</td><td>${data.email}</td></tr>
      <tr><td class="label">Phone:</td><td>${data.phone || 'Not provided'}</td></tr>
      <tr><td class="label">Pass Type:</td><td>${passLabel(pass)}</td></tr>
      <tr><td class="label">Credits:</td><td>${pass.creditsRemaining} of ${pass.creditsTotal} remaining</td></tr>
      <tr><td class="label">Purchase Date:</td><td>${formatDate(pass.purchaseDate)}</td></tr>
      <tr><td class="label">Valid Through:</td><td>${formatDate(pass.expiresAt)}</td></tr>
      <tr><td class="label">Amount Paid:</td><td>${formatCurrency(pass.amountPaid)}</td></tr>
      <tr><td class="label">Payment Method:</td><td>${pass.paymentMethod || 'paypal'}</td></tr>
      <tr><td class="label">Payment Reference:</td><td>${pass.paymentReference || 'Not recorded'}</td></tr>
      <tr><td class="label">Recorded By:</td><td>${data.recordedBy || 'Website purchase'}</td></tr>
    </table>
    <p>The waiver link and property maps have been emailed to the customer.</p>
    <a href="https://m77ag.com/admin/hunting-bookings.html" class="btn">Open Admin Dashboard</a>
  </div>
</body>
</html>
`;
}

module.exports = {
  getSeasonPassConfirmationEmail,
  getAdminSeasonPassNotification
};
