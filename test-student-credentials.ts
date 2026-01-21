/**
 * Student Credentials Email Test
 */

import 'dotenv/config';
import { sendEmail, renderStudentCredentialsEmail } from './src/lib/email.ts';

async function testStudentCredentials() {
  console.log('🧪 Testing Student Credentials Email Template...\n');
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`EMAIL_METHOD: ${process.env.EMAIL_METHOD || 'auto'}`);
  console.log(`BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_SMTP_PASS: ${process.env.BREVO_SMTP_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL || 'Using default'}`);
  console.log(`BREVO_FROM_NAME: ${process.env.BREVO_FROM_NAME || 'Using default'}\n`);
  
  // Sample student data
  const sampleStudentData = {
    recipientName: 'Philani Chade',
    studentNumber: 'STU2025001',
    studentEmail: 'philani.student@excellenceakademie.co.za',
    personalEmail: 'philanishoun4@gmail.com',
    tempPassword: 'philani.chade@EA25!',
    loginUrl: 'https://www.excellenceakademie.co.za/student-login',
    department: 'Mathematics & Sciences',
    allDepartments: 'Mathematics, Physics, Computer Science, Life Sciences',
    courses: 'Advanced Mathematics Grade 12, Physics Grade 12, Computer Science Fundamentals, Life Sciences Grade 12',
    courseCount: 4,
    additionalMessage: 'Welcome to Excellence Academia! This is a test of the improved student credential email system with the new footer design.'
  };
  
  console.log('📧 Generating student credentials email...');
  console.log(`Student: ${sampleStudentData.recipientName}`);
  console.log(`Student Number: ${sampleStudentData.studentNumber}`);
  console.log(`Courses: ${sampleStudentData.courseCount} enrolled`);
  console.log(`Department: ${sampleStudentData.department}\n`);
  
  // Generate the email content using the student template
  const emailContent = renderStudentCredentialsEmail(sampleStudentData);
  
  // Create the email payload
  const testEmail = {
    to: 'philanishoun4@gmail.com',
    subject: '🎓 TEST: Your Student Account Credentials - Excellence Academia',
    content: emailContent
  };
  
  console.log('📧 Sending student credentials email...');
  console.log(`To: ${testEmail.to}`);
  console.log(`Subject: ${testEmail.subject}\n`);
  
  try {
    const result = await sendEmail(testEmail);
    
    if (result.success) {
      console.log('✅ SUCCESS: Student credentials email sent successfully!');
      console.log(`Method used: ${result.data.method || 'unknown'}`);
      if (result.data.messageId) {
        console.log(`Message ID: ${result.data.messageId}`);
      }
      if (result.data.mocked) {
        console.log('⚠️  Note: This was a mock email (development mode)');
        console.log('   SMTP credentials may not be properly configured');
      } else {
        console.log('\n🎉 Check your email inbox at philanishoun4@gmail.com');
        console.log('📧 You should see a professional student credentials email with:');
        console.log('   • Improved modern design and layout');
        console.log('   • Better organized credential cards');
        console.log('   • Enhanced footer with contact information');
        console.log('   • Social media links and WhatsApp integration');
        console.log('   • Professional styling and branding');
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
  
  console.log('\n🏁 Student credentials test completed');
}

// Run the test
testStudentCredentials().catch(console.error);