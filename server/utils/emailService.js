const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create a reusable transporter object
let transporter;

// Create test account for development or use configured email in production
async function createTransporter() {
  // If we're in development mode and no valid email configuration is provided, create a test account
  if (process.env.NODE_ENV !== 'production' && (!config.email.user || !config.email.password)) {
    console.log('Creating test email account for development...');
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Test email account created:', testAccount.user);
    console.log('To view test emails, go to: https://ethereal.email');
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    return;
  }
  
  // Use real email configuration
  console.log('Using configured email service:', config.email.host);
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  
  // Verify connection
  try {
    await transporter.verify();
    console.log('SMTP server connection verified and ready to send emails');
  } catch (error) {
    console.error('SMTP connection error:', error);
    console.log('Falling back to Ethereal test email account...');
    
    // If connection fails, fall back to Ethereal
    const testAccount = await nodemailer.createTestAccount();
    console.log('Test email account created:', testAccount.user);
    console.log('To view test emails, go to: https://ethereal.email');
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
}

// Initialize the transporter when the module is loaded
createTransporter();

/**
 * Send an email
 * @param {Object} mailOptions - Email options (to, subject, text, html)
 * @returns {Promise} - Resolves when email is sent
 */
const sendEmail = async (mailOptions) => {
  try {
    // Make sure transporter is initialized
    if (!transporter) {
      await createTransporter();
    }
    
    const info = await transporter.sendMail({
      from: config.email.from || 'ParkEase <no-reply@parkease.com>',
      ...mailOptions
    });
    
    console.log(`Email sent: ${info.messageId}`);
    
    // For Ethereal emails, log the URL where the email can be viewed
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a booking confirmation email to user
 * @param {Object} booking - Booking details
 * @param {Object} user - User details
 * @param {Object} parking - Parking details
 */
const sendBookingConfirmationEmail = async (booking, user, parking) => {
  try {
    if (!user.email) {
      console.error('Cannot send email: User email not provided');
      return;
    }

    const startTime = new Date(booking.startTime).toLocaleString();
    const endTime = new Date(booking.endTime).toLocaleString();
    
    // Get vehicle details from potentially different data structures
    let vehicleNumber = 'Not provided';
    let vehicleType = 'Not provided';
    
    if (booking.vehicleDetails) {
      if (booking.vehicleDetails.plateNumber) {
        vehicleNumber = booking.vehicleDetails.plateNumber;
      } else if (booking.vehicleDetails.number) {
        vehicleNumber = booking.vehicleDetails.number;
      }
      
      if (booking.vehicleDetails.vehicleType) {
        vehicleType = booking.vehicleDetails.vehicleType;
      } else if (booking.vehicleDetails.type && typeof booking.vehicleDetails.type === 'string') {
        vehicleType = booking.vehicleDetails.type;
      }
    }
    
    const mailOptions = {
      to: user.email,
      subject: 'ParkEase: Your Booking Has Been Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3f51b5; text-align: center;">Your Parking Booking is Confirmed</h2>
          
          <p>Hello ${user.name},</p>
          
          <p>Your booking request has been <strong style="color: #4caf50;">approved</strong> by the operator.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #3f51b5;">Booking Details:</h3>
            <p><strong>Parking Location:</strong> ${parking.name}</p>
            <p><strong>Address:</strong> ${parking.location?.address || 'Not provided'}</p>
            <p><strong>Start Time:</strong> ${startTime}</p>
            <p><strong>End Time:</strong> ${endTime}</p>
            <p><strong>Duration:</strong> ${booking.duration} hours</p>
            <p><strong>Total Price:</strong> ₹${booking.totalPrice.toFixed(2)}</p>
            <p><strong>Vehicle Number:</strong> ${vehicleNumber}</p>
            <p><strong>Vehicle Type:</strong> ${vehicleType}</p>
          </div>
          
          <p>Please show this email or your booking reference when you arrive at the parking location.</p>
          
          <p><strong>Booking Reference:</strong> ${booking._id}</p>
          
          <p>If you need to cancel your booking or have any questions, please log in to your account or contact our support team.</p>
          
          <p>Thank you for using ParkEase!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #757575; font-size: 12px;">
            <p>This is an automated email, please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} ParkEase. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const result = await sendEmail(mailOptions);
    console.log(`Booking confirmation email sent to ${user.email}`);
    return result;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // Don't throw the error, as we don't want to interrupt the booking flow
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmationEmail
};