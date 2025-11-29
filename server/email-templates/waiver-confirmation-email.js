// waiver-confirmation-email.js
// Final email sent AFTER customer signs waiver
// Contains printable vehicle dash card and property boundary maps

function getWaiverConfirmationEmail(booking) {
  const propertyName = booking.parcel === 'heritage-farm' ? 'M77 AG Heritage Farm' : 'Prairie Peace';
  const propertyLocation = booking.parcel === 'heritage-farm' ? 'Sedgwick County, Colorado' : 'Logan County, Colorado (South of Haxtun)';
  
  const huntDate = new Date(booking.huntDate).toLocaleDateString('en-US', {
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
  <style>
    @media print {
      .no-print { display: none; }
      .page-break { page-break-after: always; }
      body { margin: 0; padding: 20px; }
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .dash-card {
      border: 3px solid #000;
      padding: 30px;
      margin: 40px 0;
      background: #fff;
    }
    
    .dash-card h1 {
      color: #2c5530;
      text-align: center;
      margin: 0 0 20px 0;
      font-size: 28px;
      border-bottom: 3px solid #d4a54a;
      padding-bottom: 15px;
    }
    
    .info-row {
      margin: 15px 0;
      padding: 10px;
      background: #f5f5f5;
    }
    
    .info-label {
      font-weight: bold;
      color: #2c5530;
      display: inline-block;
      width: 150px;
    }
    
    .emergency {
      background: #ffebee;
      border-left: 5px solid #c62828;
      padding: 15px;
      margin: 20px 0;
    }
    
    .property-section {
      margin: 30px 0;
      padding: 20px;
      background: #f8f6f3;
      border-left: 5px solid #d4a54a;
    }
    
    .parcel-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    .parcel-table th, .parcel-table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    
    .parcel-table th {
      background: #2c5530;
      color: white;
    }
    
    .coordinates {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #555;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: VEHICLE DASH CARD -->
  <div class="dash-card">
    <h1>M77 AG HUNTING AUTHORIZATION</h1>
    
    <div class="info-row">
      <span class="info-label">HUNTER NAME:</span>
      <span style="font-size: 18px; font-weight: bold;">${booking.customerName}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">BOOKING ID:</span>
      <span style="font-family: monospace; font-size: 16px;">${booking._id}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">PROPERTY:</span>
      <span style="font-size: 16px; font-weight: bold;">${propertyName}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">LOCATION:</span>
      <span>${propertyLocation}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">HUNT DATE:</span>
      <span style="font-size: 16px; font-weight: bold;">${huntDate}</span>
    </div>
    
    <div class="info-row">
      <span class="info-label">NUMBER OF HUNTERS:</span>
      <span>${booking.numHunters}</span>
    </div>
    
    <div class="emergency">
      <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #c62828;">DOWNED GAME - CALL IMMEDIATELY:</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold;">Kyle McConnell: 970-571-1015</p>
      <p style="margin: 10px 0 0 0; font-size: 14px;">Do not retrieve downed game without calling. No answer does NOT mean permission to proceed.</p>
    </div>
    
    <div style="border-top: 2px solid #ddd; margin-top: 25px; padding-top: 20px; text-align: center;">
      <p style="margin: 5px 0; font-weight: bold;">KEEP THIS CARD VISIBLE IN VEHICLE DASHBOARD</p>
      <p style="margin: 5px 0;">Waiver Status: SIGNED | Payment: ${booking.paymentStatus}</p>
      <p style="margin: 5px 0; font-size: 12px;">M77 AG | McConnell Enterprises LLC | hunting@m77ag.com</p>
    </div>
  </div>
  
  <div class="page-break"></div>
  
  <!-- PAGE 2: PROPERTY BOUNDARIES & MAPS -->
  <div class="property-section">
    <h2 style="color: #2c5530; margin-top: 0;">Property Boundaries & Hunting Areas</h2>
    
    <p><strong>Download Maps:</strong></p>
    <ul class="no-print">
      <li><a href="https://m77ag.com/maps/${booking.parcel === 'heritage-farm' ? 'Heritage-Farm' : 'Prairie-Peace'}-Boundaries.kml">Download KML File (Google Earth)</a></li>
      <li><a href="https://m77ag.com/maps/${booking.parcel === 'heritage-farm' ? 'Heritage-Farm' : 'Prairie-Peace'}-Map.pdf">Download PDF Map</a></li>
      ${booking.parcel === 'prairie-peace' ? `<li><a href="https://m77ag.com/prairie-peace-map-printable.html" target="_blank" style="font-weight: bold; color: #2c5530; font-size: 15px;">📄 VIEW/PRINT: Prairie Peace Property Guide (Easy Print)</a></li>` : ''}
    </ul>

    ${booking.parcel === 'heritage-farm' ? `
    <!-- HERITAGE FARM PARCELS -->
    <h3 style="color: #2c5530;">M77 AG Heritage Farm - 1,160 Acres</h3>
    <p><strong>Sedgwick County, Colorado | 5 Hunting Parcels</strong></p>
    <p style="margin-bottom: 20px;">Click "Navigate" to open Google Maps and get directions to each parcel:</p>
    
    <table class="parcel-table">
      <thead>
        <tr>
          <th>Parcel Name</th>
          <th>Acres</th>
          <th>Primary Game</th>
          <th>Navigate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Rolling Dunes</strong></td>
          <td>320</td>
          <td>Deer, Pheasant</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.7466,-102.5400" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Prairie Parcel</strong></td>
          <td>280</td>
          <td>Pheasant, Dove</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.7717,-102.5265" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Sedgwick County Homestead</strong></td>
          <td>240</td>
          <td>Deer, Turkey, Pheasant<br><strong>CAMPING</strong></td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.7690,-102.5161" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>North Side</strong></td>
          <td>160</td>
          <td>Deer, Coyote</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.7678,-102.6153" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>South Side</strong></td>
          <td>160</td>
          <td>Deer, Pheasant, Dove</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.7605,-102.6202" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
      </tbody>
    </table>
    
    <div style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">GAME REST PERIODS (Do Not Hunt These Areas):</p>
      <ul style="margin: 5px 0;">
        <li><strong>Rolling Dunes:</strong> Closed Nov 15-21, Dec 1-7, Dec 20-26</li>
        <li><strong>Homestead:</strong> Closed Nov 22-28, Dec 8-14</li>
        <li><strong>North Side:</strong> Closed Nov 8-14, Nov 29-Dec 5</li>
      </ul>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #856404;">Rest periods allow game recovery. Check calendar before hunting each parcel.</p>
    </div>
    ` : `
    <!-- PRAIRIE PEACE PARCELS -->
    <h3 style="color: #2c5530;">Prairie Peace - 1,550 Acres</h3>
    <p><strong>Logan County, Colorado (South of Haxtun) | 7 Hunting Parcels</strong></p>
    <p style="margin-bottom: 20px;">Click "Navigate" to open Google Maps and get directions to each parcel:</p>
    
    <table class="parcel-table">
      <thead>
        <tr>
          <th>Parcel Name</th>
          <th>Acres</th>
          <th>Primary Game</th>
          <th>Navigate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>The South Section</strong></td>
          <td>598</td>
          <td>Deer, Pheasant, Prairie Dogs</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.4875,-102.6359" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Madsen Pasture</strong></td>
          <td>155</td>
          <td>Deer, Prairie Dogs</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.4861,-102.6502" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Prairie Peace Camping</strong></td>
          <td>Camp</td>
          <td>Water & 110V Electric</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.4859,-102.6460" style="background: #1976d2; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Creek Bed on 14</strong></td>
          <td>169</td>
          <td>Dove, Pheasant (Creek)</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.5296,-102.6600" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Grass and Fenceline</strong></td>
          <td>316</td>
          <td>Deer, Coyote</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.5731,-102.6938" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Fencelines</strong></td>
          <td>162</td>
          <td>Deer, Turkey</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.5802,-102.7082" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
        <tr>
          <td><strong>Logan County Trees</strong></td>
          <td>151</td>
          <td>Deer, Turkey roosting</td>
          <td><a href="https://www.google.com/maps/dir/?api=1&destination=40.5795,-102.7555" style="background: #4caf50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Navigate</a></td>
        </tr>
      </tbody>
    </table>
    
    <div style="background: #e8f5e9; border-left: 5px solid #4caf50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #2e7d32;">PRAIRIE PEACE HUNTING STRATEGY:</p>
      <ul style="margin: 5px 0; color: #2e7d32;">
        <li><strong>Dawn:</strong> Bird hunting in Creek Bed on 14, The South Section</li>
        <li><strong>Mid-Day:</strong> Prairie dog shooting (abundant throughout property)</li>
        <li><strong>Evening:</strong> Return to nesting zones for birds, deer movement</li>
        <li><strong>Best for:</strong> Small groups (3-4 hunters recommended)</li>
      </ul>
    </div>
    `}
    
    <!-- COMMON HUNTING RULES -->
    <div style="border-top: 3px solid #2c5530; margin-top: 30px; padding-top: 20px;">
      <h3 style="color: #2c5530;">Critical Hunting Rules & Protocols</h3>
      
      <div style="background: #ffebee; border-left: 5px solid #c62828; padding: 15px; margin: 15px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #c62828; font-size: 16px;">PROPERTY BOUNDARIES - CRIMINAL TRESPASSING WARNING</p>
        <p style="margin: 0; color: #c62828;">
          Stay INSIDE property boundaries at all times. GPS devices can have 30-50 foot errors. 
          When in doubt, move toward the CENTER of the property. Trespassing on adjacent land 
          will result in immediate loss of hunting privileges and criminal prosecution.
        </p>
      </div>
      
      <div style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 15px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404; font-size: 16px;">DOWNED GAME PROTOCOL - MANDATORY</p>
        <p style="margin: 0 0 5px 0; color: #856404; font-size: 18px;"><strong>Kyle McConnell: 970-571-1015</strong></p>
        <p style="margin: 0; color: #856404;">
          Call IMMEDIATELY when game is down. Do not pursue onto neighboring properties without 
          explicit permission coordinated through Kyle. NO ANSWER DOES NOT MEAN PERMISSION.
          Unauthorized retrieval is criminal trespassing.
        </p>
      </div>
      
      <div style="background: #e3f2fd; border-left: 5px solid #1976d2; padding: 15px; margin: 15px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #1565c0;">WORKING FARM - SAFETY HAZARDS</p>
        <p style="margin: 0; color: #1565c0;">
          This is an active agricultural operation. Watch for farm equipment, livestock, irrigation 
          systems, fence lines, and other hazards. You are entering at your own risk and assume 
          all responsibility for your safety and well-being.
        </p>
      </div>
      
      <div style="background: #f0f8ff; border-left: 5px solid #4caf50; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0;">VIEW YOUR PROPERTY BOUNDARIES:</h3>
        <div style="margin: 15px 0;">
          <a href="https://m77ag.com/${booking.parcel === 'heritage-farm' ? 'heritage-farm' : 'prairie-peace'}-map.html" 
             style="display: inline-block; background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
            VIEW INTERACTIVE MAP
          </a>
          <a href="https://earth.google.com/web/search/${booking.parcel === 'heritage-farm' ? 'Sedgwick+County,+CO' : 'Logan+County,+CO'}/@${booking.parcel === 'heritage-farm' ? '40.77,102.54' : '40.53,102.68'},1500d" 
             style="display: inline-block; background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
            OPEN IN GOOGLE EARTH
          </a>
          <a href="https://m77ag.com/maps/${booking.parcel === 'heritage-farm' ? 'Heritage-Farm' : 'Prairie-Peace'}-Boundaries.kml" 
             style="display: inline-block; background: #d4a54a; color: #2c3e50; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;" download>
            DOWNLOAD KML FILE
          </a>
        </div>
        <p style="margin: 10px 0 0 0; color: #555; font-size: 14px;">
          Click "VIEW INTERACTIVE MAP" to see boundaries on satellite imagery, or "DOWNLOAD KML FILE" to use on your GPS device.
        </p>
      </div>
      
      <h4 style="color: #2c5530; margin-top: 25px;">General Hunting Guidelines:</h4>
      <ul style="line-height: 1.8;">
        <li>Valid Colorado hunting license and appropriate tags REQUIRED</li>
        <li>No shooting within 50 yards of buildings, roads, or property boundaries</li>
        <li>Close all gates behind you</li>
        <li>Pack out ALL trash and spent shells</li>
        <li>Respect livestock and farm equipment - do not disturb</li>
        <li>Obey all Colorado Parks & Wildlife regulations</li>
        <li>Hunt safely and ethically at all times</li>
        <li>Report any issues to Kyle immediately: 970-571-1015</li>
      </ul>
      
      <h4 style="color: #2c5530; margin-top: 25px;">How to View Property Boundaries - DETAILED INSTRUCTIONS:</h4>

      <div style="background: #e8f5e9; border: 2px solid #4caf50; padding: 20px; margin: 15px 0; border-radius: 8px;">
        <h5 style="color: #2e7d32; margin: 0 0 15px 0;">OPTION 1: Google Earth (Desktop)</h5>
        <ol style="line-height: 2; margin: 0; padding-left: 20px;">
          <li>Click the "DOWNLOAD KML FILE" button above to save the file to your computer</li>
          <li>Open Google Earth Pro on your computer (free download at earth.google.com)</li>
          <li>Go to <strong>File > Open</strong> and select the downloaded KML file</li>
          <li>Look in the left sidebar under <strong>"Places"</strong> - you will see "${booking.parcel === 'heritage-farm' ? 'Heritage Farm' : 'Prairie Peace'}"</li>
          <li>Click the <strong>arrow/triangle</strong> next to the property name to expand and see all parcels</li>
          <li>Double-click any parcel name to zoom to that location</li>
          <li>Boundaries will appear as <strong>colored polygons</strong> on the satellite imagery</li>
        </ol>
      </div>

      <div style="background: #e3f2fd; border: 2px solid #1976d2; padding: 20px; margin: 15px 0; border-radius: 8px;">
        <h5 style="color: #1565c0; margin: 0 0 15px 0;">OPTION 2: OnX Hunt App (Recommended for Field Use)</h5>
        <ol style="line-height: 2; margin: 0; padding-left: 20px;">
          <li>Download OnX Hunt app from App Store or Google Play</li>
          <li>Download the KML file to your phone</li>
          <li>Open the OnX Hunt app</li>
          <li>Tap <strong>Menu (☰) > Waypoints > Import</strong></li>
          <li>Select the KML file from your downloads</li>
          <li>Property boundaries will now display on your OnX map</li>
          <li>Your GPS location will show in real-time relative to boundaries</li>
        </ol>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #1565c0;">
          <strong>Note:</strong> OnX requires a subscription but is the best tool for hunters. Download at <a href="https://www.onxmaps.com" style="color: #1976d2;">onxmaps.com</a>
        </p>
      </div>

      <div style="background: #fff3e0; border: 2px solid #ff9800; padding: 20px; margin: 15px 0; border-radius: 8px;">
        <h5 style="color: #e65100; margin: 0 0 15px 0;">OPTION 3: Google Earth Mobile App</h5>
        <ol style="line-height: 2; margin: 0; padding-left: 20px;">
          <li>Download Google Earth app from App Store or Google Play</li>
          <li>Download the KML file to your phone</li>
          <li>Open your file manager and tap the KML file</li>
          <li>Select "Open with Google Earth"</li>
          <li>The app will zoom to the property location</li>
          <li>Tap the <strong>menu icon</strong> and look under <strong>"Projects"</strong> to see parcel list</li>
        </ol>
      </div>

      <div style="background: #ffebee; border-left: 5px solid #c62828; padding: 15px; margin: 15px 0;">
        <p style="margin: 0; color: #c62828;">
          <strong>GPS ACCURACY WARNING:</strong> Cell phone GPS can have 30-50 foot errors. Always stay well inside the boundary lines shown. When in doubt, move toward the CENTER of the property. Walk the boundaries when you first arrive to familiarize yourself with the terrain.
        </p>
      </div>
    </div>
  </div>
  
  <!-- CONTACT & FOOTER -->
  <div class="no-print" style="border-top: 3px solid #2c5530; margin-top: 40px; padding-top: 20px; text-align: center;">
    <h3 style="color: #2c5530;">Questions or Emergency Contact</h3>
    <p><strong>Kyle McConnell</strong></p>
    <p>Cell: <strong>970-571-1015</strong> (Downed game & emergencies)</p>
    <p>Office: 970-774-3276</p>
    <p>Email: hunting@m77ag.com</p>
    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      M77 AG | McConnell Enterprises LLC<br>
      Four Generations of Agricultural Excellence<br>
      Northeast Colorado
    </p>
  </div>
  
  <div class="no-print" style="background: #e8f5e9; border: 2px solid #4caf50; padding: 25px; margin-top: 30px; text-align: center; border-radius: 8px;">
    <h3 style="color: #2e7d32; margin: 0 0 15px 0;">Share Your Hunting Experience!</h3>
    <p style="margin: 0 0 20px 0; color: #2e7d32; font-size: 16px;">
      After your hunt, we'd love to hear about your experience.<br>
      Your review helps other hunters discover our property!
    </p>
    <a href="https://m77ag.com/hunting.html#reviews" style="display: inline-block; background: #4caf50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px 0;">
      LEAVE A REVIEW
    </a>
    <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
      Or email your review to: hunting@m77ag.com
    </p>
  </div>

  <div class="no-print" style="background: #f5f5f5; padding: 20px; margin-top: 30px; text-align: center; border-radius: 5px;">
    <p style="margin: 0; font-weight: bold;">PRINT INSTRUCTIONS</p>
    <p style="margin: 10px 0 0 0;">Use your browser's print function (Ctrl+P or Cmd+P):</p>
    <ul style="text-align: left; display: inline-block; margin: 10px 0; line-height: 1.8;">
      <li><strong>Page 1:</strong> Vehicle Dash Card - Keep visible in dashboard while hunting</li>
      <li><strong>Page 2:</strong> Property Boundaries - Reference map with GPS coordinates</li>
    </ul>
  </div>
  
</body>
</html>
  `;
}

// Admin notification
function getAdminWaiverNotification(booking) {
  const propertyName = booking.parcel === 'heritage-farm' ? 'M77 AG Heritage Farm' : 'Prairie Peace';
  const huntDate = new Date(booking.huntDate).toLocaleDateString('en-US', {
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2c5530; color: white; padding: 20px; text-align: center; }
    .content { background: #f8f6f3; padding: 20px; margin: 20px 0; }
    .info-row { margin: 10px 0; padding: 10px; background: white; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0;">WAIVER SIGNED - Booking Complete</h2>
  </div>
  
  <div class="content">
    <p><strong>Liability waiver has been signed and booking is now complete.</strong></p>
    
    <div class="info-row">
      <strong>Hunter:</strong> ${booking.customerName}<br>
      <strong>Email:</strong> ${booking.email}<br>
      <strong>Phone:</strong> ${booking.phone}
    </div>
    
    <div class="info-row">
      <strong>Property:</strong> ${propertyName}<br>
      <strong>Hunt Date:</strong> ${huntDate}<br>
      <strong>Hunters:</strong> ${booking.numHunters}<br>
      <strong>Total Paid:</strong> $${booking.totalPrice}
    </div>
    
    <div class="info-row">
      <strong>Booking ID:</strong> ${booking._id}<br>
      <strong>Waiver Signed:</strong> ${new Date().toLocaleString()}<br>
      <strong>Status:</strong> COMPLETE - Ready to Hunt
    </div>
    
    <p style="margin-top: 20px;">
      <a href="https://m77ag.com/admin/hunting-bookings.html" 
         style="background: #2c5530; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View in Admin Dashboard
      </a>
    </p>
  </div>
</body>
</html>
  `;
}

module.exports = {
  getWaiverConfirmationEmail,
  getAdminWaiverNotification
};