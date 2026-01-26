const nodemailer = require('nodemailer');
const { getHuntingConfirmationEmail, getAdminNotificationEmail } = require('../email-templates/hunting-confirmation-email');
const { getWaiverConfirmationEmail, getAdminWaiverNotification } = require('../email-templates/waiver-confirmation-email');
const { getServiceContractEmail, getAdminServiceNotification } = require('../email-templates/service-contract-email');

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
      to: 'hunting@m77ag.com',
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
      to: 'hunting@m77ag.com',
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

// Generic send email function
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

module.exports = {
  sendBookingConfirmation,
  sendWaiverConfirmation,
  sendServiceContract,
  sendEmail
};