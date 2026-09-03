// customer-card-link-email.js
// Passwordless sign-in link to a customer's card, where they can see their
// reservations, signed waivers, season pass credits and invoices.

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getCustomerCardLinkEmail({ name, url, expiresAt }) {
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
      max-width: 640px;
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
    .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
    .header p { margin: 8px 0 0 0; color: #d4a54a; font-size: 15px; }
    .content {
      background: #fff;
      padding: 30px 25px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .btn {
      display: inline-block;
      background: #2d5016;
      color: #fff;
      padding: 15px 35px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      font-size: 16px;
    }
    .link-box {
      background: #f5f3f0;
      border-left: 4px solid #d4a54a;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
      text-align: center;
    }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
    .raw-link {
      word-break: break-all;
      font-size: 12px;
      color: #666;
      margin-top: 15px;
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
    <p>Your Customer Card</p>
  </div>

  <div class="content">
    <p>${name ? name + ',' : 'Hello,'}</p>
    <p>Open your customer card to see everything on file with M77 AG:</p>

    <ul>
      <li>Your reservations and hunt dates</li>
      <li>Signed liability waivers for your party</li>
      <li>Season pass credits used and remaining</li>
      <li>Invoices, payments and any add-ons</li>
      <li>Property maps and boundary files</li>
    </ul>

    <div class="link-box">
      <a href="${url}" class="btn">OPEN MY CUSTOMER CARD</a>
      <div class="raw-link">If the button does not work, copy this address into your browser:<br>${url}</div>
    </div>

    <p>No password is needed. This link signs you in on its own${expiresAt ? ` and works through ${formatDate(expiresAt)}` : ''}. Request a new one from the customer card page any time.</p>
    <p style="font-size: 13px; color: #666;">Treat this link like a key to your account and do not forward it. If you did not request it, you can ignore this email.</p>
  </div>

  <div class="footer">
    <p>M77 AG Hunting<br>
    Email: hunting@m77ag.com | Phone: 970-520-1807</p>
  </div>
</body>
</html>
`;
}

module.exports = { getCustomerCardLinkEmail };
