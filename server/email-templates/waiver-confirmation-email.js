// Email template for waiver confirmation - sent after customer signs waiver
// Includes printable vehicle dash card and property boundary information

function getWaiverConfirmationEmail(booking) {
  const propertyName = booking.parcel === 'heritage-farm' ? 'M77 AG Heritage Farm' : 'Prairie Peace';
  const propertyLocation = booking.parcel === 'heritage-farm' ? 'Sedgwick County, Colorado' : 'Logan County, Colorado';
  const propertyAcres = booking.parcel === 'heritage-farm' ? '1,160 acres' : '1,550 acres';
  
  // Format dates
  const checkinDate = new Date(booking.checkinDate).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const checkoutDate = new Date(booking.checkoutDate).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
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
      max-width: 800px;
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
    .success-box {
      background-color: #e8f5e9;
      border: 3px solid #4caf50;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      text-align: center;
    }
    .success-box h2 {
      color: #2c5530;
      margin-top: 0;
    }
    
    /* PRINTABLE VEHICLE DASH CARD */
    .dash-card {
      background: white;
      border: 4px solid #2c5530;
      padding: 20px;
      margin: 30px 0;
      page-break-after: always;
      border-radius: 8px;
    }
    .dash-card h2 {
      background-color: #2c5530;
      color: white;
      padding: 15px;
      margin: -20px -20px 20px -20px;
      text-align: center;
      font-size: 24px;
      border-radius: 4px 4px 0 0;
    }
    .dash-card .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 2px solid #ddd;
      font-size: 16px;
    }
    .dash-card .info-label {
      font-weight: bold;
      color: #2c5530;
    }
    .dash-card .emergency {
      background-color: #fff3cd;
      border: 2px solid #ff6b6b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
      text-align: center;
    }
    .dash-card .emergency .phone {
      font-size: 24px;
      font-weight: bold;
      color: #c62828;
      margin: 10px 0;
    }
    
    /* PROPERTY BOUNDARIES SECTION */
    .boundaries-section {
      background: white;
      border: 3px solid #d4a54a;
      padding: 25px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .boundaries-section h2 {
      color: #2c5530;
      margin-top: 0;
      border-bottom: 3px solid #d4a54a;
      padding-bottom: 10px;
    }
    .boundaries-section h3 {
      color: #8b6914;
      margin-top: 20px;
    }
    
    .warning-box {
      background-color: #fff3cd;
      border: 3px solid #ff6b6b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .warning-box h3 {
      color: #c62828;
      margin-top: 0;
    }
    
    .hunting-rules {
      background-color: #f8f6f3;
      padding: 20px;
      margin: 20px 0;
      border-left: 5px solid #d4a54a;
      border-radius: 5px;
    }
    
    .print-button {
      background-color: #2c5530;
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 5px;
      font-size: 18px;
      font-weight: bold;
      display: inline-block;
      margin: 20px 0;
      text-align: center;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      border-top: 2px solid #ddd;
      margin-top: 30px;
    }
    
    ul {
      margin: 10px 0;
      padding-left: 25px;
    }
    li {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    @media print {
      .no-print { display: none; }
      .dash-card { page-break-after: always; }
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header no-print">
    <h1>✅ Waiver Confirmed - You're All Set!</h1>
    <p>M77 AG - Four Generations of Agricultural Excellence</p>
  </div>
  
  <div class="content">
    <div class="success-box no-print">
      <h2>🎉 Your Hunting Reservation is Complete!</h2>
      <p><strong>Thank you for signing the liability waiver, ${booking.customerName}.</strong></p>
      <p>You are now fully confirmed for your hunt on ${propertyName}.</p>
    </div>
    
    <!-- PRINTABLE VEHICLE DASH CARD -->
    <div class="dash-card">
      <h2>🚗 VEHICLE DASH CARD - KEEP IN VEHICLE</h2>
      
      <div class="info-row">
        <span class="info-label">Hunter Name:</span>
        <span>${booking.customerName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Property:</span>
        <span>${propertyName}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Location:</span>
        <span>${propertyLocation}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Property Size:</span>
        <span>${propertyAcres}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Hunt Dates:</span>
        <span>${checkinDate} - ${checkoutDate}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Number of Hunters:</span>
        <span>${booking.numHunters}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Vehicle:</span>
        <span>${booking.vehicleMake} ${booking.vehicleModel} - ${booking.vehicleColor}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">License Plate:</span>
        <span>${booking.vehicleLicense}</span>
      </div>
      
      <div class="emergency">
        <strong>⚠️ EMERGENCY CONTACT / DOWNED GAME PROTOCOL</strong>
        <div class="phone">970-571-1015</div>
        <p><strong>Kyle McConnell - M77 AG</strong></p>
        <p style="font-size: 14px; margin: 10px 0 0 0;">
          MUST call immediately if game crosses property lines
        </p>
      </div>
      
      <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
        <strong>Print this card and keep visible in your vehicle dashboard</strong>
      </p>
    </div>
    
    <!-- PROPERTY BOUNDARIES & HUNTING AREAS -->
    <div class="boundaries-section">
      <h2>📍 Property Boundaries & Hunting Areas</h2>
      
      ${booking.parcel === 'heritage-farm' ? `
      <h3>M77 AG Heritage Farm - Sedgwick County</h3>
      <p><strong>Total Property: 1,160 acres</strong></p>
      
      <div class="warning-box">
        <h3>⚠️ CRITICAL BOUNDARY INFORMATION</h3>
        <p><strong>You MUST stay within property boundaries at all times.</strong></p>
        <ul>
          <li>Property is marked with posted signs at regular intervals</li>
          <li>Use your GPS to verify boundaries (coordinates provided below)</li>
          <li>Orange areas on map indicate GAME REST PERIODS - NO HUNTING</li>
          <li>Crossing property lines is TRESPASSING and may result in criminal charges</li>
        </ul>
      </div>
      
      <h3>Boundary Coordinates (Use for GPS Verification):</h3>
      <ul>
        <li><strong>North Boundary:</strong> County Road 28</li>
        <li><strong>South Boundary:</strong> County Road 26</li>
        <li><strong>East Boundary:</strong> Road 52</li>
        <li><strong>West Boundary:</strong> Road 51</li>
      </ul>
      
      <h3>Huntable Areas:</h3>
      <ul>
        <li><strong>North Section:</strong> Approximately 580 acres - mix of CRP grassland and wheat stubble</li>
        <li><strong>South Section:</strong> Approximately 580 acres - dryland wheat and sorghum fields</li>
        <li><strong>Shelterbelts:</strong> Tree rows provide excellent bird cover - hunt with caution near edges</li>
      </ul>
      
      <h3>Game Rest Periods (NO HUNTING):</h3>
      <ul>
        <li>Orange-marked areas on your property map indicate fields in rest rotation</li>
        <li>These areas allow game to feed and recover between hunting pressure</li>
        <li>Rest areas change periodically throughout season</li>
        <li>Current rest areas are clearly marked on your downloadable map</li>
      </ul>
      
      <h3>Property Features & Landmarks:</h3>
      <ul>
        <li><strong>Historic Homestead Buildings:</strong> Located in center section - built late 1800s by Swedish homesteaders</li>
        <li><strong>Windmill:</strong> Southwest corner - good landmark for navigation</li>
        <li><strong>Waterway:</strong> Seasonal drainage runs north-south through property</li>
        <li><strong>Pivot Irrigation:</strong> Active equipment - stay clear of machinery</li>
      </ul>
      ` : `
      <h3>Prairie Peace - Logan County</h3>
      <p><strong>Total Property: 1,550 acres</strong></p>
      
      <div class="warning-box">
        <h3>⚠️ CRITICAL BOUNDARY INFORMATION</h3>
        <p><strong>You MUST stay within property boundaries at all times.</strong></p>
        <ul>
          <li>Property is marked with posted signs at regular intervals</li>
          <li>Use your GPS to verify boundaries (coordinates provided below)</li>
          <li>Orange areas on map indicate GAME REST PERIODS - NO HUNTING</li>
          <li>Crossing property lines is TRESPASSING and may result in criminal charges</li>
        </ul>
      </div>
      
      <h3>Boundary Coordinates (Use for GPS Verification):</h3>
      <ul>
        <li><strong>North Boundary:</strong> County Road 36</li>
        <li><strong>South Boundary:</strong> County Road 34</li>
        <li><strong>East Boundary:</strong> Road 64</li>
        <li><strong>West Boundary:</strong> Road 62</li>
      </ul>
      
      <h3>Huntable Areas:</h3>
      <ul>
        <li><strong>North Quarter:</strong> Approximately 400 acres - native prairie grass and CRP</li>
        <li><strong>Central Section:</strong> Approximately 750 acres - dryland wheat and corn stubble</li>
        <li><strong>South Quarter:</strong> Approximately 400 acres - mixed grain fields and grassland</li>
        <li><strong>Draw Areas:</strong> Natural drainages provide excellent pheasant habitat</li>
      </ul>
      
      <h3>Game Rest Periods (NO HUNTING):</h3>
      <ul>
        <li>Orange-marked areas on your property map indicate fields in rest rotation</li>
        <li>These areas allow game to feed and recover between hunting pressure</li>
        <li>Rest areas change periodically throughout season</li>
        <li>Current rest areas are clearly marked on your downloadable map</li>
      </ul>
      
      <h3>Property Features & Landmarks:</h3>
      <ul>
        <li><strong>Stock Pond:</strong> Southwest section - good landmark, cattle may be present</li>
        <li><strong>Shelterbelt Rows:</strong> Multiple tree rows running east-west - prime bird cover</li>
        <li><strong>Old Farmstead:</strong> Northwest corner - structural hazards, approach with caution</li>
        <li><strong>Cattle Operation:</strong> Active grazing in some sections - respect livestock</li>
      </ul>
      `}
      
      <h3>Download Property Map:</h3>
      <p style="margin: 15px 0;">
        <a href="https://m77ag.com/maps/${booking.parcel === 'heritage-farm' ? 'Heritage-Farm-Boundaries.kml' : 'Prairie-Peace-Boundaries.kml'}" 
           style="background-color: #d4a54a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          📥 Download ${propertyName} Map (KML File)
        </a>
      </p>
      <p style="font-size: 14px; color: #666;">
        Open this KML file with Google Earth, OnX Hunt, or similar mapping app on your phone for GPS navigation.
      </p>
    </div>
    
    <!-- HUNTING RULES & PROTOCOLS -->
    <div class="hunting-rules">
      <h2 style="color: #2c5530; margin-top: 0;">🦌 Hunting Rules & Protocols</h2>
      
      <h3 style="color: #8b6914;">Required Before Hunting:</h3>
      <ul>
        <li>✅ Valid Colorado hunting license</li>
        <li>✅ Appropriate stamps (habitat stamp, federal waterfowl stamp if hunting dove)</li>
        <li>✅ Hunter orange clothing as required by Colorado law</li>
        <li>✅ This vehicle dash card visible in vehicle</li>
      </ul>
      
      <h3 style="color: #8b6914;">Downed Game Protocol:</h3>
      <ul>
        <li><strong>IF GAME CROSSES PROPERTY LINES:</strong> STOP IMMEDIATELY</li>
        <li>Call Kyle McConnell at <strong>970-571-1015</strong> before pursuing</li>
        <li>Do NOT enter neighboring property without permission</li>
        <li>Failure to follow this protocol may result in trespassing charges</li>
      </ul>
      
      <h3 style="color: #8b6914;">Safety Requirements:</h3>
      <ul>
        <li>Know your target and what is beyond it before shooting</li>
        <li>Maintain muzzle control at all times</li>
        <li>Never shoot toward buildings, roads, or property boundaries</li>
        <li>Watch for agricultural equipment and livestock</li>
        <li>Cell service may be limited - hunt with a partner when possible</li>
      </ul>
      
      <h3 style="color: #8b6914;">Property Respect:</h3>
      <ul>
        <li>Pack out ALL trash and spent shells</li>
        <li>Close all gates as you found them</li>
        <li>Stay on designated vehicle paths</li>
        <li>Do not damage crops or fences</li>
        <li>Report any property damage to Kyle immediately</li>
      </ul>
      
      <h3 style="color: #8b6914;">Camping Information:</h3>
      <ul>
        <li>Camping fee: $50/night (if reserved)</li>
        <li>Boondocking sites available (no hookups)</li>
        <li>Pack out all waste and trash</li>
        <li>No open fires without permission</li>
        <li>Respect quiet hours after dark</li>
      </ul>
    </div>
    
    <div class="no-print" style="text-align: center; margin: 30px 0; padding: 20px; background: #e8f5e9; border-radius: 8px;">
      <h3 style="color: #2c5530;">Ready to Print Your Documents</h3>
      <p>Use your browser's print function (Ctrl+P or Cmd+P) to print:</p>
      <ul style="text-align: left; display: inline-block; margin: 15px 0;">
        <li><strong>Page 1:</strong> Vehicle Dash Card (keep in vehicle)</li>
        <li><strong>Page 2:</strong> Property Boundaries & Hunting Information</li>
      </ul>
      <p style="margin-top: 20px;">
        <strong>Download your property map above for GPS navigation while hunting.</strong>
      </p>
    </div>
    
    <div class="no-print" style="background: #f8f6f3; padding: 20px; border-left: 5px solid #d4a54a; margin: 20px 0;">
      <h3 style="color: #2c5530; margin-top: 0;">Questions or Need Assistance?</h3>
      <p><strong>Kyle McConnell</strong><br>
      Phone: <strong>970-571-1015</strong><br>
      Email: hunting@m77ag.com</p>
      <p>We're here to ensure you have a safe and successful hunt!</p>
    </div>
  </div>
  
  <div class="footer no-print">
    <p><strong>M77 AG | Northeast Colorado</strong></p>
    <p>Four Generations of Agricultural Excellence Since the Late 1800s</p>
    <p style="margin-top: 15px; font-size: 12px;">
      This email contains your complete hunting package. Save this email for your records.<br>
      Your signed waiver is securely stored in our system.
    </p>
  </div>
</body>
</html>
  `;
}

// Admin notification for waiver signed
function getAdminWaiverNotification(booking) {
  const propertyName = booking.parcel === 'heritage-farm' ? 'M77 AG Heritage Farm' : 'Prairie Peace';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4caf50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .detail { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .label { font-weight: bold; color: #2c5530; }
    .signature-box { background: white; border: 2px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ Waiver Signed - Booking Complete</h2>
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
      <div class="detail"><span class="label">Hunters:</span> ${booking.numHunters}</div>
      <div class="detail"><span class="label">Total Price:</span> $${booking.totalPrice}</div>
      <div class="detail"><span class="label">Payment Status:</span> ${booking.paymentStatus}</div>
      
      <h3>Waiver Information:</h3>
      <div class="detail"><span class="label">Signed By:</span> ${booking.waiverData.participantName}</div>
      <div class="detail"><span class="label">Signed Date:</span> ${new Date(booking.waiverData.signatureDate).toLocaleDateString()}</div>
      <div class="detail"><span class="label">IP Address:</span> ${booking.waiverData.ipAddress}</div>
      
      <div class="signature-box">
        <p><strong>Digital Signature Captured:</strong></p>
        <p style="font-size: 12px; color: #666;">Signature image stored in database with booking ID: ${booking._id}</p>
      </div>
      
      <p style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 5px;">
        <strong>✅ This booking is now FULLY COMPLETE.</strong><br>
        Customer has been sent printable documents and property maps.
      </p>
      
      <p style="margin-top: 20px;">
        <a href="https://m77ag.com/admin/hunting-bookings.html" 
           style="background-color: #2c5530; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          View in Admin Dashboard
        </a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  getWaiverConfirmationEmail,
  getAdminWaiverNotification
};