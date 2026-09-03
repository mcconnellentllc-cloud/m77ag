const nodemailer = require('nodemailer');
const { getHuntingConfirmationEmail, getAdminNotificationEmail } = require('../email-templates/hunting-confirmation-email');
const { getWaiverConfirmationEmail, getAdminWaiverNotification } = require('../email-templates/waiver-confirmation-email');
const { getServiceContractEmail, getAdminServiceNotification } = require('../email-templates/service-contract-email');
const { getEquipmentPurchaseEmail, getAdminEquipmentNotification } = require('../email-templates/equipment-purchase-email');
const { getSeasonPassConfirmationEmail, getAdminSeasonPassNotification } = require('../email-templates/season-pass-confirmation-email');
const { getWaiverReminderEmail } = require('../email-templates/waiver-reminder-email');

// Internal recipients for hunting notifications. Payments taken off-site (PayPal
// invoices) land in the office inbox, so the office is copied on every hunting
// notification to prevent a paid customer from being missed.
const HUNTING_NOTIFICATION_RECIPIENTS = (process.env.HUNTING_NOTIFY_EMAILS || 'hunting@m77ag.com,office@m77ag.com')
  .split(',')
  .map(address => address.trim())
  .filter(Boolean)
  .join(', ');

// Create email transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'hunting@m77ag.com',
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send booking confirmation email (Step 2 - after payment)
const sendBookingConfirmation = async (booking) => {
  try {
    const transporter = createTransporter();
    
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
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: booking.email,
      subject: `Hunting Reservation Confirmed - ${booking.parcel === 'heritage-farm' ? 'M77 AG Heritage Farm' : 'Prairie Peace'}`,
      html: customerEmailHTML
    });
    
    // Email to admin/Kyle at hunting@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: HUNTING_NOTIFICATION_RECIPIENTS,
      subject: `New Booking: ${booking.customerName} - ${booking.parcel === 'heritage-farm' ? 'Heritage Farm' : 'Prairie Peace'}`,
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
    const transporter = createTransporter();
    
    // Generate HTML emails from templates (includes printable docs and maps)
    const customerEmailHTML = getWaiverConfirmationEmail(booking);
    const adminEmailHTML = getAdminWaiverNotification(booking);
    
    // Email to customer with printable vehicle card and property maps
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: booking.email,
      subject: `Waiver Confirmed - Your Hunt Documents & Maps - ${booking.parcel === 'heritage-farm' ? 'Heritage Farm' : 'Prairie Peace'}`,
      html: customerEmailHTML
    });
    
    // Email to admin/Kyle at hunting@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: HUNTING_NOTIFICATION_RECIPIENTS,
      subject: `Waiver Signed: ${booking.customerName} - ${booking.parcel === 'heritage-farm' ? 'Heritage Farm' : 'Prairie Peace'}`,
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
        from: `"M77 AG Services" <${process.env.EMAIL_USER || 'office@m77ag.com'}>`,
        replyTo: 'office@m77ag.com',
        to: serviceData.email,
        subject: `Service Contract - ${serviceData.name} - M77 AG Custom Farming`,
        html: customerEmailHTML
      });
    }

    // Email to office@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Services" <${process.env.EMAIL_USER || 'office@m77ag.com'}>`,
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
      from: from || `"M77 AG" <${process.env.EMAIL_USER || 'office@m77ag.com'}>`,
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
      from: `"M77 AG Equipment" <${process.env.EMAIL_USER || 'office@m77ag.com'}>`,
      replyTo: 'office@m77ag.com',
      to: purchaseData.buyerEmail,
      subject: `Purchase Confirmed - ${purchaseData.equipmentTitle} - M77 AG`,
      html: customerEmailHTML
    });

    // Email to admin/Kyle at office@m77ag.com
    await transporter.sendMail({
      from: `"M77 AG Equipment" <${process.env.EMAIL_USER || 'office@m77ag.com'}>`,
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
    const transporter = createTransporter();

    const customerEmailHTML = getSeasonPassConfirmationEmail(passHolder);
    const adminEmailHTML = getAdminSeasonPassNotification(passHolder);

    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: passHolder.email,
      subject: `Season Pass Confirmed - Waiver and Property Maps - M77 AG Hunting`,
      html: customerEmailHTML
    });

    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
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
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"M77 AG Hunting" <${process.env.EMAIL_USER || 'hunting@m77ag.com'}>`,
      replyTo: 'hunting@m77ag.com',
      to: booking.email,
      subject: 'Waiver Reminder - Action Required for Your M77 AG Hunting Reservation',
      html: getWaiverReminderEmail(booking)
    });

    console.log('Waiver reminder email sent to:', booking.email);
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
  sendBookingConfirmation,
  sendWaiverConfirmation,
  sendSeasonPassConfirmation,
  sendWaiverReminder,
  sendStandaloneWaiverConfirmation,
  sendServiceContract,
  sendEmail,
  sendEquipmentPurchaseConfirmation
};