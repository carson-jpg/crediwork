import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Configure handlebars
const handlebarsOptions = {
  viewEngine: {
    extName: '.hbs',
    partialsDir: path.join(__dirname, '../templates/partials'),
    layoutsDir: path.join(__dirname, '../templates/layouts'),
    defaultLayout: 'main.hbs'
  },
  viewPath: path.join(__dirname, '../templates'),
  extName: '.hbs'
};

transporter.use('compile', hbs(handlebarsOptions));

// Test email connection
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
};

// Send email function
export const sendEmail = async (to, subject, template, context = {}) => {
  try {
    const mailOptions = {
      from: `"CrediWork" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      template,
      context: {
        ...context,
        year: new Date().getFullYear(),
        appName: 'CrediWork'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

// Predefined email templates
export const emailTemplates = {
  // Payment related emails
  PAYMENT_SUCCESS: 'payment-success',
  PAYMENT_FAILED: 'payment-failed',
  PAYMENT_REMINDER: 'payment-reminder',

  // Withdrawal related emails
  WITHDRAWAL_SUBMITTED: 'withdrawal-submitted',
  WITHDRAWAL_APPROVED: 'withdrawal-approved',
  WITHDRAWAL_REJECTED: 'withdrawal-rejected'
};

// Send payment success email
export const sendPaymentSuccessEmail = async (userEmail, userName, amount, packageName) => {
  return await sendEmail(
    userEmail,
    'Payment Successful - Welcome to CrediWork!',
    emailTemplates.PAYMENT_SUCCESS,
    {
      userName,
      amount: amount.toLocaleString(),
      packageName,
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
    }
  );
};

// Send payment failed email
export const sendPaymentFailedEmail = async (userEmail, userName, amount, reason) => {
  return await sendEmail(
    userEmail,
    'Payment Failed - CrediWork',
    emailTemplates.PAYMENT_FAILED,
    {
      userName,
      amount: amount.toLocaleString(),
      reason,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@crediwork.com'
    }
  );
};

// Send withdrawal submitted email
export const sendWithdrawalSubmittedEmail = async (userEmail, userName, amount, method) => {
  return await sendEmail(
    userEmail,
    'Withdrawal Request Submitted - CrediWork',
    emailTemplates.WITHDRAWAL_SUBMITTED,
    {
      userName,
      amount: amount.toLocaleString(),
      method: method === 'mpesa' ? 'M-Pesa' : 'Bank Transfer',
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    }
  );
};

// Send withdrawal approved email
export const sendWithdrawalApprovedEmail = async (userEmail, userName, amount, method, reference) => {
  return await sendEmail(
    userEmail,
    'Withdrawal Approved - CrediWork',
    emailTemplates.WITHDRAWAL_APPROVED,
    {
      userName,
      amount: amount.toLocaleString(),
      method: method === 'mpesa' ? 'M-Pesa' : 'Bank Transfer',
      reference,
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    }
  );
};

// Send withdrawal rejected email
export const sendWithdrawalRejectedEmail = async (userEmail, userName, amount, reason) => {
  return await sendEmail(
    userEmail,
    'Withdrawal Request Update - CrediWork',
    emailTemplates.WITHDRAWAL_REJECTED,
    {
      userName,
      amount: amount.toLocaleString(),
      reason,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@crediwork.com',
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    }
  );
};

// Send payment reminder email
export const sendPaymentReminderEmail = async (userEmail, userName, packageName, amount, daysPending) => {
  return await sendEmail(
    userEmail,
    'Complete Your Payment - CrediWork',
    emailTemplates.PAYMENT_REMINDER,
    {
      userName,
      packageName,
      amount: amount.toLocaleString(),
      daysPending,
      paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@crediwork.com'
    }
  );
};
