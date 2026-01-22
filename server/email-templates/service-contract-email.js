// Service Contract Email Template
const getServiceContractEmail = (serviceData) => {
  const {
    name,
    email,
    phone,
    serviceType,
    acres,
    basePrice,
    discountPercentage,
    discountAmount,
    totalPrice,
    notes
  } = serviceData;

  // Format service type display name
  const serviceDisplayNames = {
    'planting': 'Planting Service',
    'disking': 'Disking Service',
    'ripping': 'Ripping Service',
    'deep-ripping': 'Deep Ripping Service',
    'harvesting-corn': 'Corn Harvesting',
    'harvesting-wheat': 'Wheat Harvesting',
    'harvesting-milo': 'Milo Harvesting',
    'drilling': 'Drilling Service',
    'field-cultivation': 'Field Cultivation'
  };

  const serviceDisplay = serviceDisplayNames[serviceType] || serviceType;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>M77 AG Service Contract</title>
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
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Custom Farming Services</p>
            </td>
          </tr>

          <!-- Contract Title -->
          <tr>
            <td style="padding: 40px 30px 30px 30px;">
              <h2 style="color: #2d5016; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">Service Contract</h2>
              <p style="color: #666; margin: 0; font-size: 14px;">Contract Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </td>
          </tr>

          <!-- Customer Information -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Customer Information</h3>
                    <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Name:</strong> ${name}</p>
                    <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Phone:</strong> ${phone}</p>
                    ${email ? `<p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Email:</strong> ${email}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Service Details -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #2d5016; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Service Details</h3>
              <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px; font-weight: 600;">Service</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #1a1a1a; font-size: 14px;">${serviceDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px; font-weight: 600;">Acres</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #1a1a1a; font-size: 14px;">${acres} acres</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px; font-weight: 600;">Base Price</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #1a1a1a; font-size: 14px;">$${basePrice.toFixed(2)}</td>
                </tr>
                ${discountPercentage > 0 ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #2d5016; font-size: 14px; font-weight: 600;">Volume Discount (${discountPercentage}%)</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #2d5016; font-size: 14px;">-$${discountAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="background-color: #2d5016;">
                  <td style="padding: 15px 12px; color: #ffffff; font-size: 16px; font-weight: 700;">Total Contract Amount</td>
                  <td style="padding: 15px 12px; text-align: right; color: #ffffff; font-size: 18px; font-weight: 700;">$${totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${notes ? `
          <!-- Additional Notes -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #2d5016; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Additional Notes</h3>
              <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">${notes}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Payment Terms -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fff4e6; border-left: 4px solid #d4af37; padding: 20px; border-radius: 4px;">
                <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Payment Terms</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
                  <li>Payment is due upon completion of services</li>
                  <li>Accepted payment methods: Check, Cash, Bank Transfer</li>
                  <li>Net 30 days from invoice date</li>
                  <li>A 1.5% monthly finance charge will be applied to overdue balances</li>
                  <li>M77 AG reserves the right to suspend services for past-due accounts</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Terms & Conditions -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #2d5016; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Terms & Conditions</h3>
              <div style="color: #666; font-size: 13px; line-height: 1.7;">
                <p style="margin: 0 0 10px 0;"><strong>1. Service Guarantee:</strong> M77 AG guarantees professional service performed with modern equipment by experienced operators.</p>
                <p style="margin: 0 0 10px 0;"><strong>2. Weather Delays:</strong> Services are subject to weather conditions and field accessibility. Delays due to weather will not incur additional charges.</p>
                <p style="margin: 0 0 10px 0;"><strong>3. Field Conditions:</strong> Customer must ensure fields are accessible and free from hazardous obstacles. Additional charges may apply for unexpected field conditions.</p>
                <p style="margin: 0 0 10px 0;"><strong>4. Cancellation Policy:</strong> Cancellations must be made 48 hours in advance. Late cancellations may incur a service charge.</p>
                <p style="margin: 0 0 10px 0;"><strong>5. Liability:</strong> M77 AG carries full liability insurance. Customer is responsible for marking underground utilities and irrigation systems.</p>
              </div>
            </td>
          </tr>

          <!-- Contact Information -->
          <tr>
            <td style="padding: 0 30px 40px 30px;">
              <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; text-align: center;">
                <p style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Questions about this contract?</p>
                <p style="color: #666; margin: 0; font-size: 14px;">Contact us at <a href="mailto:office@m77ag.com" style="color: #2d5016; text-decoration: none; font-weight: 600;">office@m77ag.com</a></p>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">or call <strong>(970) 520-1807</strong></p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 12px;">&copy; ${new Date().getFullYear()} M77 AG. All rights reserved.</p>
              <p style="color: rgba(255,255,255,0.6); margin: 10px 0 0 0; font-size: 12px;">Professional Custom Farming Services | Northeast Colorado</p>
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

// Admin notification email for service contract
const getAdminServiceNotification = (serviceData) => {
  const {
    name,
    email,
    phone,
    serviceType,
    acres,
    basePrice,
    discountPercentage,
    discountAmount,
    totalPrice,
    notes
  } = serviceData;

  const serviceDisplayNames = {
    'planting': 'Planting Service',
    'disking': 'Disking Service',
    'ripping': 'Ripping Service',
    'deep-ripping': 'Deep Ripping Service',
    'harvesting-corn': 'Corn Harvesting',
    'harvesting-wheat': 'Wheat Harvesting',
    'harvesting-milo': 'Milo Harvesting',
    'drilling': 'Drilling Service',
    'field-cultivation': 'Field Cultivation'
  };

  const serviceDisplay = serviceDisplayNames[serviceType] || serviceType;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Service Contract Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">NEW SERVICE CONTRACT REQUEST</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #2d5016; margin: 0 0 20px 0; font-size: 20px;">Customer Information</h2>
              <p style="margin: 5px 0; color: #333;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Phone:</strong> ${phone}</p>
              ${email ? `<p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${email}</p>` : ''}

              <h2 style="color: #2d5016; margin: 30px 0 20px 0; font-size: 20px;">Service Details</h2>
              <p style="margin: 5px 0; color: #333;"><strong>Service:</strong> ${serviceDisplay}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Acres:</strong> ${acres} acres</p>
              <p style="margin: 5px 0; color: #333;"><strong>Base Price:</strong> $${basePrice.toFixed(2)}</p>
              ${discountPercentage > 0 ? `<p style="margin: 5px 0; color: #2d5016;"><strong>Volume Discount (${discountPercentage}%):</strong> -$${discountAmount.toFixed(2)}</p>` : ''}
              <p style="margin: 15px 0 5px 0; color: #1a1a1a; font-size: 18px;"><strong>Total Contract Amount: $${totalPrice.toFixed(2)}</strong></p>

              ${notes ? `
              <h2 style="color: #2d5016; margin: 30px 0 20px 0; font-size: 20px;">Customer Notes</h2>
              <p style="color: #666;">${notes}</p>
              ` : ''}

              <div style="margin-top: 30px; padding: 20px; background-color: #fff4e6; border-radius: 6px;">
                <p style="color: #333; margin: 0; font-size: 14px;"><strong>Action Required:</strong> Review contract details and contact customer to schedule service.</p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 12px;">M77 AG Admin Notification</p>
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
  getServiceContractEmail,
  getAdminServiceNotification
};
