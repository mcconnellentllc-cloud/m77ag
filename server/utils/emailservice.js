const nodemailer = require('nodemailer');
const { getHuntingConfirmationEmail, getAdminNotificationEmail } = require('../email-templates/hunting-confirmation-email');
const { getWaiverConfirmationEmail, getAdminWaiverNotification } = require('../email-templates/waiver-confirmation-email');
const { getServiceContractEmail, getAdminServiceNotification } = require('../email-templates/service-contract-email');
const { getEquipmentPurchaseEmail, getAdminEquipmentNotification } = require('../email-templates/equipment-purchase-email');
const { getSeasonPassConfirmationEmail, getAdminSeasonPassNotification } = require('../email-templates/season-pass-confirmation-email');
const { getWaiverReminderEmail } = require('../email-templates/waiver-reminder-email');

// Hunting mail goes through the hunting mailbox, never the office mailbox.
// Set HUNTING_EMAIL_USER and HUNTING_EMAIL_PASS to the hunting account and its
// app password. Without those, hunting mail falls back to the shared account,
// and Gmail will rewrite the sender to whatever account actually authenticated.
const HUNTING_EMAIL_USER = process.env.HUNTING_EMAIL_USER || process.env.EMAIL_USER || 'hunting@m77ag.com';
const HUNTING_EMAIL_PASS = process.env.HUNTING_EMAIL_PASS || process.env.EMAIL_PASS;
const HUNTING_FROM = `"M77 AG Hunting" <${HUNTING_EMAIL_USER}>`;
const HUNTING_REPLY_TO = 'hunting@m77ag.com';

// Office mail (custom farming, equipment, rentals) keeps the shared account.
const OFFICE_EMAIL_USER = process.env.OFFICE_EMAIL_USER || process.env.EMAIL_USER || 'office@m77ag.com';
const OFFICE_EMAIL_PASS = process.env.OFFICE_EMAIL_PASS || process.env.EMAIL_PASS;

// Internal recipients for hunting notifications. Hunting bookings, waivers,
// season passes and reviews are handled out of the hunting inbox, not the office.
const HUNTING_NOTIFICATION_RECIPIENTS = (process.env.HUNTING_NOTIFY_EMAILS || 'hunting@m77ag.com')
  .split(',')
  .map(address => address.trim())
  .filter(Boolean)
  .join(', ');

// Transporter for the hunting mailbox
const createHuntingTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: HUNTING_EMAIL_USER,
      pass: HUNTING_EMAIL_PASS
    }
  });
};

// Transporter for the office mailbox
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: OFFICE_EMAIL_USER,
      pass: OFFICE_EMAIL_PASS
    }
  });
};

// Property label for subject lines. Bookings store either the display name
// ('Heritage Farm', 'Prairie Peace', 'Both Properties') or the legacy
// 'heritage-farm' slug, so both are handled here.
const propertyLabel = (parcel) => {
  if (parcel === 'Both Properties') return 'Heritage Farm & Prairie Peace';
  if (parcel === 'heritage-farm' || parcel === 'Heritage Farm') return 'Heritage Farm';
  return 'Prairie Peace';
};

// Send any hunting email from the hunting mailbox
const sendHuntingEmail = async ({ to, subject, html }) => {
  const transporter = createHuntingTransporter();

  await transporter.sendMail({
    from: HUNTING_FROM,
    replyTo: HUNTING_REPLY_TO,
    to,
    subject,
    html
  });

  console.log(`Hunting email sent to ${to}: ${subject}`);
  return true;
};

// Send booking confirmation email (Step 2 - after payment)
const sendBookingConfirmation = async (booking) => {
  try {
    const transporter = createHuntingTransporter();
    
    // Prepare booking data for email template
    const emailData = {
      _id: booking._id,
      customerName: booking.customerName,
      email: booking.email,
      phone: booking.phone,
      property: booking.parcel,
      checkIn: booking.checkinDate,
      checkOut: booking.checkoutDate,
      numberOfHunters: booking.numHunters,
      numberOfNights: booking.numNights,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus
    };
    
    // Generate HTML emails from templates
    const customerEmailHTML = getHuntingConfirmationEmail(emailData);
    const adminEmailHTML = getAdminNotificationEmail(emailData);
    
    // Email to customer
    await transporter.sendMail({
      from: HUNTING_FROM,
      replyTo: HUNTING_REPLY_TO,
      to: booking.email,
      subject: `Hunting Reservation Confirmed - ${propertyLabel(booking.parcel)}`,
      html: customerEmailHTML
    });
    
    // Email to admin/Kyle at hunting@m77ag.com
    await transporter.sendMail({
      from: HUNTING_FROM,
      replyTo: HUNTING_REPLY_TO,
      to: HUNTING_NOTIFICATION_RECIPIENTS,
      subject: `New Booking: ${booking.customerName} - ${propertyLabel(booking.parcel)}`,
      html: adminEmailHTML
    });
    
    console.log('Booking confirmation emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

// Send waiver confirmation email (Step 4 - after waiver signed)
const sendWaiverConfirmation = async (booking) => {
  try {
    const transporter = createHuntingTransporter();
    
    // Generate HTML emails from templates (includes printable docs and maps)
    const customerEmailHTML = getWaiverConfirmationEmail(booking);
    const adminEmailHTML = getAdminWaiverNotification(booking);
    
    // Email to customer with printable vehicle card and property maps
    await transporter.sendMail({
      from: HUNTING_FROM,
      replyTo: HUNTING_REPLY_TO,
      to: booking.email,
      subject: `Waiver Confirmed - Your Hunt Documents and Maps - ${propertyLabel(booking.parcel)}`,
      html: customerEmailHTML
    });
    
    // Email to admin/Kyle at hunting@m77ag.com
    await transporter.sendMail({
      from: HUNTING_FROM,
      replyTo: HUNTING_REPLY_TO,
      to: HUNTING_NOTIFICATION_RECIPIENTS,
      subject: `Waiver Signed: ${booking.customerName} - ${propertyLabel(booking.parcel)}`,
      html: adminEmailHTML
    });
    
    console.log('Waiver confirmation emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending waiver confirmation email:', error);
    throw error;
  }
};

// Send service contract email
const sendServiceContract = async (serviceData) => {
  try {
    const transporter = createTransporter();

    // Generate HTML emails from templates
    const customerEmailHTML = getServiceContractEmail(serviceData);
    const adminEmailHTML = getAdminServiceNotification(serviceData);

    // Email to customer with service contract
    if (serviceData.email) {
      await transporter.sendMail({
        from: `"M77 AG Services" <${OFFICE_EMAIL_USER}>`,
        replyTo: 'office@m77ag.com',
        to: serviceData.email,
        subject: `Service Contract - ${serviceData.name} - M77 AG Custom Farming`,
        html: customerEmailHTML
      });
    }

    // Email to office@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Services" <${OFFICE_EMAIL_USER}>`,
      replyTo: 'office@m77ag.com',
      to: 'office@m77ag.com',
      subject: `New Service Contract: ${serviceData.name} - ${serviceData.acres} acres`,
      html: adminEmailHTML
    });

    console.log('Service contract emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending service contract email:', error);
    throw error;
  }
};

// Generic send email function (used by rental management flows)
const sendEmail = async ({ to, subject, html, from, replyTo }) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: from || `"M77 AG" <${OFFICE_EMAIL_USER}>`,
      replyTo: replyTo || 'office@m77ag.com',
      to,
      subject,
      html
    });

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send equipment purchase confirmation email
const sendEquipmentPurchaseConfirmation = async (purchaseData) => {
  try {
    const transporter = createTransporter();

    // Generate HTML emails from templates
    const customerEmailHTML = getEquipmentPurchaseEmail(purchaseData);
    const adminEmailHTML = getAdminEquipmentNotification(purchaseData);

    // Email to buyer with purchase confirmation
    await transporter.sendMail({
      from: `"M77 AG Equipment" <${OFFICE_EMAIL_USER}>`,
      replyTo: 'office@m77ag.com',
      to: purchaseData.buyerEmail,
      subject: `Purchase Confirmed - ${purchaseData.equipmentTitle} - M77 AG`,
      html: customerEmailHTML
    });

    // Email to admin/Kyle at office@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Equipment" <${OFFICE_EMAIL_USER}>`,
      replyTo: 'office@m77ag.com',
      to: 'office@m77ag.com',
      subject: `SOLD: ${purchaseData.equipmentTitle} - $${purchaseData.finalPrice.toLocaleString()}`,
      html: adminEmailHTML
    });

    console.log('Equipment purchase confirmation emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending equipment purchase email:', error);
    throw error;
  }
};


// Send season pass confirmation (waiver link + property maps) to the pass holder
// and notify the office. Used by website purchases and by passes the office
// records from an off-site payment.
const sendSeasonPassConfirmation = async (passHolder) => {
  try {
    const transporter = createHuntingTransporter();

    const customerEmailHTML = getSeasonPassConfirmationEmail(passHolder);
    const adminEmailHTML = getAdminSeasonPassNotification(passHolder);

    await transporter.sendMail({
      from: HUNTING_FROM,
      replyTo: HUNTING_REPLY_TO,
      to: passHolder.email,
      subject: `Season Pass Confirmed - Waiver and Property Maps - M77 AG Hunting`,
      html: customerEmailHTML
    });

    await transporter.sendMail({
      from: HUNTING_FROM,
      replyTo: HUNTING_REPLY_TO,
      to: HUNTING_NOTIFICATION_RECIPIENTS,
      subject: `Season Pass Sold: ${passHolder.name} - ${passHolder.seasonPass && passHolder.seasonPass.type === '10-day' ? '10-Day' : '5-Day'}`,
      html: adminEmailHTML
    });

    console.log('Season pass confirmation emails sent successfully to', passHolder.email);
    return true;
  } catch (error) {
    console.error('Error sending season pass confirmation email:', error);
    throw error;
  }
};

// Send waiver reminder to a booked hunter who has not signed yet
const sendWaiverReminder = async (booking) => {
  try {
    await sendHuntingEmail({
      to: booking.email,
      subject: 'Waiver Reminder - Action Required for Your M77 AG Hunting Reservation',
      html: getWaiverReminderEmail(booking)
    });

    return true;
  } catch (error) {
    console.error('Error sending waiver reminder email:', error);
    throw error;
  }
};

// Send the post-waiver documents (dash card and property maps) to a hunter who
// signed a waiver that is not tied to a booking, such as a season pass holder.
const sendStandaloneWaiverConfirmation = async (waiver) => {
  const waiverAsBooking = {
    _id: waiver._id,
    customerName: waiver.hunterName,
    email: waiver.email,
    phone: waiver.phone,
    parcel: waiver.property || 'Both Properties',
    checkinDate: waiver.huntDate,
    numHunters: 1,
    totalPrice: 0,
    paymentStatus: 'paid',
    vehicleMake: waiver.vehicleMake,
    vehicleModel: waiver.vehicleModel,
    vehicleColor: waiver.vehicleColor
  };

  return sendWaiverConfirmation(waiverAsBooking);
};

module.exports = {
  sendHuntingEmail,
  HUNTING_NOTIFICATION_RECIPIENTS,
  sendBookingConfirmation,
  sendWaiverConfirmation,
  sendSeasonPassConfirmation,
  sendWaiverReminder,
  sendStandaloneWaiverConfirmation,
  sendServiceContract,
  sendEmail,
  sendEquipmentPurchaseConfirmation
};