const { verifyTransporter, sendTestEmail } = require('../src/services/emailService');
const env = require('../src/config/env');

async function checkEmail() {
  console.log('--- Email Functionality Check ---');
  console.log('EMAIL_SERVICE:', env.EMAIL_SERVICE);
  console.log('EMAIL_USER:', env.EMAIL_USER ? 'Set' : 'Not Set');
  console.log('EMAIL_PASSWORD:', env.EMAIL_PASSWORD ? 'Set' : 'Not Set');
  
  if (!env.EMAIL_USER) {
    console.log('\n❌ EMAIL_USER is not set. Email service will run in DEV MODE (logging only).');
    process.exit(0);
  }

  console.log('\n1. Verifying Transporter...');
  const isVerified = await verifyTransporter();
  
  if (isVerified) {
    console.log('✅ Transporter verified successfully!');
    
    // Optional: Send a test email if a recipient is provided
    const testRecipient = process.argv[2];
    if (testRecipient) {
      console.log(`\n2. Sending test email to ${testRecipient}...`);
      try {
        const result = await sendTestEmail(testRecipient);
        console.log('✅ Test email sent result:', result);
      } catch (error) {
        console.error('❌ Failed to send test email:', error.message);
      }
    } else {
      console.log('\n💡 Tip: Run "node scripts/check-email.js <email>" to send a real test email.');
    }
  } else {
    console.log('❌ Transporter verification failed. Check your credentials and SMTP settings.');
  }
}

checkEmail().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
