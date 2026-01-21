/**
 * Brevo API Email Test
 */

import 'dotenv/config';
import { sendEmail } from './src/lib/email.js';

async function testBrevoAPI() {
  console.log('🧪 Testing Brevo API Email Sending...\n');
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`BREVO_API_KEY: ${process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL || 'Using default'}`);
  console.log(`BREVO_FROM_NAME: ${process.env.BREVO_FROM_NAME || 'Using default'}\n`);
  
  // Test email payload
  const testEmail = {
    to: 'philanishoun4@gmail.com',
    subject: '🧪 Brevo API Test - Excellence Academia',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Brevo API Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0EA5E9 0%, #4F46E5 100%); padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Excellence Academia</h1>
          <p style="color: white; margin: 10px 0 0; opacity: 0.9;">Brevo API Email Test</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-top: 0;">✅ Email System Working!</h2>
          <p style="color: #334155; line-height: 1.6;">
            Hello Philani! This test email was sent using the Brevo API to verify that your email configuration is working correctly.
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0EA5E9;">
            <h3 style="margin-top: 0; color: #0f172a;">Test Details:</h3>
            <ul style="color: #334155;">
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              <li><strong>Method:</strong> Brevo API</li>
              <li><strong>From Email:</strong> ${process.env.BREVO_FROM_EMAIL || 'notifications@excellenceakademie.co.za'}</li>
              <li><strong>Duplicate Prevention:</strong> ✅ Enabled</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin-top: 0;">🎉 Success!</h3>
          <p style="color: #047857; margin: 0;">
            Your Excellence Academia email system is now configured and working properly. 
            You can now send tutor and student credential emails through the admin dashboard.
          </p>
        </div>
        
        <div style="text-align: center; color: #64748b; font-size: 14px;">
          <p>This email was sent automatically by the Excellence Academia system.</p>
          <p>Email system features: Duplicate prevention, SMTP fallback, Professional templates</p>
        </div>
      </body>
      </html>
    `
  };
  
  console.log('📧 Sending test email via Brevo API...');
  console.log(`To: ${testEmail.to}`);
  console.log(`Subject: ${testEmail.subject}\n`);
  
  try {
    const result = await sendEmail(testEmail);
    
    if (result.success) {
      console.log('✅ SUCCESS: Email sent successfully!');
      console.log(`Method used: ${result.data.method || 'api'}`);
      if (result.data.messageId) {
        console.log(`Message ID: ${result.data.messageId}`);
      }
      console.log('\n🎉 Check your email inbox at philanishoun4@gmail.com');
    } else {
      console.log('❌ FAILED: Email could not be sent');
      if (result.duplicate) {
        console.log('Reason: Duplicate email prevented');
      } else {
        console.error('Error details:', result.error);
      }
    }
  } catch (error) {
    console.log('❌ FAILED: Unexpected error occurred');
    console.error('Error:', error);
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test
testBrevoAPI().catch(console.error);