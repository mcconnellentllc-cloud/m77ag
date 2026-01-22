// Equipment Purchase Confirmation Email Template
const getEquipmentPurchaseEmail = (purchaseData) => {
  const {
    buyerName,
    buyerEmail,
    buyerPhone,
    equipmentTitle,
    equipmentId,
    listPrice,
    finalPrice,
    acceptedAt
  } = purchaseData;

  const savings = listPrice - finalPrice;
  const savingsPercent = ((savings / listPrice) * 100).toFixed(1);
  const purchaseDate = new Date(acceptedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>M77 AG Equipment Purchase Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d5016 0%, #1a3009 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">M77 AG</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Equipment Sales</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="background-color: #27ae60; padding: 25px 30px; text-align: center;">
              <p style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Purchase Confirmed!</p>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your offer has been accepted</p>
            </td>
          </tr>

          <!-- Purchase Details -->
          <tr>
            <td style="padding: 40px 30px 30px 30px;">
              <h2 style="color: #2d5016; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Purchase Agreement</h2>
              <p style="color: #666; margin: 0; font-size: 14px;">Date: ${purchaseDate}</p>
            </td>
          </tr>

          <!-- Buyer Information -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Buyer Information</h3>
                    <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Name:</strong> ${buyerName}</p>
                    <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${buyerEmail}</p>
                    ${buyerPhone ? `<p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Phone:</strong> ${buyerPhone}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Equipment Details -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #2d5016; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Equipment Details</h3>
              <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px; font-weight: 600;">Item</td>
                  <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #1a1a1a; font-size: 14px; font-weight: 600;">${equipmentTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px; font-weight: 600;">List Price</td>
                  <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #999; font-size: 14px; text-decoration: line-through;">$${listPrice.toLocaleString()}</td>
                </tr>
                ${savings > 0 ? `
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; color: #27ae60; font-size: 14px; font-weight: 600;">Your Savings</td>
                  <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #27ae60; font-size: 14px; font-weight: 600;">-$${savings.toLocaleString()} (${savingsPercent}%)</td>
                </tr>
                ` : ''}
                <tr style="background-color: #2d5016;">
                  <td style="padding: 18px 15px; color: #ffffff; font-size: 18px; font-weight: 700;">Your Price</td>
                  <td style="padding: 18px 15px; text-align: right; color: #ffffff; font-size: 22px; font-weight: 700;">$${finalPrice.toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Options -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fff4e6; border-left: 4px solid #d4af37; padding: 25px; border-radius: 4px;">
                <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Payment Options</h3>

                <div style="margin-bottom: 20px;">
                  <p style="color: #333; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Option 1: ACH Bank Transfer</p>
                  <p style="color: #666; margin: 0; font-size: 14px;">Contact us for bank routing details</p>
                </div>

                <div>
                  <p style="color: #333; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Option 2: Mail a Check</p>
                  <p style="color: #666; margin: 0; font-size: 14px;">
                    Make payable to: <strong>M77 Ag</strong><br>
                    34549 HWY 59<br>
                    Haxtun, CO 80731
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Pickup Information -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #e8f5e9; border-radius: 6px; padding: 25px; text-align: center;">
                <h3 style="color: #2d5016; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Arrange Pickup</h3>
                <p style="color: #333; margin: 0 0 10px 0; font-size: 14px;">Contact Kyle McConnell to schedule pickup:</p>
                <a href="tel:970-571-1015" style="color: #2d5016; font-size: 24px; font-weight: 700; text-decoration: none;">(970) 571-1015</a>
                <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">Location: Phillips County, CO</p>
              </div>
            </td>
          </tr>

          <!-- Terms -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #2d5016; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Terms & Conditions</h3>
              <div style="color: #666; font-size: 13px; line-height: 1.7;">
                <p style="margin: 0 0 10px 0;"><strong>1. Payment:</strong> Full payment is required before equipment release. Equipment will be held for 7 days from purchase confirmation.</p>
                <p style="margin: 0 0 10px 0;"><strong>2. Inspection:</strong> Buyer is encouraged to inspect equipment before pickup. Equipment is sold as-is, where-is.</p>
                <p style="margin: 0 0 10px 0;"><strong>3. Transport:</strong> Buyer is responsible for arranging and paying for transportation.</p>
                <p style="margin: 0 0 10px 0;"><strong>4. Title:</strong> A bill of sale will be provided upon payment. Title transfer (if applicable) is the buyer's responsibility.</p>
              </div>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; text-align: center;">
                <p style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Questions about your purchase?</p>
                <p style="color: #666; margin: 0; font-size: 14px;">Email: <a href="mailto:office@m77ag.com" style="color: #2d5016; text-decoration: none; font-weight: 600;">office@m77ag.com</a></p>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Phone: <strong>(970) 774-3276</strong></p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <p style="color: #d4af37; margin: 0 0 10px 0; font-size: 18px; font-weight: 700;">Thank you for your business!</p>
              <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 12px;">&copy; ${new Date().getFullYear()} M77 AG. All rights reserved.</p>
              <p style="color: rgba(255,255,255,0.6); margin: 10px 0 0 0; font-size: 12px;">Quality Farm Equipment | Phillips County, Colorado</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Admin notification email for equipment purchase
const getAdminEquipmentNotification = (purchaseData) => {
  const {
    buyerName,
    buyerEmail,
    buyerPhone,
    equipmentTitle,
    equipmentId,
    listPrice,
    finalPrice,
    acceptedAt
  } = purchaseData;

  const savings = listPrice - finalPrice;
  const savingsPercent = ((savings / listPrice) * 100).toFixed(1);
  const purchaseDate = new Date(acceptedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Equipment Sale Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">EQUIPMENT SOLD!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">$${finalPrice.toLocaleString()}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #2d5016; margin: 0 0 5px 0; font-size: 22px;">${equipmentTitle}</h2>
              <p style="color: #666; margin: 0 0 25px 0; font-size: 14px;">${purchaseDate}</p>

              <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Buyer Information</h3>
                <p style="margin: 5px 0; color: #333;"><strong>Name:</strong> ${buyerName}</p>
                <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> <a href="mailto:${buyerEmail}" style="color: #2d5016;">${buyerEmail}</a></p>
                ${buyerPhone ? `<p style="margin: 5px 0; color: #333;"><strong>Phone:</strong> <a href="tel:${buyerPhone}" style="color: #2d5016;">${buyerPhone}</a></p>` : ''}
              </div>

              <h3 style="color: #2d5016; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Sale Details</h3>
              <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-bottom: 25px;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px; border: 1px solid #e0e0e0; color: #666;">List Price</td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right; color: #333;">$${listPrice.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; color: #666;">Sale Price</td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right; color: #27ae60; font-weight: 700;">$${finalPrice.toLocaleString()}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px; border: 1px solid #e0e0e0; color: #666;">Discount Given</td>
                  <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right; color: ${savings > 0 ? '#c0392b' : '#333'};">${savings > 0 ? `-$${savings.toLocaleString()} (${savingsPercent}%)` : 'Full Price'}</td>
                </tr>
              </table>

              <div style="background-color: #fff4e6; border-left: 4px solid #d4af37; padding: 20px; border-radius: 4px;">
                <p style="color: #333; margin: 0; font-size: 14px;"><strong>Action Required:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #666; font-size: 14px;">
                  <li>Confirmation email sent to buyer</li>
                  <li>Follow up to arrange payment and pickup</li>
                  <li>Mark equipment as SOLD on website when complete</li>
                </ul>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 12px;">M77 AG Equipment Sales Admin</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  getEquipmentPurchaseEmail,
  getAdminEquipmentNotification
};
