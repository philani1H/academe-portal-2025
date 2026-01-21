/**
 * Generate HTML Previews of Email Templates
 */

import 'dotenv/config';
import { renderStudentCredentialsEmail, renderTutorCredentialsEmail } from './src/lib/email.ts';
import { writeFileSync } from 'fs';

async function generatePreviews() {
  console.log('🎨 Generating Email Template Previews...\n');
  
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
    additionalMessage: 'Welcome to Excellence Academia! This preview shows the improved student credential email with enhanced footer design.'
  };
  
  // Sample tutor data
  const sampleTutorData = {
    recipientName: 'Philani Chade',
    tutorEmail: 'philani.tutor@excellenceakademie.co.za',
    personalEmail: 'philanishoun4@gmail.com',
    tempPassword: 'philani.chade@EA25!',
    loginUrl: 'https://www.excellenceakademie.co.za/tutor-login',
    department: 'Mathematics & Sciences',
    allDepartments: 'Mathematics, Physics, Computer Science, Life Sciences',
    courses: 'Advanced Mathematics Grade 12, Physics Grade 12, Computer Science Fundamentals, Life Sciences Grade 12, Mathematics Grade 11',
    courseCount: 5,
    additionalMessage: 'Welcome to Excellence Academia! This preview shows the improved tutor credential email with enhanced footer design.'
  };
  
  console.log('📧 Generating student credentials preview...');
  const studentEmailContent = renderStudentCredentialsEmail(sampleStudentData);
  writeFileSync('student-credentials-preview.html', studentEmailContent);
  console.log('✅ Student preview saved to: student-credentials-preview.html');
  
  console.log('📧 Generating tutor credentials preview...');
  const tutorEmailContent = renderTutorCredentialsEmail(sampleTutorData);
  writeFileSync('tutor-credentials-preview.html', tutorEmailContent);
  console.log('✅ Tutor preview saved to: tutor-credentials-preview.html');
  
  console.log('\n🎉 Email previews generated successfully!');
  console.log('📁 Open these files in your browser to see the improved designs:');
  console.log('   • student-credentials-preview.html');
  console.log('   • tutor-credentials-preview.html');
  console.log('\n✨ Features you can see in the improved footer:');
  console.log('   • Modern contact information cards');
  console.log('   • Correct email: ExcellenceAcademia2025@gmail.com');
  console.log('   • Phone number: +27 79 386 7427');
  console.log('   • Social media integration (Instagram, TikTok)');
  console.log('   • WhatsApp integration with call-to-action');
  console.log('   • Professional support hours display');
  console.log('   • Enhanced visual design and layout');
}

// Run the preview generator
generatePreviews().catch(console.error);