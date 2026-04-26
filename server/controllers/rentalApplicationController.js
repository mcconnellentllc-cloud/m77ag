const RentalApplication = require('../models/rentalApplication');
const { sendEmail } = require('../utils/emailservice');

// Create a new rental application
exports.createRentalApplication = async (req, res) => {
  try {
    const applicationData = req.body;

    // Validate minimum offer amount
    if (applicationData.offerAmount < 1250) {
      return res.status(400).json({
        success: false,
        message: 'Minimum rental offer must be $1,250/month or higher'
      });
    }

    // Create the rental application
    const application = new RentalApplication(applicationData);
    await application.save();

    // Send email notifications
    try {
      // Email to applicant
      const applicantEmailHTML = getApplicantConfirmationEmail(application);
      await sendEmail({
        to: application.personalInfo.email,
        subject: 'Rental Application Received - M77 AG',
        html: applicantEmailHTML
      });

      // Email to office
      const adminEmailHTML = getAdminNotificationEmail(application);
      await sendEmail({
        to: 'office@m77ag.com',
        subject: `New Rental Application: ${application.personalInfo.firstName} ${application.personalInfo.lastName} - $${application.offerAmount}/mo`,
        html: adminEmailHTML
      });
    } catch (emailError) {
      console.error('Error sending rental application emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Rental application submitted successfully',
      data: {
        applicationId: application._id,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Error creating rental application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rental application',
      error: error.message
    });
  }
};

// Get all rental applications (admin only)
exports.getAllRentalApplications = async (req, res) => {
  try {
    const { status, sortBy = 'submittedAt', order = 'desc' } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const applications = await RentalApplication.find(filter)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching rental applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rental applications',
      error: error.message
    });
  }
};

// Get a single rental application by ID (admin only)
exports.getRentalApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await RentalApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Rental application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching rental application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rental application',
      error: error.message
    });
  }
};

// Update rental application status (admin only)
exports.updateRentalApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, backgroundCheckCompleted, backgroundCheckNotes } = req.body;

    const application = await RentalApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Rental application not found'
      });
    }

    // Update fields
    if (status) application.status = status;
    if (adminNotes) application.adminNotes = adminNotes;
    if (backgroundCheckCompleted !== undefined) application.backgroundCheckCompleted = backgroundCheckCompleted;
    if (backgroundCheckNotes) application.backgroundCheckNotes = backgroundCheckNotes;

    if (status === 'under_review' || status === 'approved' || status === 'rejected') {
      application.reviewedAt = new Date();
      if (req.user) {
        application.reviewedBy = req.user._id;
      }
    }

    await application.save();

    // Send notification email if status changed to approved or rejected
    if (status === 'approved' || status === 'rejected') {
      try {
        const statusEmailHTML = getStatusUpdateEmail(application);
        await sendEmail({
          to: application.personalInfo.email,
          subject: `Rental Application ${status === 'approved' ? 'Approved' : 'Update'} - M77 AG`,
          html: statusEmailHTML
        });
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Rental application updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Error updating rental application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rental application',
      error: error.message
    });
  }
};

// Send contract to approved applicant (admin only)
exports.sendRentalContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaseStartDate, leaseEndDate } = req.body;

    const application = await RentalApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Rental application not found'
      });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Application must be approved before sending contract'
      });
    }

    // Update application with contract details
    application.status = 'contract_sent';
    application.contractSentDate = new Date();
    application.leaseStartDate = leaseStartDate;
    application.leaseEndDate = leaseEndDate;

    await application.save();

    // Send contract email
    const contractEmailHTML = getRentalContractEmail(application);
    await sendEmail({
      to: application.personalInfo.email,
      subject: 'Rental Contract - M77 AG Property',
      html: contractEmailHTML
    });

    res.status(200).json({
      success: true,
      message: 'Rental contract sent successfully',
      data: application
    });
  } catch (error) {
    console.error('Error sending rental contract:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send rental contract',
      error: error.message
    });
  }
};

// Email Templates

function getApplicantConfirmationEmail(application) {
  const { firstName, lastName, email } = application.personalInfo;
  const { property, offerAmount } = application;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rental Application Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d5016 0%, #1a3009 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0 0 10px 0; font-size: 32px; font-family: 'Oswald', sans-serif;">M77 AG</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px;">Rental Application Received</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">Thank you, ${firstName}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                We have received your rental application for <strong>${property}</strong>.
              </p>

              <!-- Application Summary -->
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #2d5016; margin: 0 0 15px 0; font-size: 18px;">Application Summary</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-weight: 600;">Applicant:</td>
                    <td style="color: #1a1a1a;">${firstName} ${lastName}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-weight: 600;">Property:</td>
                    <td style="color: #1a1a1a;">${property}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-weight: 600;">Offered Rent:</td>
                    <td style="color: #2d5016; font-weight: 700; font-size: 18px;">$${offerAmount}/month</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-weight: 600;">Submitted:</td>
                    <td style="color: #1a1a1a;">${new Date().toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>

              <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px;">Next Steps</h3>
              <ol style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>We will review your application and conduct background/credit checks (2-3 business days)</li>
                <li>You will be contacted to pay the $50 application fee per adult applicant</li>
                <li>Once approved, we will send you the rental contract to review and sign</li>
                <li>After contract signing, we will coordinate your move-in details</li>
              </ol>

              <div style="background: #fff4e6; border-left: 4px solid #d4af37; padding: 15px; margin: 25px 0;">
                <p style="color: #666; margin: 0; font-size: 14px;">
                  <strong>Important:</strong> Keep an eye on your email for updates. If you have any questions,
                  please contact us at <a href="mailto:office@m77ag.com" style="color: #2d5016;">office@m77ag.com</a>
                  or call (970) 520-1807.
                </p>
              </div>

              <p style="color: #666; line-height: 1.6; margin-top: 25px;">
                Thank you for choosing M77 AG!
              </p>
              <p style="color: #666; line-height: 1.6; margin: 0;">
                Best regards,<br>
                <strong>M77 AG Property Management</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">M77 AG</p>
              <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">${property}</p>
              <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">Phone: (970) 520-1807</p>
              <p style="color: #999; font-size: 12px; margin: 0;">Email: office@m77ag.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getAdminNotificationEmail(application) {
  const { firstName, lastName, email, phone } = application.personalInfo;
  const { property, offerAmount, moveInDate } = application;
  const { employer, monthlyIncome } = application.employment;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Rental Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0 0 5px 0; font-size: 28px;">New Rental Application</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0;">Review and process this application</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px;">Applicant Information</h2>

              <!-- Quick Summary -->
              <div style="background: linear-gradient(135deg, #2d5016 0%, #1a3009 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <p style="color: #d4af37; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">OFFERED RENT</p>
                <p style="color: white; font-size: 36px; font-weight: 700; margin: 0;">$${offerAmount}/month</p>
              </div>

              <!-- Applicant Details -->
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td colspan="2" style="background: #f9f9f9; padding: 10px; font-weight: 700; color: #1a1a1a;">Personal Information</td>
                </tr>
                <tr>
                  <td style="color: #666; width: 40%;">Name:</td>
                  <td style="color: #1a1a1a; font-weight: 600;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Email:</td>
                  <td><a href="mailto:${email}" style="color: #1976d2;">${email}</a></td>
                </tr>
                <tr>
                  <td style="color: #666;">Phone:</td>
                  <td><a href="tel:${phone}" style="color: #1976d2;">${phone}</a></td>
                </tr>
                <tr>
                  <td style="color: #666;">Desired Move-In:</td>
                  <td style="color: #1a1a1a;">${new Date(moveInDate).toLocaleDateString()}</td>
                </tr>
              </table>

              <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td colspan="2" style="background: #f9f9f9; padding: 10px; font-weight: 700; color: #1a1a1a;">Employment Information</td>
                </tr>
                <tr>
                  <td style="color: #666; width: 40%;">Employer:</td>
                  <td style="color: #1a1a1a;">${employer}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Monthly Income:</td>
                  <td style="color: #2d5016; font-weight: 700;">$${monthlyIncome}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Income-to-Rent Ratio:</td>
                  <td style="color: #1a1a1a;">${(monthlyIncome / offerAmount).toFixed(2)}x</td>
                </tr>
              </table>

              <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td colspan="2" style="background: #f9f9f9; padding: 10px; font-weight: 700; color: #1a1a1a;">Additional Information</td>
                </tr>
                <tr>
                  <td style="color: #666; width: 40%;">Occupants:</td>
                  <td style="color: #1a1a1a;">${application.additionalInfo.occupants}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Pets:</td>
                  <td style="color: #1a1a1a;">${application.additionalInfo.pets || 'None'}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Vehicles:</td>
                  <td style="color: #1a1a1a;">${application.additionalInfo.vehicles}</td>
                </tr>
              </table>

              <div style="background: #fff4e6; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
                <p style="color: #666; margin: 0; font-size: 14px;">
                  <strong>Action Required:</strong> Review this application in the admin dashboard and conduct background/credit checks.
                  Application ID: <strong>${application._id}</strong>
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/rental-applications/${application._id}"
                   style="display: inline-block; background: #1976d2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: 700;">
                  VIEW APPLICATION
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getStatusUpdateEmail(application) {
  const { firstName } = application.personalInfo;
  const isApproved = application.status === 'approved';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Application Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, ${isApproved ? '#2d5016' : '#666'} 0%, ${isApproved ? '#1a3009' : '#444'} 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 32px;">M77 AG</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 20px;">Application ${isApproved ? 'Approved' : 'Update'}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0;">Dear ${firstName},</h2>
              ${isApproved ? `
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Great news! Your rental application for <strong>${application.property}</strong> has been <strong style="color: #2d5016;">APPROVED</strong>!
                </p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  We will be sending you the rental contract shortly. Please review it carefully and sign it to secure your new home.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  If you have any questions, please don't hesitate to contact us.
                </p>
              ` : `
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Thank you for your interest in our property at <strong>${application.property}</strong>.
                </p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  After careful review, we regret to inform you that we are unable to approve your application at this time.
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Thank you for considering M77 AG, and we wish you the best in your housing search.
                </p>
              `}
              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                Best regards,<br>
                <strong>M77 AG Property Management</strong><br>
                <a href="mailto:office@m77ag.com" style="color: #2d5016;">office@m77ag.com</a> | (970) 520-1807
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getRentalContractEmail(application) {
  const { firstName, lastName } = application.personalInfo;
  const { property, offerAmount, leaseStartDate, leaseEndDate } = application;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rental Contract</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #2d5016 0%, #1a3009 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 32px;">M77 AG</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 20px;">Rental Contract</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0;">Congratulations, ${firstName}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Your rental contract for <strong>${property}</strong> is ready for review and signature.
              </p>

              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #2d5016; margin: 0 0 15px 0;">Contract Details</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #666;">Tenant:</td>
                    <td style="color: #1a1a1a; font-weight: 600;">${firstName} ${lastName}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">Property:</td>
                    <td style="color: #1a1a1a;">${property}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">Monthly Rent:</td>
                    <td style="color: #2d5016; font-weight: 700; font-size: 18px;">$${offerAmount}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">Lease Start:</td>
                    <td style="color: #1a1a1a;">${new Date(leaseStartDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">Lease End:</td>
                    <td style="color: #1a1a1a;">${new Date(leaseEndDate).toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #fff4e6; border-left: 4px solid #d4af37; padding: 15px; margin-bottom: 25px;">
                <h3 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 16px;">Payment Terms</h3>
                <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>First month's rent and security deposit due before move-in</li>
                  <li>Security deposit: $${offerAmount}</li>
                  <li>Rent due on the 1st of each month</li>
                  <li>Payment methods: Check, Cash, Bank Transfer</li>
                  <li>Late fee: $50 after 5-day grace period</li>
                </ul>
              </div>

              <h3 style="color: #1a1a1a; margin: 0 0 15px 0;">Next Steps</h3>
              <ol style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>Review the attached rental contract carefully</li>
                <li>Sign and return the contract to office@m77ag.com</li>
                <li>Submit first month's rent + security deposit ($${offerAmount * 2})</li>
                <li>Schedule your move-in walkthrough</li>
                <li>Receive your keys on move-in day!</li>
              </ol>

              <p style="color: #666; line-height: 1.6; margin-top: 25px;">
                If you have any questions about the contract or next steps, please contact us.
              </p>
              <p style="color: #666; line-height: 1.6; margin: 0;">
                Welcome home!<br>
                <strong>M77 AG Property Management</strong><br>
                <a href="mailto:office@m77ag.com" style="color: #2d5016;">office@m77ag.com</a> | (970) 520-1807
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = {
  createRentalApplication,
  getAllRentalApplications,
  getRentalApplicationById,
  updateRentalApplicationStatus,
  sendRentalContract
};
