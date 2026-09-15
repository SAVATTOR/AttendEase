/**
 * Email Service
 * Handles all email communications for the Attendance System
 * Supports multiple providers: Gmail, SMTP, SendGrid, AWS SES
 */

const nodemailer = require('nodemailer');
const env = require('../config/env');

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const EMAIL_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  rateLimit: {
    maxPerMinute: 30,
    maxPerHour: 500,
  },
  defaults: {
    fromName: env.EMAIL_FROM_NAME || 'Smart Attendance System',
    replyTo: env.EMAIL_REPLY_TO || env.EMAIL_USER,
  },
};

// Brand colors
const COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  success: '#10b981',
  successDark: '#059669',
  warning: '#f59e0b',
  warningDark: '#d97706',
  danger: '#ef4444',
  dangerDark: '#dc2626',
  info: '#3b82f6',
  infoDark: '#2563eb',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
  grayDark: '#374151',
  white: '#ffffff',
  black: '#1f2937',
};

// Gradient presets
const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
  success: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`,
  warning: `linear-gradient(135deg, ${COLORS.warning} 0%, ${COLORS.warningDark} 100%)`,
  danger: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
  info: `linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.infoDark} 100%)`,
};

// Rate limiting state
const rateLimitState = {
  minuteCount: 0,
  hourCount: 0,
  lastMinuteReset: Date.now(),
  lastHourReset: Date.now(),
};

// Cached transporter instance
let cachedTransporter = null;
let transporterVerified = false;

// ============================================
// TRANSPORTER MANAGEMENT
// ============================================

/**
 * Creates and caches the email transporter
 * @returns {nodemailer.Transporter}
 */
const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Validate required configuration
  if (!env.EMAIL_USER) {
    console.warn('⚠️ EMAIL_USER not configured - emails will be logged only');
    return null;
  }

  try {
    let transportConfig;

    // Gmail configuration
    if (env.EMAIL_SERVICE === 'gmail') {
      transportConfig = {
        service: 'gmail',
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      };
    }
    // SendGrid configuration
    else if (env.EMAIL_SERVICE === 'sendgrid') {
      transportConfig = {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: env.SENDGRID_API_KEY || env.EMAIL_PASSWORD,
        },
      };
    }
    // AWS SES configuration
    else if (env.EMAIL_SERVICE === 'ses') {
      transportConfig = {
        host: `email-smtp.${env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: env.AWS_SES_ACCESS_KEY || env.EMAIL_USER,
          pass: env.AWS_SES_SECRET_KEY || env.EMAIL_PASSWORD,
        },
      };
    }
    // Mailgun configuration
    else if (env.EMAIL_SERVICE === 'mailgun') {
      transportConfig = {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: env.MAILGUN_USER || env.EMAIL_USER,
          pass: env.MAILGUN_PASSWORD || env.EMAIL_PASSWORD,
        },
      };
    }
    // Generic SMTP configuration
    else {
      transportConfig = {
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(env.SMTP_PORT, 10) || 587,
        secure: env.SMTP_SECURE === 'true',
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      };
    }

    // Add common options
    transportConfig.pool = true; // Use pooled connections
    transportConfig.maxConnections = 5;
    transportConfig.maxMessages = 100;
    transportConfig.rateDelta = 1000;
    transportConfig.rateLimit = 10; // 10 messages per second max

    cachedTransporter = nodemailer.createTransport(transportConfig);

    // Set default from
    cachedTransporter.defaults = {
      from: `"${EMAIL_CONFIG.defaults.fromName}" <${env.EMAIL_USER}>`,
    };

    return cachedTransporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

/**
 * Verifies the email transporter connection
 * @returns {Promise<boolean>}
 */
const verifyTransporter = async () => {
  if (transporterVerified) return true;

  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    await transporter.verify();
    transporterVerified = true;
    console.log('✅ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    return false;
  }
};

/**
 * Closes the transporter connection pool
 */
const closeTransporter = () => {
  if (cachedTransporter) {
    cachedTransporter.close();
    cachedTransporter = null;
    transporterVerified = false;
    console.log('📧 Email transporter closed');
  }
};

// ============================================
// RATE LIMITING
// ============================================

/**
 * Checks and updates rate limiting
 * @returns {boolean} Whether the email can be sent
 */
const checkRateLimit = () => {
  const now = Date.now();

  // Reset minute counter
  if (now - rateLimitState.lastMinuteReset > 60000) {
    rateLimitState.minuteCount = 0;
    rateLimitState.lastMinuteReset = now;
  }

  // Reset hour counter
  if (now - rateLimitState.lastHourReset > 3600000) {
    rateLimitState.hourCount = 0;
    rateLimitState.lastHourReset = now;
  }

  // Check limits
  if (rateLimitState.minuteCount >= EMAIL_CONFIG.rateLimit.maxPerMinute) {
    console.warn('⚠️ Email rate limit reached (per minute)');
    return false;
  }

  if (rateLimitState.hourCount >= EMAIL_CONFIG.rateLimit.maxPerHour) {
    console.warn('⚠️ Email rate limit reached (per hour)');
    return false;
  }

  // Increment counters
  rateLimitState.minuteCount++;
  rateLimitState.hourCount++;

  return true;
};

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Creates the base HTML email template
 * @param {Object} options
 * @param {string} options.title - Email title
 * @param {string} options.preheader - Preview text (optional)
 * @param {string} options.headerGradient - Header gradient CSS
 * @param {string} options.headerIcon - Header icon/emoji (optional)
 * @param {string} options.content - Main HTML content
 * @param {string} options.buttonText - CTA button text (optional)
 * @param {string} options.buttonLink - CTA button URL (optional)
 * @param {string} options.buttonColor - CTA button color (optional)
 * @param {string} options.footerText - Custom footer text (optional)
 * @returns {string} Complete HTML email
 */
const createEmailTemplate = ({
  title,
  preheader = '',
  headerGradient = GRADIENTS.primary,
  headerIcon = '',
  content,
  buttonText,
  buttonLink,
  buttonColor = COLORS.primary,
  footerText,
}) => {
  const appName = EMAIL_CONFIG.defaults.fromName;
  const year = new Date().getFullYear();
  const appUrl = env.FRONTEND_URL || 'https://attendance-client-f4541.web.app';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    /* Client-specific resets */
    #outlook a { padding: 0; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    
    /* Button hover effect */
    @media screen {
      .button:hover { opacity: 0.9; transform: translateY(-1px); }
    }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content { padding: 20px !important; }
      .header { padding: 25px 20px !important; }
      .button { width: 100% !important; text-align: center !important; }
      .info-box { padding: 15px !important; }
      .code-box { padding: 20px !important; }
      .code-text { font-size: 28px !important; letter-spacing: 4px !important; }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1a1a2e !important; }
      .dark-mode-text { color: #e5e5e5 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <!-- Preheader text (hidden but shown in email preview) -->
  ${preheader ? `
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
    ${'&nbsp;&zwnj;'.repeat(30)}
  </div>
  ` : ''}
  
  <!-- Email wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td class="header" style="background: ${headerGradient}; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              ${headerIcon ? `<div style="font-size: 40px; margin-bottom: 10px;">${headerIcon}</div>` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="background: #ffffff; padding: 35px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              
              <!-- Main content -->
              <div style="color: #374151; font-size: 16px; line-height: 1.7;">
                ${content}
              </div>
              
              <!-- CTA Button -->
              ${buttonText && buttonLink ? `
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${buttonLink}" class="button" target="_blank" style="display: inline-block; background: ${buttonColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 35px 0 25px 0;">
              
              <!-- Footer -->
              <div style="text-align: center;">
                <p style="color: #9ca3af; font-size: 13px; margin: 0 0 10px 0;">
                  ${footerText || 'This is an automated message. Please do not reply directly to this email.'}
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  &copy; ${year} ${appName}. All rights reserved.
                </p>
                <p style="margin: 15px 0 0 0;">
                  <a href="${appUrl}" style="color: ${COLORS.primary}; text-decoration: none; font-size: 13px;">Visit Dashboard</a>
                </p>
              </div>
              
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
};

/**
 * Creates an info box HTML component
 */
const createInfoBox = (items, borderColor = COLORS.primary) => {
  const itemsHtml = items
    .map(
      ({ label, value }) => `
    <tr>
      <td style="padding: 6px 0;">
        <strong style="color: #374151;">${label}:</strong>
        <span style="color: #6b7280; margin-left: 8px;">${value}</span>
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="info-box" style="background: #f9fafb; border-left: 4px solid ${borderColor}; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${itemsHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Creates a verification code box
 */
const createCodeBox = (code, borderColor = COLORS.primary) => {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="code-box" style="background: #f9fafb; border: 2px dashed ${borderColor}; border-radius: 12px; margin: 25px 0;">
      <tr>
        <td align="center" style="padding: 30px;">
          <span class="code-text" style="color: ${borderColor}; font-size: 38px; font-weight: 700; letter-spacing: 10px; font-family: 'Courier New', monospace;">
            ${code}
          </span>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Creates plain text version of email
 */
const createPlainText = (sections) => {
  return sections
    .map((section) => {
      if (typeof section === 'string') return section;
      if (section.heading) return `\n${section.heading.toUpperCase()}\n${'='.repeat(section.heading.length)}`;
      if (section.items) {
        return section.items.map(({ label, value }) => `${label}: ${value}`).join('\n');
      }
      return '';
    })
    .join('\n\n')
    .trim();
};

// ============================================
// EMAIL SENDING CORE
// ============================================

/**
 * Sends an email with retry logic
 * @param {Object} mailOptions - Nodemailer mail options
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>}
 */
const sendEmailWithRetry = async (mailOptions, attempt = 1) => {
  const transporter = getTransporter();

  // If no transporter (not configured), log and return mock success
  if (!transporter) {
    console.log('📧 [DEV MODE] Email would be sent to:', mailOptions.to);
    console.log('   Subject:', mailOptions.subject);
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
      mode: 'development',
    };
  }

  // Check rate limiting
  if (!checkRateLimit()) {
    throw new Error('Email rate limit exceeded. Please try again later.');
  }

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log(`✉️ Email sent successfully to ${mailOptions.to}`);
    console.log(`   MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error(`❌ Email send attempt ${attempt} failed:`, error.message);

    // Retry logic
    if (attempt < EMAIL_CONFIG.maxRetries) {
      const delay = EMAIL_CONFIG.retryDelay * attempt;
      console.log(`   Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendEmailWithRetry(mailOptions, attempt + 1);
    }

    throw new Error(`Failed to send email after ${EMAIL_CONFIG.maxRetries} attempts: ${error.message}`);
  }
};

// ============================================
// EMAIL TYPES
// ============================================

/**
 * Sends email verification code
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} verificationCode - 6-digit code
 * @returns {Promise<Object>}
 */
const sendVerificationEmail = async (email, name, verificationCode) => {
  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      Thank you for registering with the Smart Attendance System. To complete your registration, 
      please enter the verification code below:
    </p>
    ${createCodeBox(verificationCode)}
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      ⏰ This code will expire in <strong>10 minutes</strong>.
    </p>
    <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  const mailOptions = {
    to: email,
    subject: '🔐 Verify Your Email Address',
    html: createEmailTemplate({
      title: 'Email Verification',
      preheader: `Your verification code is: ${verificationCode}`,
      headerGradient: GRADIENTS.primary,
      headerIcon: '🔐',
      content,
    }),
    text: createPlainText([
      `Hello ${name},`,
      'Thank you for registering with the Smart Attendance System.',
      { heading: 'Your Verification Code' },
      verificationCode,
      'This code will expire in 10 minutes.',
      "If you didn't create an account, please ignore this email.",
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetCode - Reset code or token
 * @param {string} resetLink - Password reset URL
 * @returns {Promise<Object>}
 */
const sendPasswordResetEmail = async (email, name, resetCode, resetLink) => {
  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      We received a request to reset your password. Use the code below or click the button to reset it:
    </p>
    ${createCodeBox(resetCode, COLORS.warning)}
    <p style="margin: 20px 0; color: #6b7280; font-size: 14px;">
      ⏰ This link will expire in <strong>1 hour</strong>.
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      If you didn't request a password reset, please ignore this email or contact support if you're concerned.
    </p>
  `;

  const mailOptions = {
    to: email,
    subject: '🔑 Reset Your Password',
    html: createEmailTemplate({
      title: 'Password Reset',
      preheader: 'Reset your password to regain access to your account',
      headerGradient: GRADIENTS.warning,
      headerIcon: '🔑',
      content,
      // Remove button since we're using code-based reset only
      buttonText: null,
      buttonLink: null,
      buttonColor: COLORS.warning,
    }),
    text: createPlainText([
      `Hello ${name},`,
      'We received a request to reset your password.',
      { heading: 'Reset Code' },
      resetCode,
      `Reset Link: ${resetLink}`,
      'This link will expire in 1 hour.',
      "If you didn't request this, please ignore this email.",
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends welcome email after successful registration
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} role - User role (STUDENT/TEACHER)
 * @returns {Promise<Object>}
 */
const sendWelcomeEmail = async (email, name, role) => {
  const appUrl = env.FRONTEND_URL || 'https://attendance-client-f4541.web.app';
  const isTeacher = role === 'TEACHER';

  const roleSpecificContent = isTeacher
    ? `
      <p>As a lecturer, you can:</p>
      <ul style="color: #6b7280; margin: 10px 0 20px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Create and manage your classes</li>
        <li style="margin-bottom: 8px;">Start attendance sessions with rotating QR codes</li>
        <li style="margin-bottom: 8px;">Track student attendance in real-time</li>
        <li style="margin-bottom: 8px;">Export attendance reports</li>
      </ul>
    `
    : `
      <p>As a student, you can:</p>
      <ul style="color: #6b7280; margin: 10px 0 20px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Join classes using class codes</li>
        <li style="margin-bottom: 8px;">Mark attendance by scanning QR codes</li>
        <li style="margin-bottom: 8px;">View your attendance history</li>
        <li style="margin-bottom: 8px;">Track your attendance statistics</li>
      </ul>
    `;

  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      Welcome to the Smart Attendance System! 🎉 Your account has been successfully created.
    </p>
    ${createInfoBox(
    [
      { label: 'Account Type', value: isTeacher ? '👨‍🏫 Lecturer' : '👨‍🎓 Student' },
      { label: 'Email', value: email },
    ],
    COLORS.success
  )}
    ${roleSpecificContent}
    <p style="margin: 0; color: #6b7280;">
      Get started by visiting your dashboard.
    </p>
  `;

  const mailOptions = {
    to: email,
    subject: '🎉 Welcome to Smart Attendance System!',
    html: createEmailTemplate({
      title: 'Welcome Aboard!',
      preheader: 'Your account has been created successfully',
      headerGradient: GRADIENTS.success,
      headerIcon: '🎉',
      content,
      buttonText: 'Go to Dashboard',
      buttonLink: `${appUrl}/${isTeacher ? 'lecturer' : 'student'}`,
      buttonColor: COLORS.success,
    }),
    text: createPlainText([
      `Hello ${name},`,
      'Welcome to the Smart Attendance System! Your account has been created.',
      { heading: 'Account Details' },
      { items: [{ label: 'Account Type', value: isTeacher ? 'Lecturer' : 'Student' }] },
      `Dashboard: ${appUrl}/${isTeacher ? 'teacher' : 'student'}`,
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends enrollment request notification to lecturer
 * @param {string} teacherEmail
 * @param {string} teacherName
 * @param {string} studentName
 * @param {string} studentEmail
 * @param {string} studentIndexNumber
 * @param {string} className
 * @param {string} classId
 * @returns {Promise<Object>}
 */
const sendEnrollmentRequestEmail = async (
  teacherEmail,
  teacherName,
  studentName,
  studentEmail,
  studentIndexNumber,
  className,
  classId
) => {
  const appUrl = env.FRONTEND_URL || 'https://attendance-client-f4541.web.app';

  const emailDisplay = studentIndexNumber 
    ? `${studentEmail} (Index: ${studentIndexNumber})`
    : studentEmail;

  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${teacherName}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      A new student has requested to join your class:
    </p>
    ${createInfoBox(
    [
      { label: 'Student', value: studentName },
      { label: 'Email', value: emailDisplay },
      { label: 'Class', value: className },
    ],
    COLORS.info
  )}
    <p style="margin: 0; color: #6b7280;">
      Please log in to your dashboard to approve or reject this request.
    </p>
  `;

  const mailOptions = {
    to: teacherEmail,
    subject: `📋 New Enrollment Request: ${studentName} → ${className}`,
    html: createEmailTemplate({
      title: 'New Enrollment Request',
      preheader: `${studentName} wants to join ${className}`,
      headerGradient: GRADIENTS.info,
      headerIcon: '📋',
      content,
      buttonText: 'Review Request',
      buttonLink: `${appUrl}/lecturer/attendance?classId=${classId}`,
      buttonColor: COLORS.info,
    }),
    text: createPlainText([
      `Hello ${teacherName},`,
      'A new student has requested to join your class.',
      { heading: 'Request Details' },
      {
        items: [
          { label: 'Student', value: studentName },
          { label: 'Email', value: studentIndexNumber ? `${studentEmail} (Index: ${studentIndexNumber})` : studentEmail },
          { label: 'Class', value: className },
        ],
      },
      'Please log in to your dashboard to approve or reject this request.',
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends enrollment status update to student
 * @param {string} studentEmail
 * @param {string} studentName
 * @param {string} className
 * @param {string} classCode
 * @param {'APPROVED' | 'REJECTED'} status
 * @returns {Promise<Object>}
 */
const sendEnrollmentStatusEmail = async (studentEmail, studentName, className, classCode, status) => {
  const appUrl = env.FRONTEND_URL || 'https://attendance-client-f4541.web.app';
  const isApproved = status === 'APPROVED';

  const statusConfig = {
    APPROVED: {
      gradient: GRADIENTS.success,
      color: COLORS.success,
      icon: '✅',
      title: 'Enrollment Approved',
      action: 'You can now access the class and mark your attendance.',
    },
    REJECTED: {
      gradient: GRADIENTS.danger,
      color: COLORS.danger,
      icon: '❌',
      title: 'Enrollment Rejected',
      action: 'If you believe this is an error, please contact your lecturer.',
    },
  };

  const config = statusConfig[status] || statusConfig.REJECTED;

  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${studentName}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      Your enrollment request has been <strong style="color: ${config.color};">${status.toLowerCase()}</strong>:
    </p>
    ${createInfoBox(
    [
      { label: 'Class', value: className },
      { label: 'Class Code', value: classCode },
      { label: 'Status', value: `${config.icon} ${status}` },
    ],
    config.color
  )}
    <p style="margin: 0; color: #6b7280;">
      ${config.action}
    </p>
  `;

  const mailOptions = {
    to: studentEmail,
    subject: `${config.icon} Enrollment ${status}: ${className}`,
    html: createEmailTemplate({
      title: config.title,
      preheader: `Your enrollment request for ${className} has been ${status.toLowerCase()}`,
      headerGradient: config.gradient,
      headerIcon: config.icon,
      content,
      buttonText: isApproved ? 'View My Classes' : undefined,
      buttonLink: isApproved ? `${appUrl}/student` : undefined,
      buttonColor: config.color,
    }),
    text: createPlainText([
      `Hello ${studentName},`,
      `Your enrollment request has been ${status.toLowerCase()}.`,
      { heading: 'Details' },
      {
        items: [
          { label: 'Class', value: className },
          { label: 'Class Code', value: classCode },
          { label: 'Status', value: status },
        ],
      },
      config.action,
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends notification when student is removed from class
 * @param {string} studentEmail
 * @param {string} studentName
 * @param {string} className
 * @param {string} teacherName
 * @returns {Promise<Object>}
 */
const sendStudentRemovedEmail = async (studentEmail, studentName, className, teacherName = 'your lecturer') => {
  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${studentName}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      You have been removed from the following class:
    </p>
    ${createInfoBox(
    [
      { label: 'Class', value: className },
      { label: 'Removed By', value: teacherName },
    ],
    COLORS.danger
  )}
    <p style="margin: 0; color: #6b7280;">
      You will no longer be able to access this class or mark attendance for it.
    </p>
    <p style="margin: 15px 0 0 0; color: #6b7280;">
      If you believe this is an error, please contact your lecturer.
    </p>
  `;

  const mailOptions = {
    to: studentEmail,
    subject: `🚫 Removed from Class: ${className}`,
    html: createEmailTemplate({
      title: 'Removed from Class',
      preheader: `You have been removed from ${className}`,
      headerGradient: GRADIENTS.danger,
      headerIcon: '🚫',
      content,
    }),
    text: createPlainText([
      `Hello ${studentName},`,
      'You have been removed from the following class.',
      { heading: 'Details' },
      {
        items: [
          { label: 'Class', value: className },
          { label: 'Removed By', value: teacherName },
        ],
      },
      'If you believe this is an error, please contact your lecturer.',
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends notification when attendance session starts
 * @param {string} studentEmail
 * @param {string} studentName
 * @param {string} className
 * @param {string} teacherName
 * @param {number} durationMinutes
 * @returns {Promise<Object>}
 */
const sendSessionStartedEmail = async (
  studentEmail,
  studentName,
  className,
  teacherName,
  durationMinutes = 60
) => {
  const appUrl = env.FRONTEND_URL || 'https://attendance-client-f4541.web.app';

  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${studentName}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      An attendance session has started for your class! 📱
    </p>
    ${createInfoBox(
    [
      { label: 'Class', value: className },
      { label: 'Lecturer', value: teacherName },
      { label: 'Duration', value: `${durationMinutes} minutes` },
    ],
    COLORS.success
  )}
    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ⚠️ <strong>Important:</strong> Make sure you're physically present in the classroom 
        and within the allowed location range before scanning the QR code.
      </p>
    </div>
    <p style="margin: 0; color: #6b7280;">
      Open the app and scan the QR code displayed by your lecturer to mark your attendance.
    </p>
  `;

  const mailOptions = {
    to: studentEmail,
    subject: `🔴 LIVE: ${className} - Attendance Session Started`,
    html: createEmailTemplate({
      title: 'Class is Live! 🎉',
      preheader: `${className} attendance session has started - Mark your attendance now!`,
      headerGradient: GRADIENTS.success,
      headerIcon: '🔴',
      content,
      buttonText: 'Mark Attendance Now',
      buttonLink: `${appUrl}/student`,
      buttonColor: COLORS.success,
    }),
    text: createPlainText([
      `Hello ${studentName},`,
      'An attendance session has started for your class!',
      { heading: 'Session Details' },
      {
        items: [
          { label: 'Class', value: className },
          { label: 'Lecturer', value: teacherName },
          { label: 'Duration', value: `${durationMinutes} minutes` },
        ],
      },
      'Open the app and scan the QR code to mark your attendance.',
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends attendance confirmation to student
 * @param {string} studentEmail
 * @param {string} studentName
 * @param {string} className
 * @param {'PRESENT' | 'LATE' | 'INVALID_LOCATION'} status
 * @param {Date} markedAt
 * @param {number} distance
 * @returns {Promise<Object>}
 */
const sendAttendanceConfirmationEmail = async (
  studentEmail,
  studentName,
  className,
  status,
  markedAt,
  distance
) => {
  const statusConfig = {
    PRESENT: {
      icon: '✅',
      color: COLORS.success,
      gradient: GRADIENTS.success,
      title: 'Attendance Marked: Present',
      message: 'Great job! Your attendance has been recorded.',
    },
    LATE: {
      icon: '⏰',
      color: COLORS.warning,
      gradient: GRADIENTS.warning,
      title: 'Attendance Marked: Late',
      message: 'Your attendance has been recorded as late.',
    },
    INVALID_LOCATION: {
      icon: '📍',
      color: COLORS.danger,
      gradient: GRADIENTS.danger,
      title: 'Attendance Issue: Invalid Location',
      message: 'Your attendance was recorded but your location was outside the allowed range.',
    },
  };

  const config = statusConfig[status] || statusConfig.PRESENT;
  const formattedTime = new Date(markedAt).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${studentName}</strong>,</p>
    <p style="margin: 0 0 20px 0;">
      ${config.message}
    </p>
    ${createInfoBox(
    [
      { label: 'Class', value: className },
      { label: 'Status', value: `${config.icon} ${status.replace('_', ' ')}` },
      { label: 'Time', value: formattedTime },
      { label: 'Distance', value: `${distance.toFixed(1)} meters from lecturer` },
    ],
    config.color
  )}
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      This is a confirmation of your attendance record.
    </p>
  `;

  const mailOptions = {
    to: studentEmail,
    subject: `${config.icon} ${config.title} - ${className}`,
    html: createEmailTemplate({
      title: config.title,
      preheader: `Your attendance for ${className} has been recorded`,
      headerGradient: config.gradient,
      headerIcon: config.icon,
      content,
    }),
    text: createPlainText([
      `Hello ${studentName},`,
      config.message,
      { heading: 'Attendance Details' },
      {
        items: [
          { label: 'Class', value: className },
          { label: 'Status', value: status },
          { label: 'Time', value: formattedTime },
          { label: 'Distance', value: `${distance.toFixed(1)}m` },
        ],
      },
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

/**
 * Sends weekly attendance summary
 * @param {string} email
 * @param {string} name
 * @param {string} role
 * @param {Object} summary
 * @returns {Promise<Object>}
 */
const sendWeeklySummaryEmail = async (email, name, role, summary) => {
  const appUrl = env.FRONTEND_URL || 'https://attendance-client-f4541.web.app';
  const isTeacher = role === 'TEACHER';

  const weekRange = `${summary.startDate} - ${summary.endDate}`;

  let statsHtml;
  if (isTeacher) {
    statsHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; width: 33%;">
            <div style="font-size: 32px; font-weight: 700; color: ${COLORS.success};">${summary.totalSessions || 0}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Sessions</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="text-align: center; padding: 15px; background: #eff6ff; border-radius: 8px; width: 33%;">
            <div style="font-size: 32px; font-weight: 700; color: ${COLORS.info};">${summary.totalAttendances || 0}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Attendances</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="text-align: center; padding: 15px; background: #fef3c7; border-radius: 8px; width: 33%;">
            <div style="font-size: 32px; font-weight: 700; color: ${COLORS.warning};">${summary.avgAttendanceRate || 0}%</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Avg Rate</div>
          </td>
        </tr>
      </table>
    `;
  } else {
    statsHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; width: 25%;">
            <div style="font-size: 28px; font-weight: 700; color: ${COLORS.success};">${summary.present || 0}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">Present</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="text-align: center; padding: 15px; background: #fef3c7; border-radius: 8px; width: 25%;">
            <div style="font-size: 28px; font-weight: 700; color: ${COLORS.warning};">${summary.late || 0}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">Late</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px; width: 25%;">
            <div style="font-size: 28px; font-weight: 700; color: ${COLORS.danger};">${summary.absent || 0}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">Absent</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="text-align: center; padding: 15px; background: #eff6ff; border-radius: 8px; width: 25%;">
            <div style="font-size: 28px; font-weight: 700; color: ${COLORS.info};">${summary.attendanceRate || 0}%</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 5px;">Rate</div>
          </td>
        </tr>
      </table>
    `;
  }

  const content = `
    <p style="margin: 0 0 20px 0;">Hello <strong>${name}</strong>,</p>
    <p style="margin: 0 0 10px 0;">
      Here's your weekly attendance summary for:
    </p>
    <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: ${COLORS.primary};">
      📅 ${weekRange}
    </p>
    ${statsHtml}
    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
      View your detailed ${isTeacher ? 'reports' : 'history'} in the dashboard.
    </p>
  `;

  const mailOptions = {
    to: email,
    subject: `📊 Weekly Attendance Summary: ${weekRange}`,
    html: createEmailTemplate({
      title: 'Weekly Summary',
      preheader: `Your attendance summary for ${weekRange}`,
      headerGradient: GRADIENTS.primary,
      headerIcon: '📊',
      content,
      buttonText: 'View Full Report',
      buttonLink: `${appUrl}/${isTeacher ? 'lecturer' : 'student'}/attendance`,
      buttonColor: COLORS.primary,
    }),
    text: createPlainText([
      `Hello ${name},`,
      `Here's your weekly attendance summary for ${weekRange}.`,
      { heading: 'Statistics' },
      isTeacher
        ? {
          items: [
            { label: 'Total Sessions', value: summary.totalSessions || 0 },
            { label: 'Total Attendances', value: summary.totalAttendances || 0 },
            { label: 'Average Rate', value: `${summary.avgAttendanceRate || 0}%` },
          ],
        }
        : {
          items: [
            { label: 'Present', value: summary.present || 0 },
            { label: 'Late', value: summary.late || 0 },
            { label: 'Absent', value: summary.absent || 0 },
            { label: 'Rate', value: `${summary.attendanceRate || 0}%` },
          ],
        },
    ]),
  };

  return sendEmailWithRetry(mailOptions);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Checks if user has email notifications enabled
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
const shouldSendEmail = async (userId) => {
  try {
    const { prisma } = require('../config/database');
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { emailNotifications: true },
    });
    return settings?.emailNotifications !== false;
  } catch (error) {
    console.error('Error checking email preferences:', error.message);
    return true; // Default to sending
  }
};

/**
 * Sends bulk emails with rate limiting
 * @param {Array<{to: string, subject: string, html: string, text: string}>} emails
 * @returns {Promise<{sent: number, failed: number, errors: Array}>}
 */
const sendBulkEmails = async (emails) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const mailOptions of emails) {
    try {
      await sendEmailWithRetry(mailOptions);
      results.sent++;
      // Small delay between emails
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      results.errors.push({
        to: mailOptions.to,
        error: error.message,
      });
    }
  }

  console.log(`📧 Bulk email complete: ${results.sent} sent, ${results.failed} failed`);
  return results;
};

/**
 * Sends a test email to verify configuration
 * @param {string} testEmail
 * @returns {Promise<Object>}
 */
const sendTestEmail = async (testEmail) => {
  const content = `
    <p style="margin: 0 0 20px 0;">Hello,</p>
    <p style="margin: 0 0 20px 0;">
      This is a test email from the Smart Attendance System. 
      If you received this, your email configuration is working correctly! 🎉
    </p>
    ${createInfoBox(
    [
      { label: 'Server Time', value: new Date().toISOString() },
      { label: 'Email Service', value: env.EMAIL_SERVICE || 'SMTP' },
      { label: 'Environment', value: env.NODE_ENV || 'development' },
    ],
    COLORS.success
  )}
  `;

  const mailOptions = {
    to: testEmail,
    subject: '✅ Test Email - Smart Attendance System',
    html: createEmailTemplate({
      title: 'Email Test Successful',
      preheader: 'Your email configuration is working correctly',
      headerGradient: GRADIENTS.success,
      headerIcon: '✅',
      content,
    }),
    text: `Test email from Smart Attendance System. Server time: ${new Date().toISOString()}`,
  };

  return sendEmailWithRetry(mailOptions);
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Email types
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEnrollmentRequestEmail,
  sendEnrollmentStatusEmail,
  sendStudentRemovedEmail,
  sendSessionStartedEmail,
  sendAttendanceConfirmationEmail,
  sendWeeklySummaryEmail,

  // Utilities
  shouldSendEmail,
  sendBulkEmails,
  sendTestEmail,
  verifyTransporter,
  closeTransporter,

  // Template helpers (for custom emails)
  createEmailTemplate,
  createInfoBox,
  createCodeBox,

  // Constants
  COLORS,
  GRADIENTS,
};