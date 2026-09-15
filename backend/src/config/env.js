const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  
  DATABASE_URL: process.env.DATABASE_URL,
  
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Support both LOGIN_COOLDOWN_MINUTES and LOGIN__COOLDOWN_MINUTES (double underscore)
  LOGIN_COOLDOWN_MINUTES: parseInt(process.env.LOGIN__COOLDOWN_MINUTES || process.env.LOGIN_COOLDOWN_MINUTES, 10) || 20,
  
  QR_REFRESH_INTERVAL_SECONDS: parseInt(process.env.QR_REFRESH_INTERVAL_SECONDS, 10) || 10,
  QR_SESSION_DURATION_MINUTES: parseInt(process.env.QR_SESSION_DURATION_MINUTES, 10) || 60,
  
  DEFAULT_ALLOWED_RADIUS_METERS: parseInt(process.env.DEFAULT_ALLOWED_RADIUS_METERS, 10) || 50,
  // Email Configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Smart Attendance System',
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || '',
  
  // SMTP Configuration
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE || 'false',
  
  // SendGrid Configuration
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  
  // AWS SES Configuration
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_SES_ACCESS_KEY: process.env.AWS_SES_ACCESS_KEY || '',
  AWS_SES_SECRET_KEY: process.env.AWS_SES_SECRET_KEY || '',
  
  // Mailgun Configuration
  MAILGUN_USER: process.env.MAILGUN_USER || '',
  MAILGUN_PASSWORD: process.env.MAILGUN_PASSWORD || '',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173',
};

// Validation
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Warning: ${envVar} is not set in environment variables`);
  }
}

module.exports = env;