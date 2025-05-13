import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string; // Can be enhanced to support HTML: html?: string;
}

const sendEmailUtil = async (options: EmailOptions): Promise<void> => {
  // Ensure all required environment variables are set
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD || !process.env.FROM_NAME || !process.env.FROM_EMAIL) {
    console.error('[SendEmail] SMTP configuration is incomplete. Check environment variables.');
    throw new Error('Email service is not properly configured.'); // Or handle more gracefully
  }

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL, // generated ethereal user
      pass: process.env.SMTP_PASSWORD, // generated ethereal password
    },
    // logger: process.env.NODE_ENV === 'development', // Enable logging in dev
    // debug: process.env.NODE_ENV === 'development' // Enable debug output in dev
  });

  // Define email options
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`, // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
    // html: options.html // html body (if you add html to EmailOptions)
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SendEmail] Message sent: ${info.messageId}`.cyan);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  } catch (error) {
    console.error(`[SendEmail] Error sending email to ${options.email}:`.red, error);
    // Rethrow the error so the calling service (e.g., AuthService) can handle it
    throw error;
  }
};

export default sendEmailUtil; 