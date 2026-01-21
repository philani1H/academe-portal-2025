/**
 * Tutor Template Email Test - SMTP Only
 */

import 'dotenv/config';
import { sendEmail, renderTutorCredentialsEmail } from './src/lib/email.js';

async function testTutorTemplate() {
  console.log('🧪 Testing Tutor Credentials Email Template (SMTP Only)...\n');
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`EMAIL_METHOD: ${process.env.EMAIL_METHOD || 'auto'}`);
  console.log(`BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_SMTP_PASS: ${process.env.BREVO_SMTP_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL || 'Using default'}`);
  console.log(`BREVO_FROM_NAME: ${process.env.BREVO_FROM_NAME || 'Using default'}\n`);
  
  // Sample tutor data (like what would come from the database)
  const sampleTutorData = {
    recipientName: 'Philani Chade',
    tutorEmail: 'philani.tutor@excellenceakademie.co.za',
    personalEmail: 'philanishoun4@gmail.com',
    tempPassword: 'philani.chade@EA25!',
    loginUrl: 'https://www.excellenceakademie.co.za/tutor-login',
    department: 'Mathematics & Sciences',
    allDepartments: 'Mathematics, Physics, Computer Science',
    courses: 'Advanced Mathematics, Physics Grade 12, Computer Science Fundamentals',
    courseCount: 3,
    additionalMessage: 'Welcome to Excellence Academia! This is a test of the tutor credential email system using SMTP only mode.'
  };
  
  console.log('📧 Generating tutor credentials email...');
  console.log(`Sample Tutor: ${sampleTutorData.recipientName}`);
  console.log(`Courses: ${sampleTutorData.courses}`);
  console.log(`Department: ${sampleTutorData.department}\n`);
  
  // Generate the email content using the tutor template
  const emailContent = renderTutorCredentialsEmail(sampleTutorData);
  
  // Create the email payload
  const testEmail = {
    to: 'philanishoun4@gmail.com',
    subject: '🧪 Test: Your Tutor Account Credentials - Excellence Academia',
    content: emailContent
  };
  
  console.log('📧 Sending tutor credentials email via SMTP...');
  console.log(`To: ${testEmail.to}`);
  console.log(`Subject: ${testEmail.subject}\n`);
  
  try {
    const result = await sendEmail(testEmail);
    
    if (result.success) {
      console.log('✅ SUCCESS: Tutor credentials email sent successfully!');
      console.log(`Method used: ${result.data.method || 'unknown'}`);
      if (result.data.messageId) {
        console.log(`Message ID: ${result.data.messageId}`);
      }
      if (result.data.mocked) {
        console.log('⚠️  Note: This was a mock email (development mode)');
        console.log('   SMTP credentials may not be properly configured');
      } else {
        console.log('\n🎉 Check your email inbox at philanishoun4@gmail.com');
        console.log('📧 You should see a professional tutor credentials email with:');
        console.log('   • Login credentials and password');
        console.log('   • Course assignments and departments');
        console.log('   • Professional branding and styling');
        console.log('   • Login button and instructions');
      }
    } else {
      console.log('❌ FAILED: Email could not be sent');
      if (result.duplicate) {
        console.log('Reason: Duplicate email prevented (try again in 1 minute)');
      } else {
        console.error('Error details:', result.error);
      }
    }
  } catch (error) {
    console.log('❌ FAILED: Unexpected error occurred');
    console.error('Error:', error);
  }
  
  console.log('\n🏁 Tutor template test completed');
}

// Run the test
testTutorTemplate().catch(console.error);