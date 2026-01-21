/**
 * Student Credentials Email Test
 */

import 'dotenv/config';
import { sendEmail, renderStudentCredentialsEmail } from './src/lib/email.js';

async function testStudentCredentialsEmail() {
  console.log('🧪 Testing Student Credentials Email Template...\n');
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`EMAIL_METHOD: ${process.env.EMAIL_METHOD || 'auto'}`);
  console.log(`BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`BREVO_