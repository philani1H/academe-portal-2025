
import 'dotenv/config';
import { sendEmail, EmailPayload } from '../src/lib/email.js';

async function main() {
  console.log('Testing Student Credential Email...');

  // Test Data
  const student = {
    name: 'Test Student',
    studentNumber: 'ST123456',
    systemEmail: 'test.student@excellenceakademie.co.za',
    personalEmail: 'notifications@excellenceakademie.co.za', // Loopback for safety, or user provided email
    password: 'TestPassword123!',
    department: 'Science',
    courses: 'Physics, Chemistry',
    courseCount: 2
  };

  // Construct the HTML content using the template logic from email.ts (simplified or reused if possible, 
  // but here we will manually construct the payload to match what the system does)
  // Actually, looking at email.ts, it has `generateEmailContent` but it's not exported.
  // Wait, I see `EmailPreviewPayload` exported.
  // But the `sendEmail` function takes `content` string.
  // I should probably duplicate the template logic or expose the generator.
  // For now, I will manually construct the HTML payload similar to what I saw in email.ts to verify it looks right.
  
  const loginUrl = 'https://portal.excellenceakademie.co.za/login';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Excellence Academy</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F1F5F9;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
            Welcome to Excellence Academy
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          <div style="margin-bottom: 24px;">
            <h2 style="color: #0F172A; font-size: 20px; font-weight: 600; margin: 0 0 16px;">
              Hello ${student.name},
            </h2>
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0;">
              Your student account has been successfully created. You can now access the student portal to view your courses, assignments, and grades.
            </p>
          </div>

          <!-- Credentials Box -->
          <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2);">
            <div style="font-size: 14px; font-weight: 700; color: #0EA5E9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
              🔑 Your Login Credentials
            </div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
                  <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Student Number</div>
                  <div style="font-size: 16px; font-weight: 600; color: #0F172A; font-family: monospace;">${student.studentNumber}</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
                  <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Login Email Address</div>
                  <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${student.systemEmail}</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Password</div>
                  <div style="font-size: 18px; font-weight: 700; color: #4F46E5; font-family: monospace; letter-spacing: 1px;">${student.password}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Course Info -->
          <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(79, 70, 229, 0.2);">
            <div style="font-size: 14px; font-weight: 700; color: #4F46E5; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
              📚 Your Course Enrollments
            </div>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
                  <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Primary Department</div>
                  <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${student.department}</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Enrolled Courses (${student.courseCount})</div>
                  <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${student.courses}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Login Button -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
            <tr>
              <td align="center">
                <a href="${loginUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #0EA5E9 0%, #4F46E5 100%); color: #FFFFFF; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
                  🚀 Login to Student Portal
                </a>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <div style="border-top: 1px solid #E2E8F0; padding-top: 24px; text-align: center;">
            <p style="font-size: 12px; color: #94A3B8; margin: 0;">
              © ${new Date().getFullYear()} Excellence Academy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`Sending email to ${student.personalEmail}...`);
    const result = await sendEmail({
      to: student.personalEmail,
      subject: 'Welcome to Excellence Academy - Your Student Credentials',
      content: htmlContent
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

main();
