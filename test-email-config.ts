/**
 * Email Configuration Test Script
 * 
 * This script tests the Brevo SMTP configuration to send a test email.
 * Run with: npm run test:email
 */

import 'dotenv/config';
import { sendEmail } from './src/lib/email.js';

async function testEmailConfiguration() {
  console.log('🧪 Testing SMTP Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_SMTP_PASS: ${process.env.BREVO_SMTP_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL || 'Using default'}`);
  console.log(`BREVO_FROM_NAME: ${process.env.BREVO_FROM_NAME || 'Using default'}\n`);
  
  // Test email payload
  const testEmail = {
    to: 'philanishoun4@gmail.com',
    subject: '🧪 SMTP Email Test - Excellence Academia',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SMTP Email Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0EA5E9 0%, #4F46E5 100%); padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Excellence Academia</h1>
          <p style="color: white; margin: 10px 0 0; opacity: 0.9;">SMTP Email Configuration Test</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-top: 0;">✅ SMTP Email System Working!</h2>
          <p style="color: #334155; line-height: 1.6;">
            This test email was sent using SMTP configuration to verify that the Brevo SMTP setup is working correctly.
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0EA5E9;">
            <h3 style="margin-top: 0; color: #0f172a;">Test Details:</h3>
            <ul style="color: #334155;">
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              <li><strong>Method:</strong> SMTP Only</li>
              <li><strong>SMTP Server:</strong> ${process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com'}</li>
              <li><strong>SMTP Port:</strong> ${process.env.BREVO_SMTP_PORT || '587'}</li>
              <li><strong>From Email:</strong> ${process.env.BREVO_FROM_EMAIL || 'notifications@excellenceakademie.co.za'}</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; color: #64748b; font-size: 14px;">
          <p>This email was sent automatically by the Excellence Academia SMTP system.</p>
          <p>If you received this email, your SMTP configuration is working correctly! 🎉</p>
        </div>
      </body>
      </html>
    `
  };
  
  console.log('📧 Sending test email via SMTP...');
  console.log(`To: ${testEmail.to}`);
  console.log(`Subject: ${testEmail.subject}\n`);
  
  try {
    const result = await sendEmail(testEmail);
    
    if (result.success) {
      console.log('✅ SUCCESS: Email sent successfully!');
      console.log(`Method used: ${result.data.method || 'unknown'}`);
      if (result.data.messageId) {
        console.log(`Message ID: ${result.data.messageId}`);
      }
      if (result.data.mocked) {
        console.log('⚠️  Note: This was a mock email (development mode)');
        console.log('   Configure BREVO_SMTP_USER and BREVO_SMTP_PASS for actual sending');
      }
    } else {
      console.log('❌ FAILED: Email could not be sent');
      console.error('Error details:', result.error);
    }
  } catch (error) {
    console.log('❌ FAILED: Unexpected error occurred');
    console.error('Error:', error);
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test
testEmailConfiguration().catch(console.error);