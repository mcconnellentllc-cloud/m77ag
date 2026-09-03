const nodemailer = require('nodemailer');
const { getHuntingConfirmationEmail, getAdminNotificationEmail } = require('../email-templates/hunting-confirmation-email');
const { getWaiverConfirmationEmail, getAdminWaiverNotification } = require('../email-templates/waiver-confirmation-email');
const { getServiceContractEmail, getAdminServiceNotification } = require('../email-templates/service-contract-email');
const { getEquipmentPurchaseEmail, getAdminEquipmentNotification } = require('../email-templates/equipment-purchase-email');
const { getSeasonPassConfirmationEmail, getAdminSeasonPassNotification } = require('../email-templates/season-pass-confirmation-email');
const { getWaiverReminderEmail } = require('../email-templates/waiver-reminder-email');
const { getCustomerCardLinkEmail } = require('../email-templates/customer-card-link-email');

// SMTP transport. The mailboxes are Microsoft 365, so the default host is
// Microsoft's SMTP relay on port 587 with STARTTLS. Set MAIL_SERVICE (for
// example 'gmail') to use a provider shortcut instead, or MAIL_HOST/MAIL_PORT
// for any other server.
const MAIL_HOST = process.env.MAIL_HOST || 'smtp.office365.com';
const MAIL_PORT = Number(process.env.MAIL_PORT) || 587;
const MAIL_SERVICE = process.env.MAIL_SERVICE;

const buildTransport = (user, pass) => {
  if (MAIL_SERVICE) {
    return nodemailer.createTransport({ service: MAIL_SERVICE, auth: { user, pass } });
  }

  return nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    // Port 587 upgrades through STARTTLS rather than connecting over TLS
    secure: MAIL_PORT === 465,
    requireTLS: MAIL_PORT !== 465,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' }
  });
};

// Hunting mail goes through the hunting mailbox, never the office mailbox.
//
// hunting@m77ag.com is a SHARED Microsoft 365 mailbox. A shared mailbox has no
// licence and no password of its own, so it cannot authenticate directly.
// Authenticate as a licensed account that holds "Send As" permission on it
// (HUNTING_SMTP_USER / HUNTING_SMTP_PASS) and send with the shared address in
// the From header (HUNTING_FROM_ADDRESS).
const HUNTING_SMTP_USER = process.env.HUNTING_SMTP_USER || process.env.HUNTING_EMAIL_USER || process.env.EMAIL_USER;
const HUNTING_SMTP_PASS = process.env.HUNTING_SMTP_PASS || process.env.HUNTING_EMAIL_PASS || process.env.EMAIL_PASS;
const HUNTING_FROM_ADDRESS = process.env.HUNTING_FROM_ADDRESS || 'hunting@m77ag.com';
const HUNTING_FROM = `"M77 AG Hunting" <${HUNTING_FROM_ADDRESS}>`;
const HUNTING_REPLY_TO = HUNTING_FROM_ADDRESS;

// Office mail (custom farming, equipment, rentals) uses the office mailbox.
const OFFICE_SMTP_USER = process.env.OFFICE_SMTP_USER || process.env.OFFICE_EMAIL_USER || process.env.EMAIL_USER;
const OFFICE_SMTP_PASS = process.env.OFFICE_SMTP_PASS || process.env.OFFICE_EMAIL_PASS || process.env.EMAIL_PASS;
const OFFICE_FROM_ADDRESS = process.env.OFFICE_FROM_ADDRESS || 'office@m77ag.com';
const OFFICE_EMAIL_USER = OFFICE_FROM_ADDRESS;

// Internal recipients for hunting notifications. Hunting bookings, waivers,
// season passes and reviews are handled out of the hunting inbox, not the office.
const HUNTING_NOTIFICATION_RECIPIENTS = (process.env.HUNTING_NOTIFY_EMAILS || 'hunting@m77ag.com')
  .split(',')
  .map(address => address.trim())
  .filter(Boolean)
  .join(', ');

// Transporter authenticating as the account that can send as the hunting mailbox
const createHuntingTransporter = () => buildTransport(HUNTING_SMTP_USER, HUNTING_SMTP_PASS);

// Transporter for the office mailbox
const createTransporter = () => buildTransport(OFFICE_SMTP_USER, OFFICE_SMTP_PASS);

// Confirm both mailboxes can authenticate and send. Returns a result per
// mailbox rather than throwing, so a startup check can report both.
const verifyMailConfiguration = async () => {
  const targets = [
    { name: 'hunting', authUser: HUNTING_SMTP_USER, from: HUNTING_FROM_ADDRESS, transport: createHuntingTransporter },
    { name: 'office', authUser: OFFICE_SMTP_USER, from: OFFICE_FROM_ADDRESS, transport: createTransporter }
  ];

  const results = [];
  for (const target of targets) {
    const detail = {
      mailbox: target.name,
      host: MAIL_SERVICE ? `service:${MAIL_SERVICE}` : `${MAIL_HOST}:${MAIL_PORT}`,
      authenticatesAs: target.authUser || '(not configured)',
      sendsAs: target.from
    };

    if (!target.authUser || !(target.name === 'hunting' ? HUNTING_SMTP_PASS : OFFICE_SMTP_PASS)) {
      results.push({ ...detail, ok: false, error: 'SMTP username or password is not set' });
      continue;
    }

    try {
      await target.transport().verify();
      results.push({ ...detail, ok: true });
    } catch (error) {
      results.push({ ...detail, ok: false, error: error.message });
    }
  }

  return results;
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
const sendEmail = async ({ to, subject, html, text, from, replyTo }) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: from || `"M77 AG" <${OFFICE_EMAIL_USER}>`,
      replyTo: replyTo || OFFICE_FROM_ADDRESS,
      to,
      subject,
      html,
      text
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

// Email a customer their passwordless customer card link
const sendCustomerCardLink = async ({ email, name, url, expiresAt }) => {
  return sendHuntingEmail({
    to: email,
    subject: 'Your M77 AG Customer Card',
    html: getCustomerCardLinkEmail({ name, url, expiresAt })
  });
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
  verifyMailConfiguration,
  sendCustomerCardLink,
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