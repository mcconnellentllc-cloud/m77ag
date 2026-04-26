// Email template for review thank you with discount code
function getReviewThankYouEmail(review) {
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
    .discount-box {
      background: linear-gradient(135deg, #d4a54a 0%, #c09440 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px;
      margin: 25px 0;
      box-shadow: 0 4px 15px rgba(212, 165, 74, 0.3);
    }
    .discount-box h2 {
      margin: 0 0 15px 0;
      font-size: 32px;
    }
    .discount-code {
      background: white;
      color: #2c5530;
      padding: 20px;
      border-radius: 8px;
      font-size: 48px;
      font-weight: bold;
      letter-spacing: 4px;
      margin: 20px 0;
      border: 3px dashed #2c5530;
    }
    .discount-details {
      font-size: 18px;
      margin-top: 15px;
    }
    .how-to-use {
      background-color: white;
      padding: 20px;
      border-left: 4px solid #2c5530;
      margin: 20px 0;
    }
    .how-to-use h3 {
      color: #2c5530;
      margin-top: 0;
    }
    .btn {
      display: inline-block;
      background-color: #2c5530;
      color: white;
      padding: 15px 35px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
    .stars {
      color: #d4a54a;
      font-size: 24px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Thank You! 🎉</h1>
    <p>M77 AG - Four Generations of Agricultural Excellence</p>
  </div>

  <div class="content">
    <p>Dear ${review.customerName},</p>

    <p style="font-size: 18px; color: #2c5530;">
      <strong>We truly appreciate you taking the time to share your experience with us!</strong>
    </p>

    <div class="stars">
      ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
    </div>

    <p>Your feedback helps us continue to provide the best hunting experience possible and helps other hunters know what to expect when they visit M77 AG.</p>

    <div class="discount-box">
      <h2>Here's a Special Thank You! 🎁</h2>
      <div class="discount-code">
        REVIEW
      </div>
      <div class="discount-details">
        <strong>75% OFF</strong> Your Next Hunt!
      </div>
      <p style="margin-top: 20px; font-size: 16px;">
        This is our way of saying thanks for being part of the M77 AG family.
      </p>
    </div>

    <div class="how-to-use">
      <h3>How to Use Your Discount Code:</h3>
      <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
        <li>Visit our <a href="https://m77ag.com/hunting" style="color: #2c5530;">hunting reservation page</a></li>
        <li>Select your dates and property</li>
        <li>Enter discount code <strong>REVIEW</strong> in the discount code field</li>
        <li>Watch your price drop by 75%!</li>
      </ol>
      <p style="margin-top: 15px; color: #666; font-size: 14px;">
        <strong>Note:</strong> This code can be used on your next booking and never expires. We honor loyalty!
      </p>
    </div>

    <div style="text-align: center;">
      <a href="https://m77ag.com/hunting" class="btn">Book Your Next Hunt</a>
    </div>

    <p style="margin-top: 30px;">
      We're honored to have you as part of our hunting community and look forward to hosting you again soon!
    </p>

    <p>If you have any questions or need assistance booking, please don't hesitate to reach out:</p>
    <p>
      <strong>Kyle McConnell</strong><br>
      Phone: 970-571-1015<br>
      Email: hunting@m77ag.com
    </p>

    <p>Best regards,<br>
    <strong>The M77 AG Team</strong><br>
    <em>Four Generations Strong Since the Late 1800s</em></p>
  </div>

  <div class="footer">
    <p>M77 AG | Northeast Colorado</p>
    <p>Thank you for choosing M77 AG for your hunting experience!</p>
  </div>
</body>
</html>
  `;
}

// Admin notification email for new review
function getAdminReviewNotificationEmail(review) {
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
    .rating { color: #d4a54a; font-size: 20px; }
    .review-text {
      background: white;
      padding: 15px;
      border-left: 3px solid #d4a54a;
      margin: 15px 0;
      font-style: italic;
    }
    .positive { background: #e8f5e9; border-left: 3px solid #4caf50; padding: 10px; }
    .negative { background: #ffebee; border-left: 3px solid #f44336; padding: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Review Received</h2>
    </div>

    <div class="content">
      <h3>Customer Information:</h3>
      <div class="detail"><span class="label">Name:</span> ${review.customerName}</div>
      <div class="detail"><span class="label">Email:</span> ${review.email}</div>

      <h3>Review Details:</h3>
      <div class="detail"><span class="label">Property:</span> ${review.property}</div>
      ${review.huntDate ? `<div class="detail"><span class="label">Hunt Date:</span> ${new Date(review.huntDate).toLocaleDateString()}</div>` : ''}
      <div class="detail">
        <span class="label">Rating:</span>
        <span class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
        (${review.rating}/5)
      </div>
      <div class="detail">
        <span class="label">Would Recommend:</span>
        ${review.wouldRecommend ? '<span style="color: #4caf50;">✓ Yes</span>' : '<span style="color: #f44336;">✗ No</span>'}
      </div>

      <h3>Review Text:</h3>
      <div class="review-text">
        "${review.reviewText}"
      </div>

      ${review.rating >= 4 || review.wouldRecommend ? `
      <div class="positive">
        <strong>✓ Positive Review</strong><br>
        Discount code REVIEW automatically sent to customer (75% off)
      </div>
      ` : `
      <div class="negative">
        <strong>⚠ Negative Review</strong><br>
        No discount code sent. Please follow up with customer.
      </div>
      `}

      <div class="detail" style="margin-top: 15px;">
        <span class="label">Status:</span> ${review.status}
      </div>

      <p style="margin-top: 20px;">
        <a href="https://m77ag.com/admin/testimonials" style="background-color: #2c5530; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Admin Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  getReviewThankYouEmail,
  getAdminReviewNotificationEmail
};
