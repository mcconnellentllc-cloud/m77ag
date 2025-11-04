// hunting-confirmation-email.js
// Email template for hunting reservation confirmations with legal requirements

const generateHuntingConfirmationEmail = (booking) => {
    const subject = `IMPORTANT: Hunting Reservation Confirmation & Legal Requirements - ${booking.bookingNumber}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 700px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header { 
            background: #2d5016; 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
        }
        .content { 
            background: #f8f6f3; 
            padding: 30px; 
            border-radius: 0 0 10px 10px;
        }
        .booking-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 5px solid #2d5016;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0; 
            border-bottom: 1px solid #eee;
        }
        .detail-label { 
            font-weight: bold; 
            color: #2d5016;
        }
        .critical-notice { 
            background: #fff3cd; 
            border: 3px solid #ff6b6b; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .critical-notice h2 { 
            color: #d32f2f; 
            margin-top: 0;
            font-size: 22px;
            text-transform: uppercase;
        }
        .legal-section { 
            background: #fff9f0; 
            border-left: 5px solid #d4af37; 
            padding: 20px; 
            margin: 20px 0;
            border-radius: 5px;
        }
        .legal-section h3 { 
            color: #8b6914; 
            margin-top: 0;
        }
        .important-list { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 15px 0;
        }
        .important-list li { 
            margin: 10px 0; 
            padding-left: 10px;
        }
        .contact-box { 
            background: #2d5016; 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 25px 0;
            text-align: center;
        }
        .contact-box h3 { 
            margin-top: 0; 
            color: #d4af37;
        }
        .contact-box .phone { 
            font-size: 24px; 
            font-weight: bold; 
            color: #d4af37; 
            margin: 15px 0;
        }
        .warning-box {
            background: #ffebee;
            border: 2px solid #c62828;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .warning-box h3 {
            color: #c62828;
            margin-top: 0;
        }
        .next-steps { 
            background: #e8f5e9; 
            border-left: 5px solid #4caf50; 
            padding: 20px; 
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px;
            border-top: 2px solid #ddd;
        }
        .signature-required {
            background: #fff3e0;
            border: 3px solid #ff9800;
            padding: 25px;
            margin: 25px 0;
            border-radius: 8px;
            text-align: center;
        }
        .signature-required h2 {
            color: #e65100;
            margin-top: 0;
        }
        .signature-button {
            display: inline-block;
            background: #ff9800;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 18px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>M77 AG HUNTING RESERVATION</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Confirmation Number: ${booking.bookingNumber}</p>
    </div>
    
    <div class="content">
        <p style="font-size: 16px;">Dear ${booking.hunterInfo.name},</p>
        
        <p style="font-size: 16px;">Thank you for booking your hunting experience with M77 AG. <strong>PLEASE READ THIS ENTIRE EMAIL CAREFULLY</strong> as it contains critical legal requirements and safety information.</p>

        <!-- Booking Details -->
        <div class="booking-details">
            <h2 style="margin-top: 0; color: #2d5016;">Your Reservation Details</h2>
            <div class="detail-row">
                <span class="detail-label">Property:</span>
                <span>${booking.property}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Dates:</span>
                <span>${booking.startDate} to ${booking.endDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Number of Hunters:</span>
                <span>${booking.numberOfHunters}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Game Species:</span>
                <span>${booking.gameSpecies.join(', ')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Cost:</span>
                <span style="font-size: 20px; color: #2d5016; font-weight: bold;">$${booking.totalCost}</span>
            </div>
            ${booking.camping ? '<div class="detail-row"><span class="detail-label">Camping:</span><span>Yes - $50/night</span></div>' : ''}
        </div>

        <!-- CRITICAL BOUNDARY NOTICE -->
        <div class="critical-notice">
            <h2>CRITICAL: PROPERTY BOUNDARIES & TRESPASSING</h2>
            <p><strong>YOU ARE SOLELY RESPONSIBLE FOR STAYING WITHIN THE DESIGNATED PROPERTY BOUNDARIES AT ALL TIMES.</strong></p>
            
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>NEIGHBORING LANDOWNERS WILL PROSECUTE TRESPASSERS TO THE FULL EXTENT OF THE LAW.</strong></li>
                <li>GPS coordinates and detailed boundary maps will be provided 48 hours before your hunt.</li>
                <li>YOU must familiarize yourself with all boundary markers and property lines.</li>
                <li>M77 AG is NOT responsible for any trespassing violations or legal consequences.</li>
                <li>Violation of property boundaries may result in immediate termination of your hunting privileges WITHOUT refund.</li>
            </ul>
        </div>

        <!-- DOWNED GAME PROTOCOL -->
        <div class="warning-box">
            <h3>MANDATORY PROTOCOL FOR DOWNED GAME ACROSS PROPERTY LINES</h3>
            
            <p style="font-size: 16px; margin: 15px 0;"><strong>IF ANY DOWNED GAME CROSSES ONTO NEIGHBORING PROPERTY:</strong></p>
            
            <ol style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
                <li><strong>STOP IMMEDIATELY - DO NOT CROSS THE PROPERTY LINE</strong></li>
                <li><strong>CALL KYLE McCONNELL IMMEDIATELY: 970-571-1015</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>This is a cell phone number</li>
                        <li>If no answer, leave a detailed voicemail with your location and situation</li>
                        <li><strong style="color: #c62828;">NO ANSWER DOES NOT EQUAL PERMISSION TO RETRIEVE GAME</strong></li>
                    </ul>
                </li>
                <li><strong>WAIT FOR COORDINATION</strong> - Kyle will coordinate with neighboring landowners for permission to retrieve game</li>
                <li><strong>DO NOT ATTEMPT TO RETRIEVE GAME</strong> from neighboring property without explicit permission</li>
                <li>Unauthorized retrieval will be treated as trespassing and may result in prosecution</li>
            </ol>

            <p style="background: #fff; padding: 15px; border-radius: 5px; margin-top: 15px; border: 2px solid #c62828;">
                <strong>WARNING:</strong> Entering neighboring property without permission - even to retrieve legally harvested game - constitutes criminal trespassing and will result in prosecution by the landowner.
            </p>
        </div>

        <!-- EMERGENCY CONTACT -->
        <div class="contact-box">
            <h3>EMERGENCY CONTACT INFORMATION</h3>
            <p style="margin: 10px 0;">Kyle McConnell</p>
            <div class="phone">970-571-1015</div>
            <p style="margin: 15px 0; font-size: 14px;">
                Save this number in your phone BEFORE arriving at the property.<br>
                Cell service may be limited in some areas.
            </p>
        </div>

        <!-- LIABILITY WAIVER REQUIREMENT -->
        <div class="signature-required">
            <h2>REQUIRED: LIABILITY WAIVER & SIGNATURE</h2>
            <p style="font-size: 16px; margin: 15px 0; line-height: 1.8;">
                <strong>Your reservation is NOT complete until you sign the liability waiver.</strong><br>
                This waiver is REQUIRED before you will be granted access to the property.
            </p>
            <a href="${booking.waiverUrl}" class="signature-button">SIGN LIABILITY WAIVER NOW</a>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
                You must complete this waiver at least 24 hours before your hunt date.
            </p>
        </div>

        <!-- LEGAL REQUIREMENTS -->
        <div class="legal-section">
            <h3>LEGAL REQUIREMENTS & HUNTER RESPONSIBILITIES</h3>
            
            <div class="important-list">
                <h4 style="color: #8b6914; margin-top: 0;">BEFORE YOUR HUNT:</h4>
                <ul style="line-height: 1.8;">
                    <li><strong>Valid Colorado Hunting License:</strong> All hunters MUST possess appropriate valid Colorado hunting licenses for intended game species</li>
                    <li><strong>Hunter Safety Certification:</strong> Required for all hunters born after January 1, 1949</li>
                    <li><strong>Signed Liability Waiver:</strong> Must be completed online before arrival</li>
                    <li><strong>Property Boundaries:</strong> Review all boundary maps and GPS coordinates thoroughly</li>
                    <li><strong>Colorado Parks & Wildlife Regulations:</strong> Know and follow all CPW hunting regulations</li>
                </ul>
            </div>

            <div class="important-list">
                <h4 style="color: #8b6914; margin-top: 15px;">DURING YOUR HUNT:</h4>
                <ul style="line-height: 1.8;">
                    <li><strong>Stay Within Boundaries:</strong> YOU are responsible for knowing and respecting all property boundaries</li>
                    <li><strong>Safety First:</strong> Treat every firearm as if it's loaded; know your target and what's beyond it</li>
                    <li><strong>No Alcohol or Drugs:</strong> Prohibited while hunting or handling firearms</li>
                    <li><strong>Respect the Land:</strong> Pack out all trash, close all gates, respect livestock and equipment</li>
                    <li><strong>Report Incidents:</strong> Immediately report any accidents, injuries, or property damage to Kyle McConnell</li>
                </ul>
            </div>
        </div>

        <!-- FARM SAFETY WARNING -->
        <div class="warning-box">
            <h3>FARM SAFETY WARNING</h3>
            <p style="font-size: 16px; line-height: 1.8;">
                <strong>WORKING FARM ENVIRONMENT - ENTER AT YOUR OWN RISK</strong>
            </p>
            <p style="margin: 15px 0; line-height: 1.8;">
                This is an active agricultural operation with inherent dangers including but not limited to:
            </p>
            <ul style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
                <li>Operating farm equipment and machinery</li>
                <li>Open wells, irrigation ditches, and water hazards</li>
                <li>Uneven terrain, holes, and natural obstacles</li>
                <li>Livestock and wildlife</li>
                <li>Barbed wire fences and gates</li>
                <li>Chemical storage areas</li>
                <li>Extreme weather conditions</li>
            </ul>
            <p style="background: #fff; padding: 15px; border-radius: 5px; margin-top: 15px; border: 2px solid #c62828;">
                <strong>YOU ACCEPT FULL RESPONSIBILITY FOR YOUR SAFETY AND WELL-BEING.</strong> Farms are dangerous environments. Exercise extreme caution at all times.
            </p>
        </div>

        <!-- INDEMNIFICATION NOTICE -->
        <div class="legal-section">
            <h3>INDEMNIFICATION & HOLD HARMLESS AGREEMENT</h3>
            <p style="line-height: 1.8; margin: 15px 0;">
                By completing your reservation and signing the liability waiver, you agree to:
            </p>
            <ul style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
                <li><strong>INDEMNIFY AND HOLD HARMLESS</strong> M77 AG, McConnell Enterprises LLC, all landowners, agents, employees, contractors, and anyone associated with M77 AG from any and all claims, damages, losses, liabilities, costs, and expenses (including attorney fees) arising from your participation in hunting activities</li>
                <li><strong>ASSUME ALL RISKS</strong> associated with hunting activities including, but not limited to, personal injury, death, property damage, and loss</li>
                <li><strong>RELEASE ALL PARTIES</strong> from liability for any accidents, injuries, or damages that may occur on the property</li>
                <li><strong>TAKE FULL RESPONSIBILITY</strong> for knowing and following all hunting laws, regulations, and safety procedures</li>
                <li><strong>ACKNOWLEDGE</strong> that hunting and farm environments contain inherent dangers and you enter at your own risk</li>
            </ul>
        </div>

        <!-- NEXT STEPS -->
        <div class="next-steps">
            <h3 style="color: #2d5016; margin-top: 0;">NEXT STEPS TO COMPLETE YOUR RESERVATION</h3>
            <ol style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
                <li><strong>SIGN THE LIABILITY WAIVER</strong> - Click the button above (required within 24 hours)</li>
                <li><strong>COMPLETE PAYMENT</strong> - ${booking.paymentStatus === 'paid' ? 'Payment received ✓' : 'Payment due before arrival'}</li>
                <li><strong>VERIFY HUNTING LICENSES</strong> - Ensure all hunters have valid Colorado licenses</li>
                <li><strong>SAVE EMERGENCY CONTACT</strong> - Add Kyle McConnell (970-571-1015) to your phone</li>
                <li><strong>DOWNLOAD PROPERTY MAPS</strong> - GPS coordinates and boundary maps available below</li>
                <li><strong>REVIEW BOUNDARIES</strong> - Study all property boundaries before your hunt</li>
            </ol>
        </div>

        <!-- PROPERTY BOUNDARY MAPS -->
        <div class="critical-notice">
            <h2>PROPERTY BOUNDARY MAPS & GPS COORDINATES</h2>
            <p style="font-size: 16px; margin: 15px 0;">
                <strong>MANDATORY: Download and review these boundary maps BEFORE your hunt.</strong><br>
                You are responsible for knowing these boundaries.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${booking.property === 'M77 AG Heritage Farm' || booking.property === 'Heritage Farm' ? `
                <h3 style="color: #2d5016; margin-bottom: 15px;">M77 AG Heritage Farm - Sedgwick County</h3>
                <p style="margin: 10px 0;"><strong>Total Area:</strong> 1,160 acres across 5 parcels</p>
                
                <div style="margin: 20px 0;">
                    <a href="https://m77ag.com/maps/Heritage-Farm-Boundaries.kml" 
                       style="display: inline-block; background: #2d5016; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px;">
                        Download KML File (Google Earth)
                    </a>
                    <a href="https://m77ag.com/maps/Heritage-Farm-Map.pdf" 
                       style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px;">
                        Download PDF Map
                    </a>
                </div>
                
                <div style="background: #f8f6f3; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h4 style="color: #8b6914; margin-bottom: 10px;">GPS Coordinates for Property Corners:</h4>
                    <ul style="line-height: 1.8; font-family: monospace; font-size: 14px;">
                        <li><strong>Rolling Dunes:</strong> 40.7542°N, 102.5468°W (NW Corner)</li>
                        <li><strong>Prairie Parcel:</strong> 40.7791°N, 102.5266°W (NE Corner)</li>
                        <li><strong>Homestead:</strong> 40.7791°N, 102.5117°W (E Corner)</li>
                        <li><strong>North Side:</strong> 40.7715°N, 102.6132°W (SW Corner)</li>
                        <li><strong>South Side:</strong> 40.7642°N, 102.6227°W (W Corner)</li>
                    </ul>
                </div>
                
                <p style="margin-top: 15px; color: #c62828; font-weight: bold;">
                    Camping location at Homestead parcel: 40.7690°N, 102.5161°W
                </p>
                ` : ''}
                
                ${booking.property === 'Prairie Peace' ? `
                <h3 style="color: #2d5016; margin-bottom: 15px;">Prairie Peace - Logan County</h3>
                <p style="margin: 10px 0;"><strong>Total Area:</strong> 1,550 acres across 7 parcels</p>
                
                <div style="margin: 20px 0;">
                    <a href="https://m77ag.com/maps/Prairie-Peace-Boundaries.kml" 
                       style="display: inline-block; background: #2d5016; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px;">
                        Download KML File (Google Earth)
                    </a>
                    <a href="https://m77ag.com/maps/Prairie-Peace-Map.pdf" 
                       style="display: inline-block; background: #d4af37; color: #1a1a1a; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 5px;">
                        Download PDF Map
                    </a>
                </div>
                
                <div style="background: #f8f6f3; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h4 style="color: #8b6914; margin-bottom: 10px;">GPS Coordinates for Property Corners:</h4>
                    <ul style="line-height: 1.8; font-family: monospace; font-size: 14px;">
                        <li><strong>The South Section:</strong> 40.4883°N, 102.6454°W (NE Corner)</li>
                        <li><strong>Madsen Pasture:</strong> 40.4897°N, 102.6456°W (NW Corner)</li>
                        <li><strong>Creek Bed on 14:</strong> 40.5259°N, 102.6650°W (NW Corner)</li>
                        <li><strong>Grass and Fenceline:</strong> 40.5765°N, 102.7033°W (NE Corner)</li>
                        <li><strong>Fencelines:</strong> 40.5839°N, 102.7130°W (NE Corner)</li>
                        <li><strong>Logan County Trees:</strong> 40.5806°N, 102.7508°W (E Corner)</li>
                    </ul>
                </div>
                
                <p style="margin-top: 15px; color: #c62828; font-weight: bold;">
                    Camping location: 40.4858°N, 102.6456°W
                </p>
                ` : ''}
            </div>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 3px solid #ff6b6b;">
                <h4 style="color: #c62828; margin-bottom: 15px;">HOW TO USE THESE MAPS:</h4>
                <ol style="line-height: 1.8; padding-left: 25px;">
                    <li><strong>Download the KML file</strong> and open it in Google Earth on your phone</li>
                    <li><strong>Save the GPS coordinates</strong> in your phone or GPS device</li>
                    <li><strong>Print the PDF map</strong> and keep it in your vehicle</li>
                    <li><strong>Walk the boundaries</strong> when you arrive to familiarize yourself</li>
                    <li><strong>Look for property markers</strong> - orange flags, fence corners, posted signs</li>
                    <li><strong>Enable GPS tracking</strong> on your phone to monitor your location</li>
                </ol>
                
                <p style="margin-top: 15px; padding: 15px; background: #ffebee; border-radius: 5px; color: #c62828;">
                    <strong>WARNING:</strong> Cell phone GPS can have 30-50 foot accuracy errors. Always stay well inside boundaries. If uncertain of your location, move toward the center of the property.
                </p>
            </div>
            
            <p style="font-size: 16px; font-weight: bold; margin-top: 20px;">
                Questions about property boundaries? Call Kyle McConnell at 970-571-1015 BEFORE your hunt.
            </p>
        </div>

        <!-- PAYMENT INFORMATION -->
        ${booking.paymentStatus !== 'paid' ? `
        <div class="booking-details">
            <h3 style="margin-top: 0; color: #2d5016;">Payment Information</h3>
            <div class="detail-row">
                <span class="detail-label">Amount Due:</span>
                <span style="font-size: 20px; font-weight: bold; color: #2d5016;">$${booking.totalCost}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Methods:</span>
                <span>PayPal, Venmo (@Kyle-McConnell-15), Cash, or Check</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Due:</span>
                <span>Before arrival at property</span>
            </div>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
                Payment link: <a href="${booking.paymentUrl}">${booking.paymentUrl}</a>
            </p>
        </div>
        ` : ''}

        <!-- CANCELLATION POLICY -->
        <div class="legal-section">
            <h3>CANCELLATION & REFUND POLICY</h3>
            <ul style="margin: 15px 0; padding-left: 25px; line-height: 1.8;">
                <li>Cancellations more than 14 days before hunt date: Full refund minus 10% processing fee</li>
                <li>Cancellations 7-14 days before hunt date: 50% refund</li>
                <li>Cancellations less than 7 days before hunt date: No refund</li>
                <li>No-shows: No refund</li>
                <li>Weather-related cancellations: Rescheduling available, subject to availability</li>
            </ul>
        </div>

        <!-- FINAL REMINDERS -->
        <div class="critical-notice">
            <h2>FINAL CRITICAL REMINDERS</h2>
            <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>SIGN THE LIABILITY WAIVER</strong> - Required before property access</li>
                <li><strong>STAY WITHIN BOUNDARIES</strong> - You are responsible; neighbors will prosecute</li>
                <li><strong>DOWNED GAME PROTOCOL</strong> - Call Kyle (970-571-1015) if game crosses property line</li>
                <li><strong>NO TRESPASSING</strong> - On neighboring properties under any circumstances</li>
                <li><strong>FARM DANGERS</strong> - Enter at your own risk; exercise extreme caution</li>
                <li><strong>VALID LICENSES</strong> - All hunters must have appropriate Colorado licenses</li>
            </ul>
        </div>

        <p style="margin-top: 30px; font-size: 16px;">
            We look forward to providing you with an excellent hunting experience on our historic properties. Please contact us if you have any questions.
        </p>

        <p style="margin-top: 20px; font-size: 16px;">
            <strong>Respectfully,</strong><br>
            Kyle McConnell<br>
            M77 AG<br>
            970-571-1015<br>
            hunting@m77ag.com
        </p>
    </div>
    
    <div class="footer">
        <p><strong>© 2025 M77 AG - McConnell Enterprises LLC</strong></p>
        <p>Four Generations of Family Farming • Est. Late 1800s</p>
        <p style="margin-top: 15px; font-size: 12px;">
            This email contains important legal information. Please retain for your records.<br>
            Booking Number: ${booking.bookingNumber}
        </p>
    </div>
</body>
</html>
    `;

    return {
        subject,
        html: htmlContent,
        text: generatePlainTextVersion(booking)
    };
};

// Plain text version for email clients that don't support HTML
const generatePlainTextVersion = (booking) => {
    return `
M77 AG HUNTING RESERVATION CONFIRMATION
Confirmation Number: ${booking.bookingNumber}

CRITICAL INFORMATION - PLEASE READ CAREFULLY

Dear ${booking.hunterInfo.name},

YOUR RESERVATION DETAILS:
- Property: ${booking.property}
- Dates: ${booking.startDate} to ${booking.endDate}
- Number of Hunters: ${booking.numberOfHunters}
- Game Species: ${booking.gameSpecies.join(', ')}
- Total Cost: $${booking.totalCost}

CRITICAL: PROPERTY BOUNDARIES & TRESPASSING
- YOU ARE SOLELY RESPONSIBLE FOR STAYING WITHIN DESIGNATED PROPERTY BOUNDARIES
- NEIGHBORING LANDOWNERS WILL PROSECUTE TRESPASSERS
- M77 AG is NOT responsible for trespassing violations
- Violation may result in immediate termination WITHOUT refund

DOWNED GAME PROTOCOL:
IF GAME CROSSES PROPERTY LINE:
1. STOP - DO NOT CROSS THE BOUNDARY
2. CALL KYLE McCONNELL: 970-571-1015
3. NO ANSWER DOES NOT EQUAL PERMISSION
4. WAIT FOR COORDINATION with neighboring landowners
5. Unauthorized retrieval = CRIMINAL TRESPASSING

EMERGENCY CONTACT: Kyle McConnell - 970-571-1015

REQUIRED: SIGN LIABILITY WAIVER
Your reservation is NOT complete until you sign the waiver.
Waiver Link: ${booking.waiverUrl}

FARM SAFETY WARNING:
- Working farm with inherent dangers
- Operating equipment, livestock, uneven terrain, water hazards
- YOU ACCEPT FULL RESPONSIBILITY FOR YOUR SAFETY
- ENTER AT YOUR OWN RISK

INDEMNIFICATION:
You agree to INDEMNIFY AND HOLD HARMLESS M77 AG, McConnell Enterprises LLC, all landowners, and anyone associated with M77 AG from any claims, damages, or liabilities.

NEXT STEPS:
1. Sign liability waiver (required within 24 hours)
2. Complete payment ${booking.paymentStatus === 'paid' ? '(received)' : '(due before arrival)'}
3. Verify all hunters have valid Colorado licenses
4. Save emergency contact: 970-571-1015
5. Review property boundaries (maps sent 48 hours before hunt)

Questions? Contact: hunting@m77ag.com or 970-571-1015

M77 AG - McConnell Enterprises LLC
Four Generations of Family Farming • Est. Late 1800s
    `;
};

module.exports = { generateHuntingConfirmationEmail };>