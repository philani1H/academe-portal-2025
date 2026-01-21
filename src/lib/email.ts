import * as brevo from '@getbrevo/brevo';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

const brevoApiKey = process.env.BREVO_API_KEY || '';
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
const defaultFromEmail = process.env.BREVO_FROM_EMAIL || 'notifications@excellenceakademie.co.za';
const defaultFromName = process.env.BREVO_FROM_NAME || 'Excellence Academia';

// Email method preference
const emailMethod = process.env.EMAIL_METHOD || 'auto'; // 'smtp_only', 'api_only', or 'auto'

// SMTP Configuration for Brevo
const smtpConfig = {
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT || '2525'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER || '',
    pass: process.env.BREVO_SMTP_PASS || '',
  },
};

// Create SMTP transporter
let smtpTransporter: any | null = null;
if (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS) {
  try {
    smtpTransporter = nodemailer.createTransport(smtpConfig);
    console.log('✅ SMTP transporter configured for Brevo');
  } catch (error) {
    console.error('❌ Failed to configure SMTP transporter:', error);
  }
}

// Duplicate email prevention - track recent emails
const recentEmails = new Map<string, number>();
const DUPLICATE_PREVENTION_WINDOW = 60000; // 1 minute

function isDuplicateEmail(to: string, subject: string): boolean {
  const key = `${to}:${subject}`;
  const now = Date.now();
  const lastSent = recentEmails.get(key);
  
  if (lastSent && (now - lastSent) < DUPLICATE_PREVENTION_WINDOW) {
    return true;
  }
  
  recentEmails.set(key, now);
  
  // Clean up old entries
  for (const [k, timestamp] of recentEmails.entries()) {
    if (now - timestamp > DUPLICATE_PREVENTION_WINDOW) {
      recentEmails.delete(k);
    }
  }
  
  return false;
}

export interface EmailPayload {
  to: string;
  subject: string;
  content: string;
  fromEmail?: string;  // Optional: Use specific sender email
  fromName?: string;   // Optional: Use specific sender name
}

export type EmailTemplate =
  | 'announcement'
  | 'course-update'
  | 'tutor-invitation'
  | 'student-update'
  | 'welcome'
  | 'password-reset'
  | 'enrollment-confirmation'
  | 'assignment-notification'
  | 'grade-notification'
  | 'system-alert';

export interface EmailPreviewPayload {
  template: EmailTemplate;
  title: string;
  intro: string;
  actionText?: string;
  actionUrl?: string;
  highlights?: string[];
  courseName?: string;
  tutorName?: string;
  department?: string;
}

// Modern color palette
const colors = {
  primary: '#0EA5E9',
  secondary: '#4F46E5',
  dark: '#0F172A',
  darkGray: '#1E293B',
  mediumGray: '#334155',
  lightGray: '#64748B',
  veryLight: '#F1F5F9',
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export function renderInvitationEmail({ 
  recipientName, 
  actionUrl, 
  courseName, 
  tutorName, 
  department 
}: { 
  recipientName: string; 
  actionUrl: string; 
  courseName?: string; 
  tutorName?: string; 
  department?: string;
}) {
  const title = "Welcome to Excellence Academia";
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${recipientName || 'there'}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        Welcome to <strong style="color: ${colors.primary};">Excellence Academia</strong> – where academic excellence meets personalized learning. We're excited to have you join our community of learners and educators.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0;">
        Get started by activating your account below. Your journey to academic success begins here.
      </p>
    </div>

    ${courseName || tutorName || department ? `
    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2); position: relative; overflow: hidden;">
      <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);"></div>
      <div style="font-size: 14px; font-weight: 700; color: ${colors.primary}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📚 Your Assignment
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        ${courseName ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Course</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${courseName}</div>
          </td>
        </tr>` : ''}
        ${tutorName ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Your Tutor</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${tutorName}</div>
          </td>
        </tr>` : ''}
        ${department ? `
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Department</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${department}</div>
          </td>
        </tr>` : ''}
      </table>
    </div>` : ''}

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${actionUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25); transition: transform 0.2s ease;">
            ✨ Activate Your Account
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px 24px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid ${colors.warning};">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="32" valign="top">
            <div style="font-size: 20px; line-height: 1;">⚡</div>
          </td>
          <td>
            <p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.6;">
              <strong style="font-weight: 700;">Quick Action Required</strong><br>
              This invitation expires in 48 hours. Activate your account now to avoid missing out.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <div style="margin: 32px 0; padding: 20px; background: ${colors.veryLight}; border-radius: 12px; border: 1px dashed ${colors.lightGray}20;">
      <p style="margin: 0 0 12px; font-size: 13px; color: ${colors.lightGray}; font-weight: 600;">
        Alternative Access Link
      </p>
      <p style="word-break: break-all; color: ${colors.primary}; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; line-height: 1.6;">
        ${actionUrl}
      </p>
    </div>
  `;
  
  return renderBrandedEmail({ 
    title, 
    message, 
    footerNote: 'If you did not request this invitation, please disregard this email. Your security is our priority.' 
  });
}

export function renderStudentCredentialsEmail({
  recipientName,
  studentNumber,
  studentEmail,
  personalEmail,
  tempPassword,
  loginUrl,
  department,
  allDepartments,
  courses,
  courseCount,
  courseName,
  additionalMessage
}: {
  recipientName: string;
  studentNumber: string;
  studentEmail: string;
  personalEmail?: string;
  tempPassword: string;
  loginUrl: string;
  department?: string;
  allDepartments?: string;
  courses?: string;
  courseCount?: number;
  courseName?: string;
  additionalMessage?: string;
}) {
  const title = "Your Student Login Credentials";
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: #334155; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: #0F172A;">${recipientName || 'Student'}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #334155; margin: 0 0 20px;">
        Welcome to <strong style="color: #0EA5E9;">Excellence Academia</strong>! Your student account has been created successfully.
      </p>
      ${personalEmail ? `
        <div style="margin: 20px 0; padding: 16px; background: #EFF6FF; border-radius: 12px; border-left: 4px solid #3B82F6;">
          <p style="font-size: 14px; line-height: 1.6; color: #1E40AF; margin: 0;">
            <strong>📧 Note:</strong> This email was sent to your personal email address (${personalEmail}) for security purposes. Please use your system email address (${studentEmail}) to log in to the portal.
          </p>
        </div>
      ` : ''}
      ${additionalMessage ? `
        <div style="margin: 20px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; border-left: 4px solid #0EA5E9;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0;">
            ${additionalMessage}
          </p>
        </div>
      ` : ''}
      <p style="font-size: 16px; line-height: 1.8; color: #334155; margin: 0;">
        Below are your official login credentials. Please keep them safe.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: #0EA5E9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        🔑 Your Login Credentials
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Student Number</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A; font-family: monospace;">${studentNumber}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Login Email Address</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${studentEmail}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Password</div>
            <div style="font-size: 18px; font-weight: 700; color: #4F46E5; font-family: monospace; letter-spacing: 1px;">${tempPassword}</div>
          </td>
        </tr>
      </table>
    </div>

    ${department || courses ? `
    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(79, 70, 229, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: #4F46E5; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📚 Your Course Enrollments
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        ${department ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Primary Department</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${department}</div>
          </td>
        </tr>
        ` : ''}
        ${allDepartments && allDepartments !== department ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">All Departments</div>
            <div style="font-size: 14px; font-weight: 500; color: #0F172A;">${allDepartments}</div>
          </td>
        </tr>
        ` : ''}
        ${courses ? `
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Enrolled Courses ${courseCount ? `(${courseCount})` : ''}</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${courses}</div>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    ` : ''}

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #0EA5E9 0%, #4F46E5 100%); color: #FFFFFF; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            🚀 Login to Student Portal
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px; background: #F1F5F9; border-radius: 12px; border: 1px dashed #64748B20;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; font-weight: 600;">
        📋 Next Steps:
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #64748B; line-height: 1.6;">
        <li>Login using your <strong>system email address</strong> (${studentEmail}) and password above</li>
        ${courseCount ? `<li>Review your ${courseCount} course enrollment${courseCount !== 1 ? 's' : ''} and class schedules</li>` : '<li>Check for available courses and enroll in your subjects</li>'}
        <li>Complete your student profile and preferences</li>
        <li>Explore the learning resources and materials</li>
        <li>Contact support if you need assistance with any courses</li>
      </ul>
    </div>

    <div style="margin: 32px 0; padding: 20px; background: #FEF3C7; border-radius: 12px; border: 1px solid #F59E0B;">
      <p style="margin: 0; font-size: 13px; color: #92400E;">
        <strong>🔒 Security Notice:</strong> This password is generated from your name for consistency. You can change it after logging in if desired. Always use your system email address (${studentEmail}) to log in, not your personal email.
      </p>
    </div>
  `;

  return renderBrandedEmail({ title, message });
}

export function renderAdminCredentialsEmail({
  recipientName,
  adminEmail,
  personalEmail,
  tempPassword,
  loginUrl,
  additionalMessage
}: {
  recipientName: string;
  adminEmail: string;
  personalEmail?: string;
  tempPassword: string;
  loginUrl: string;
  additionalMessage?: string;
}) {
  const title = "Your Admin Account Credentials";
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: #334155; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: #0F172A;">${recipientName || 'Admin'}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #334155; margin: 0 0 20px;">
        Welcome to the <strong style="color: #0EA5E9;">Excellence Academia</strong> admin portal! Your account credentials have been updated.
      </p>
      ${personalEmail ? `
        <div style="margin: 20px 0; padding: 16px; background: #EFF6FF; border-radius: 12px; border-left: 4px solid #0EA5E9;">
          <p style="font-size: 14px; line-height: 1.6; color: #1E40AF; margin: 0;">
            <strong>📧 Note:</strong> This email was sent to your personal email address (${personalEmail}) for security purposes. Please use your system email (${adminEmail}) to log in.
          </p>
        </div>
      ` : ''}
      ${additionalMessage ? `
        <div style="margin: 20px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; border-left: 4px solid #0EA5E9;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0;">
            ${additionalMessage}
          </p>
        </div>
      ` : ''}
      <p style="font-size: 16px; line-height: 1.8; color: #334155; margin: 0;">
        Below are your login credentials.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: #0EA5E9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        🔑 Your Login Credentials
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Login Email Address</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${adminEmail}</div>
          </td>
        </tr>
        ${personalEmail ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Personal Email (This Email)</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${personalEmail}</div>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Temporary Password</div>
            <div style="font-size: 18px; font-weight: 700; color: #4F46E5; font-family: monospace; letter-spacing: 1px;">${tempPassword}</div>
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #0EA5E9 0%, #4F46E5 100%); color: #FFFFFF; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            🛡️ Access Admin Portal
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px; background: #F1F5F9; border-radius: 12px; border: 1px dashed #64748B20;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; font-weight: 600;">
        📋 Next Steps:
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #64748B; line-height: 1.6;">
        <li>Login using your <strong>system email</strong> (${adminEmail}) and temporary password</li>
        <li>Change your password immediately after first login</li>
        <li>Manage users, courses, and platform settings</li>
        <li>Review system analytics and reports</li>
      </ul>
    </div>

    <div style="margin: 32px 0; padding: 20px; background: #FEF3C7; border-radius: 12px; border: 1px solid #F59E0B;">
      <p style="margin: 0; font-size: 13px; color: #92400E;">
        <strong>🔒 Security Notice:</strong> This is a temporary password. Please change it immediately after logging in for security purposes.
      </p>
    </div>
  `;

  return renderBrandedEmail({ title, message });
}

export function renderTutorCredentialsEmail({
  recipientName,
  tutorEmail,
  personalEmail,
  tempPassword,
  loginUrl,
  department,
  allDepartments,
  courses,
  courseCount,
  additionalMessage
}: {
  recipientName: string;
  tutorEmail: string;
  personalEmail?: string;
  tempPassword: string;
  loginUrl: string;
  department: string;
  allDepartments?: string;
  courses: string;
  courseCount?: number;
  additionalMessage?: string;
}) {
  const title = "Your Tutor Account Credentials";
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: #334155; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: #0F172A;">${recipientName || 'Tutor'}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #334155; margin: 0 0 20px;">
        Welcome to the <strong style="color: #0EA5E9;">Excellence Academia</strong> tutor portal! Your account credentials have been updated.
      </p>
      ${personalEmail ? `
        <div style="margin: 20px 0; padding: 16px; background: #EFF6FF; border-radius: 12px; border-left: 4px solid #0EA5E9;">
          <p style="font-size: 14px; line-height: 1.6; color: #1E40AF; margin: 0;">
            <strong>📧 Note:</strong> This email was sent to your personal email address (${personalEmail}) for security purposes. Please use your system email (${tutorEmail}) to log in.
          </p>
        </div>
      ` : ''}
      ${additionalMessage ? `
        <div style="margin: 20px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; border-left: 4px solid #0EA5E9;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0;">
            ${additionalMessage}
          </p>
        </div>
      ` : ''}
      <p style="font-size: 16px; line-height: 1.8; color: #334155; margin: 0;">
        Below are your login credentials and course assignments.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: #0EA5E9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        🔑 Your Login Credentials
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Login Email Address</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${tutorEmail}</div>
          </td>
        </tr>
        ${personalEmail ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Personal Email (This Email)</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${personalEmail}</div>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Temporary Password</div>
            <div style="font-size: 18px; font-weight: 700; color: #4F46E5; font-family: monospace; letter-spacing: 1px;">${tempPassword}</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(14, 165, 233, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(79, 70, 229, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: #4F46E5; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📚 Your Teaching Assignments
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Primary Department</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${department}</div>
          </td>
        </tr>
        ${allDepartments && allDepartments !== department ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">All Departments</div>
            <div style="font-size: 14px; font-weight: 500; color: #0F172A;">${allDepartments}</div>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px;">Assigned Courses ${courseCount ? `(${courseCount})` : ''}</div>
            <div style="font-size: 16px; font-weight: 600; color: #0F172A;">${courses}</div>
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #0EA5E9 0%, #4F46E5 100%); color: #FFFFFF; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            🎓 Access Tutor Portal
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px; background: #F1F5F9; border-radius: 12px; border: 1px dashed #64748B20;">
      <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; font-weight: 600;">
        📋 Next Steps:
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #64748B; line-height: 1.6;">
        <li>Login using your <strong>system email</strong> (${tutorEmail}) and temporary password</li>
        <li>Change your password immediately after first login</li>
        <li>Review your course assignments and student lists</li>
        <li>Set up your tutor profile and preferences</li>
        <li>Explore the teaching tools and resources available</li>
      </ul>
    </div>

    <div style="margin: 32px 0; padding: 20px; background: #FEF3C7; border-radius: 12px; border: 1px solid #F59E0B;">
      <p style="margin: 0; font-size: 13px; color: #92400E;">
        <strong>🔒 Security Notice:</strong> This is a temporary password. Please change it immediately after logging in for security purposes.
      </p>
    </div>
  `;

  return renderBrandedEmail({ title, message });
}

export function renderGenericActionEmail({ 
  title, 
  intro, 
  actionText, 
  actionUrl, 
  courseName, 
  tutorName, 
  department 
}: { 
  title: string; 
  intro: string; 
  actionText: string; 
  actionUrl: string; 
  courseName?: string; 
  tutorName?: string; 
  department?: string;
}) {
  const message = `
    <p style="font-size: 17px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 32px; font-weight: 400;">
      ${intro}
    </p>

    ${courseName || tutorName || department ? `
    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.primary}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📋 Details
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        ${courseName ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Course</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${courseName}</div>
          </td>
        </tr>` : ''}
        ${tutorName ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Tutor</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${tutorName}</div>
          </td>
        </tr>` : ''}
        ${department ? `
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Department</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${department}</div>
          </td>
        </tr>` : ''}
      </table>
    </div>` : ''}

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${actionUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            ${actionText}
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px; background: ${colors.veryLight}; border-radius: 12px; border: 1px dashed ${colors.lightGray}20;">
      <p style="margin: 0 0 12px; font-size: 13px; color: ${colors.lightGray}; font-weight: 600;">
        Alternative Access Link
      </p>
      <p style="word-break: break-all; color: ${colors.primary}; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; line-height: 1.6;">
        ${actionUrl}
      </p>
    </div>
  `;
  
  return renderBrandedEmail({ title, message });
}

export function renderBrandedEmail({ 
  title, 
  message, 
  footerNote 
}: { 
  title: string; 
  message: string; 
  footerNote?: string;
}) {
  const year = new Date().getFullYear();
  const safeFooter = footerNote || 'This is an automated notification from Excellence Academia. Please do not reply directly to this email.';
  
  return `
    <!DOCTYPE html>
    <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        @media only screen and (max-width: 600px) {
          .mobile-padding {
            padding: 20px !important;
          }
          .mobile-text {
            font-size: 14px !important;
          }
          .mobile-title {
            font-size: 20px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      
      <!-- Outer Container -->
      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 40px 20px;">
        <tr>
          <td align="center">
            
            <!-- Main Email Container -->
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 680px; background: ${colors.white}; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);">
              
              <!-- Header with Modern Gradient -->
              <tr>
                <td style="padding: 0; position: relative;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 48px 40px; text-align: center; position: relative;">
                        <!-- Decorative Elements -->
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h40v40H0z\" fill=\"none\"/%3E%3Cpath d=\"M0 20h20v20H0z\" fill=\"%23fff\" opacity=\".03\"/%3E%3C/svg%3E') repeat; opacity: 0.4;"></div>
                        
                        <!-- Logo/Brand -->
                        <div style="position: relative; z-index: 1;">
                          <h1 style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: ${colors.white}; letter-spacing: -1px; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);">
                            Excellence Academia
                          </h1>
                          <div style="display: inline-block; padding: 8px 20px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 20px; font-size: 12px; color: ${colors.white}; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                            Empowering Excellence
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Content Area -->
              <tr>
                <td class="mobile-padding" style="padding: 56px 48px;">
                  <h2 class="mobile-title" style="margin: 0 0 28px; font-size: 28px; font-weight: 700; color: ${colors.dark}; line-height: 1.3; letter-spacing: -0.5px;">
                    ${title}
                  </h2>
                  <div class="mobile-text" style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray};">
                    ${message}
                  </div>
                </td>
              </tr>
              
              <!-- Info Note -->
              <tr>
                <td class="mobile-padding" style="padding: 0 48px 48px;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding: 24px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%); border-radius: 16px; border-left: 4px solid ${colors.warning};">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="40" valign="top">
                              <div style="font-size: 24px; line-height: 1;">💡</div>
                            </td>
                            <td>
                              <p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.7; font-weight: 500;">
                                ${safeFooter}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Enhanced Professional Footer -->
              <tr>
                <td style="background: ${colors.dark}; padding: 48px 30px; text-align: center;">
                  
                  <!-- Logo/Brand -->
                  <h3 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${colors.white}; letter-spacing: -0.5px;">
                    Excellence Academia
                  </h3>
                  <p style="margin: 0 0 32px; font-size: 15px; color: rgba(255, 255, 255, 0.7); font-weight: 500; max-width: 400px; margin-left: auto; margin-right: auto;">
                    Empowering Academic Excellence Through Quality Education
                  </p>

                  <!-- Get in Touch Section -->
                  <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin-bottom: 32px; max-width: 500px; margin-left: auto; margin-right: auto; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <h4 style="color: ${colors.white}; margin: 0 0 16px; font-size: 16px; font-weight: 600;">Get in Touch</h4>
                    <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
                      Have questions or need assistance? Our support team is ready to help you succeed.
                    </p>
                    <div>
                      <a href="mailto:ExcellenceAcademia2025@gmail.com" style="display: inline-block; color: ${colors.white}; text-decoration: none; margin: 0 12px; font-size: 14px; font-weight: 500; background: rgba(255, 255, 255, 0.1); padding: 8px 16px; border-radius: 6px;">
                        ✉️ ExcellenceAcademia2025@gmail.com
                      </a>
                      <a href="https://wa.me/27793867427" style="display: inline-block; color: ${colors.white}; text-decoration: none; margin: 12px 12px 0; font-size: 14px; font-weight: 500; background: rgba(37, 211, 102, 0.2); padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(37, 211, 102, 0.3);">
                        💬 WhatsApp Support
                      </a>
                    </div>
                  </div>

                  <!-- Social Links -->
                  <div style="margin-bottom: 40px;">
                    <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Connect With Us</p>
                    <a href="https://www.instagram.com/excellence.academia25" style="display: inline-block; margin: 0 12px; text-decoration: none; opacity: 0.8; transition: opacity 0.2s;">
                      <span style="font-size: 24px;">📷</span>
                    </a>
                    <a href="https://www.tiktok.com/@excellence.academia25" style="display: inline-block; margin: 0 12px; text-decoration: none; opacity: 0.8; transition: opacity 0.2s;">
                      <span style="font-size: 24px;">🎵</span>
                    </a>
                    <a href="https://wa.me/27793867427" style="display: inline-block; margin: 0 12px; text-decoration: none; opacity: 0.8; transition: opacity 0.2s;">
                      <span style="font-size: 24px;">💬</span>
                    </a>
                  </div>

                  <!-- Disclaimer & Legal -->
                  <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 32px; text-align: left;">
                    <p style="margin: 0 0 16px; font-size: 11px; color: rgba(255, 255, 255, 0.4); line-height: 1.6;">
                      <strong>Disclaimer:</strong> This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed. If you have received this email in error, please notify the sender immediately and delete it from your system. Any views or opinions expressed are solely those of the author and do not necessarily represent those of Excellence Academia.
                    </p>
                    
                    <p style="margin: 0 0 24px; font-size: 11px; color: rgba(255, 255, 255, 0.4); line-height: 1.6;">
                      Excellence Academia is a registered educational platform in South Africa.<br>
                      Headquarters: South Africa
                    </p>

                    <div style="text-align: center; margin-top: 32px;">
                      <p style="margin: 0 0 12px; font-size: 12px; color: rgba(255, 255, 255, 0.4);">
                        © ${year} Excellence Academia. All rights reserved.
                      </p>
                      <div style="font-size: 11px;">
                        <a href="https://www.excellenceakademie.co.za/privacy" style="color: rgba(255, 255, 255, 0.5); text-decoration: none; margin: 0 8px;">Privacy Policy</a>
                        <span style="color: rgba(255, 255, 255, 0.2);">|</span>
                        <a href="https://www.excellenceakademie.co.za/terms" style="color: rgba(255, 255, 255, 0.5); text-decoration: none; margin: 0 8px;">Terms of Service</a>
                        <span style="color: rgba(255, 255, 255, 0.2);">|</span>
                        <a href="mailto:ExcellenceAcademia2025@gmail.com?subject=Unsubscribe" style="color: rgba(255, 255, 255, 0.5); text-decoration: none; margin: 0 8px;">Unsubscribe</a>
                      </div>
                    </div>
                  </div>
                  
                </td>
              </tr>
              
            </table>
            <!-- End Main Email Container -->
            
          </td>
        </tr>
      </table>
      <!-- End Outer Container -->
      
    </body>
    </html>
  `;
}

// Welcome email for new users
export function renderWelcomeEmail({
  recipientName,
  userRole,
  loginUrl,
  supportEmail = 'info@excellenceakademie.co.za'
}: {
  recipientName: string;
  userRole: 'student' | 'tutor' | 'admin';
  loginUrl: string;
  supportEmail?: string;
}) {
  const roleLabel = userRole === 'tutor' ? 'Tutor' : userRole === 'admin' ? 'Administrator' : 'Student';
  const title = `Welcome to Excellence Academia, ${recipientName}!`;

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${recipientName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        Welcome to <strong style="color: ${colors.primary};">Excellence Academia</strong>! Your account has been successfully created with <strong>${roleLabel}</strong> access.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0;">
        You can now access your dashboard and start your journey towards academic excellence.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.success}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        ✨ Getting Started
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
            <div style="font-size: 15px; color: ${colors.mediumGray}; line-height: 1.6;">
              ${userRole === 'student' ? '✓ Browse available courses and enroll' : ''}
              ${userRole === 'tutor' ? '✓ Set up your profile and create courses' : ''}
              ${userRole === 'admin' ? '✓ Access the admin dashboard to manage the platform' : ''}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
            <div style="font-size: 15px; color: ${colors.mediumGray}; line-height: 1.6;">
              ${userRole === 'student' ? '✓ Track your progress and grades' : ''}
              ${userRole === 'tutor' ? '✓ Manage students and assignments' : ''}
              ${userRole === 'admin' ? '✓ Oversee users, courses, and content' : ''}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 15px; color: ${colors.mediumGray}; line-height: 1.6;">
              ✓ Connect with the Excellence Academia community
            </div>
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            🚀 Access Your Dashboard
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px 24px; background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 12px; border-left: 4px solid ${colors.info};">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="32" valign="top">
            <div style="font-size: 20px; line-height: 1;">💡</div>
          </td>
          <td>
            <p style="margin: 0; font-size: 14px; color: #1E40AF; line-height: 1.6;">
              <strong style="font-weight: 700;">Need Help?</strong><br>
              If you have any questions or need assistance, our support team is here to help at <a href="mailto:${supportEmail}" style="color: ${colors.primary}; text-decoration: none; font-weight: 600;">${supportEmail}</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return renderBrandedEmail({ title, message });
}

// Password reset email
export function renderPasswordResetEmail({
  recipientName,
  resetUrl,
  expiryHours = 24
}: {
  recipientName: string;
  resetUrl: string;
  expiryHours?: number;
}) {
  const title = 'Reset Your Password';

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${recipientName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        We received a request to reset your password for your Excellence Academia account.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0;">
        Click the button below to create a new password. This link will expire in ${expiryHours} hours.
      </p>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            🔒 Reset Password
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px; background: ${colors.veryLight}; border-radius: 12px; border: 1px dashed ${colors.lightGray}20;">
      <p style="margin: 0 0 12px; font-size: 13px; color: ${colors.lightGray}; font-weight: 600;">
        Alternative Reset Link
      </p>
      <p style="word-break: break-all; color: ${colors.primary}; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; line-height: 1.6;">
        ${resetUrl}
      </p>
    </div>

    <div style="margin: 32px 0; padding: 20px 24px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid ${colors.warning};">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="32" valign="top">
            <div style="font-size: 20px; line-height: 1;">⚠️</div>
          </td>
          <td>
            <p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.6;">
              <strong style="font-weight: 700;">Did not request this?</strong><br>
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return renderBrandedEmail({
    title,
    message,
    footerNote: 'For security reasons, this password reset link will expire automatically. Never share your password with anyone.'
  });
}

// Enrollment confirmation email
export function renderEnrollmentEmail({
  studentName,
  courseName,
  tutorName,
  startDate,
  courseUrl
}: {
  studentName: string;
  courseName: string;
  tutorName: string;
  startDate: string;
  courseUrl: string;
}) {
  const title = 'Course Enrollment Confirmed!';

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        Great news! You've been successfully enrolled in <strong style="color: ${colors.primary};">${courseName}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0;">
        Your learning journey begins now. Access your course materials and start learning today!
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.primary}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📚 Course Details
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Course Name</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${courseName}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Your Tutor</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${tutorName}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Start Date</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${startDate}</div>
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${courseUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            📖 Access Course
          </a>
        </td>
      </tr>
    </table>
  `;

  return renderBrandedEmail({ title, message });
}

// Assignment notification email
export function renderAssignmentEmail({
  studentName,
  assignmentTitle,
  courseName,
  dueDate,
  assignmentUrl
}: {
  studentName: string;
  assignmentTitle: string;
  courseName: string;
  dueDate: string;
  assignmentUrl: string;
}) {
  const title = 'New Assignment Posted';

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        A new assignment has been posted in <strong style="color: ${colors.primary};">${courseName}</strong>.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.warning}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📝 Assignment Details
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(251, 191, 36, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Assignment</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${assignmentTitle}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(251, 191, 36, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Course</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${courseName}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Due Date</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${dueDate}</div>
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${assignmentUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            📋 View Assignment
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px 24px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid ${colors.warning};">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="32" valign="top">
            <div style="font-size: 20px; line-height: 1;">⏰</div>
          </td>
          <td>
            <p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.6;">
              <strong style="font-weight: 700;">Don't forget!</strong><br>
              Make sure to submit your assignment before the due date to avoid late penalties.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return renderBrandedEmail({ title, message });
}

// Grade notification email
export function renderGradeEmail({
  studentName,
  assignmentTitle,
  courseName,
  grade,
  feedback,
  viewUrl
}: {
  studentName: string;
  assignmentTitle: string;
  courseName: string;
  grade: string;
  feedback?: string;
  viewUrl: string;
}) {
  const title = 'Assignment Graded';

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        Your assignment <strong>"${assignmentTitle}"</strong> in <strong style="color: ${colors.primary};">${courseName}</strong> has been graded.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.success}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        ⭐ Your Results
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Assignment</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${assignmentTitle}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Grade</div>
            <div style="font-size: 24px; font-weight: 700; color: ${colors.success};">${grade}</div>
          </td>
        </tr>
        ${feedback ? `
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 8px;">Feedback</div>
            <div style="font-size: 15px; color: ${colors.mediumGray}; line-height: 1.7;">${feedback}</div>
          </td>
        </tr>` : ''}
      </table>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${viewUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            📊 View Details
          </a>
        </td>
      </tr>
    </table>
  `;

  return renderBrandedEmail({ title, message });
}

// System alert email
export function renderSystemAlertEmail({
  recipientName,
  alertTitle,
  alertMessage,
  alertType = 'info',
  actionText,
  actionUrl
}: {
  recipientName: string;
  alertTitle: string;
  alertMessage: string;
  alertType?: 'info' | 'warning' | 'success' | 'error';
  actionText?: string;
  actionUrl?: string;
}) {
  const alertColors = {
    info: { bg: '#DBEAFE', border: colors.info, icon: '🔔' },
    warning: { bg: '#FEF3C7', border: colors.warning, icon: '⚠️' },
    success: { bg: '#D1FAE5', border: colors.success, icon: '✅' },
    error: { bg: '#FEE2E2', border: '#EF4444', icon: '❌' }
  };

  const alertStyle = alertColors[alertType];
  const title = alertTitle;

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${recipientName}</strong>,
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: ${alertStyle.bg}; border-radius: 16px; border-left: 4px solid ${alertStyle.border};">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="40" valign="top">
            <div style="font-size: 28px; line-height: 1;">${alertStyle.icon}</div>
          </td>
          <td>
            <div style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray};">
              ${alertMessage}
            </div>
          </td>
        </tr>
      </table>
    </div>

    ${actionText && actionUrl ? `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${actionUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            ${actionText}
          </a>
        </td>
      </tr>
    </table>` : ''}
  `;

  return renderBrandedEmail({ title, message });
}

export function renderBrandedEmailPreview(payload: EmailPreviewPayload) {
  const { template, title, intro, actionText, actionUrl, highlights = [], courseName, tutorName, department } = payload;
  
  const infoItems = [
    courseName && { label: 'Course', value: courseName },
    tutorName && { label: 'Tutor', value: tutorName },
    department && { label: 'Department', value: department }
  ].filter(Boolean);
  
  const infoSection = infoItems.length > 0 ? `
    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2); position: relative; overflow: hidden;">
      <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);"></div>
      <div style="font-size: 14px; font-weight: 700; color: ${colors.primary}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📚 Information
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        ${infoItems.map((item, idx) => `
        <tr>
          <td style="padding: 10px 0; ${idx < infoItems.length - 1 ? 'border-bottom: 1px solid rgba(14, 165, 233, 0.1);' : ''}">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">${item.label}</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${item.value}</div>
          </td>
        </tr>`).join('')}
      </table>
    </div>` : '';
  
  const highlightsList = Array.isArray(highlights) && highlights.length > 0 ? `
    <div style="margin: 28px 0;">
      <div style="font-size: 15px; font-weight: 700; color: ${colors.dark}; margin-bottom: 16px;">Key Highlights:</div>
      <ul style="margin: 0; padding-left: 24px; color: ${colors.mediumGray}; line-height: 2;">
        ${highlights.map(h => `<li style="margin: 10px 0; font-size: 15px;">${h}</li>`).join('')}
      </ul>
    </div>` : '';
  
  const ctaButton = actionText && actionUrl ? `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${actionUrl}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            ${actionText}
          </a>
        </td>
      </tr>
    </table>
    <div style="margin: 24px 0; padding: 20px; background: ${colors.veryLight}; border-radius: 12px; border: 1px dashed ${colors.lightGray}20;">
      <p style="margin: 0 0 12px; font-size: 13px; color: ${colors.lightGray}; font-weight: 600; text-align: center;">
        Alternative Access Link
      </p>
      <p style="word-break: break-all; color: ${colors.primary}; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; line-height: 1.6; text-align: center;">
        ${actionUrl}
      </p>
    </div>` : '';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      
      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 40px 20px;">
        <tr>
          <td align="center">
            
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 680px; background: ${colors.white}; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);">
              
              <!-- Modern Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 48px 40px; text-align: center; position: relative;">
                  <h1 style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: ${colors.white}; letter-spacing: -1px; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);">
                    Excellence Academia
                  </h1>
                  <div style="display: inline-block; padding: 8px 20px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 20px; font-size: 12px; color: ${colors.white}; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
                    Empowering Excellence
                  </div>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 56px 48px;">
                  <h2 style="margin: 0 0 28px; font-size: 28px; font-weight: 700; color: ${colors.dark}; line-height: 1.3; letter-spacing: -0.5px;">
                    ${title}
                  </h2>
                  <p style="font-size: 17px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 32px;">
                    ${intro}
                  </p>
                  ${infoSection}
                  ${highlightsList}
                  ${ctaButton}
                </td>
              </tr>
              
              <!-- Compact Footer -->
              <tr>
                <td style="background: ${colors.dark}; padding: 40px; text-align: center;">
                  <p style="margin: 0 0 12px; font-size: 14px; color: rgba(255, 255, 255, 0.85); font-weight: 500;">
                    <a href="https://www.excellenceakademie.co.za" style="color: #93C5FD; text-decoration: none;">www.excellenceakademie.co.za</a>
                    <span style="color: rgba(255, 255, 255, 0.3); margin: 0 12px;">•</span>
                    <a href="mailto:info@excellenceakademie.co.za" style="color: #93C5FD; text-decoration: none;">info@excellenceakademie.co.za</a>
                  </p>
                  <p style="margin: 16px 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                    © ${new Date().getFullYear()} Excellence Academia • All rights reserved
                  </p>
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
      
    </body>
    </html>`;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const { to, subject, content, fromEmail, fromName } = payload;
    
    // Check for duplicate emails
    if (isDuplicateEmail(to, subject)) {
      console.warn('⚠️ Duplicate email prevented:', { to, subject });
      return { 
        success: false, 
        error: 'Duplicate email prevented - same email sent within the last minute',
        duplicate: true 
      };
    }
    
    // SMTP Only Mode - Force SMTP usage
    if (emailMethod === 'smtp_only' || !brevoApiKey) {
      if (!smtpTransporter || !process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.warn('⚠️ SMTP credentials not configured. Email sending skipped (dev mode).');
        console.info('📧 [EMAIL PREVIEW - SMTP ONLY MODE]', {
          to,
          from: fromEmail || defaultFromEmail,
          fromName: fromName || defaultFromName,
          subject,
          contentLength: content.length,
          preview: content.slice(0, 200) + '...'
        });
        return { success: true, data: { mocked: true, message: 'Email logged in development mode (SMTP only)' } };
      }

      try {
        const mailOptions = {
          from: {
            name: fromName || defaultFromName,
            address: fromEmail || defaultFromEmail,
          },
          to: to,
          subject: subject,
          html: content,
        };

        const info = await smtpTransporter.sendMail(mailOptions);
        console.info('✅ Email sent successfully via SMTP:', { 
          to, 
          from: fromEmail || defaultFromEmail,
          subject, 
          messageId: info.messageId 
        });
        return { success: true, data: { messageId: info.messageId, method: 'smtp' } };
      } catch (smtpError) {
        console.error('❌ SMTP sending failed:', smtpError);
        return { success: false, error: smtpError };
      }
    }
    
    // Auto mode - Try SMTP first, then API fallback
    if (smtpTransporter && process.env.BREVO_SMTP_USER) {
      try {
        const mailOptions = {
          from: {
            name: fromName || defaultFromName,
            address: fromEmail || defaultFromEmail,
          },
          to: to,
          subject: subject,
          html: content,
        };

        const info = await smtpTransporter.sendMail(mailOptions);
        console.info('✅ Email sent successfully via SMTP:', { 
          to, 
          from: fromEmail || defaultFromEmail,
          subject, 
          messageId: info.messageId 
        });
        return { success: true, data: { messageId: info.messageId, method: 'smtp' } };
      } catch (smtpError) {
        console.warn('⚠️ SMTP sending failed, trying Brevo API fallback:', smtpError);
        // Fall through to API method
      }
    }

    // Fallback to Brevo API (only if not in smtp_only mode)
    if (emailMethod !== 'smtp_only' && brevoApiKey) {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { 
        email: fromEmail || defaultFromEmail, 
        name: fromName || defaultFromName 
      };
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = content;

      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

      console.info('✅ Email sent successfully via Brevo API:', { 
        to, 
        from: fromEmail || defaultFromEmail,
        subject, 
        messageId: data.messageId 
      });
      return { success: true, data: { ...data, method: 'api' } };
    }

    // No valid email method available
    console.warn('⚠️ No email sending method configured.');
    return { success: false, error: 'No email sending method configured' };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error };
  }
}


// Live Session Started Email
export function renderLiveSessionStartedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  sessionLink: string;
}) {
  const title = `🔴 LIVE NOW: ${params.courseName}`;
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${params.studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        <strong style="color: ${colors.primary};">${params.tutorName}</strong> has started a live session for <strong>${params.courseName}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0;">
        Join the session now to participate in this interactive learning opportunity!
      </p>
    </div>

    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${params.sessionLink}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(220, 38, 38, 0.25);">
            🔴 Join Live Session Now
          </a>
        </td>
      </tr>
    </table>

    <div style="margin: 32px 0; padding: 20px; background: ${colors.veryLight}; border-radius: 12px; border: 1px dashed ${colors.lightGray}20;">
      <p style="margin: 0 0 12px; font-size: 13px; color: ${colors.lightGray}; font-weight: 600;">
        Session Link
      </p>
      <p style="word-break: break-all; color: ${colors.primary}; font-size: 13px; margin: 0; font-family: 'Courier New', monospace; line-height: 1.6;">
        ${params.sessionLink}
      </p>
    </div>
  `;
  return renderBrandedEmail({ 
    title, 
    message,
    footerNote: `This live session was started by ${params.tutorName}. Join now to not miss out!`
  });
}

// Scheduled Session Email
export function renderScheduledSessionEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  scheduledDate: Date;
  duration: number;
}) {
  const title = `📅 Scheduled: ${params.courseName} Live Session`;
  const dateStr = new Date(params.scheduledDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = new Date(params.scheduledDate).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${params.studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        <strong style="color: ${colors.primary};">${params.tutorName}</strong> has scheduled a live session for <strong>${params.courseName}</strong>.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(14, 165, 233, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.primary}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📅 Session Details
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Date</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${dateStr}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(14, 165, 233, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Time</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${timeStr}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Duration</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${params.duration} minutes</div>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 20px 0;">
      Mark your calendar! You'll receive a reminder before the session starts.
    </p>
  `;
  return renderBrandedEmail({ 
    title, 
    message,
    footerNote: `Scheduled by ${params.tutorName}. Add this to your calendar so you don't miss it!`
  });
}

// Material Uploaded Email
export function renderMaterialUploadedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  materialName: string;
  materialType: string;
  downloadLink?: string;
}) {
  const title = `📚 New Material: ${params.materialName}`;
  const typeIcon = params.materialType === 'pdf' ? '📄' : params.materialType === 'video' ? '🎥' : '📁';
  
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${params.studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        <strong style="color: ${colors.primary};">${params.tutorName}</strong> has uploaded new material for <strong>${params.courseName}</strong>.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.success}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        ${typeIcon} Material Details
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Material Name</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${params.materialName}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Type</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${params.materialType.toUpperCase()}</div>
          </td>
        </tr>
      </table>
    </div>

    ${params.downloadLink ? `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${params.downloadLink}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);">
            📥 Download Material
          </a>
        </td>
      </tr>
    </table>
    ` : ''}
  `;
  return renderBrandedEmail({ 
    title, 
    message,
    footerNote: `New material uploaded by ${params.tutorName}. Access it anytime from your course dashboard.`
  });
}

// Test Created Email
export function renderTestCreatedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  testName: string;
  dueDate: Date;
  duration?: number;
  totalPoints?: number;
  testLink?: string;
}) {
  const title = `📝 New Test: ${params.testName}`;
  const dueDateStr = new Date(params.dueDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${params.studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        <strong style="color: ${colors.primary};">${params.tutorName}</strong> has published a new test for <strong>${params.courseName}</strong>.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(67, 56, 202, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(79, 70, 229, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.secondary}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        📝 Test Details
      </div>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Test Name</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${params.testName}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Due Date</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${dueDateStr}</div>
          </td>
        </tr>
        ${params.duration ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(79, 70, 229, 0.1);">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Duration</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${params.duration} minutes</div>
          </td>
        </tr>
        ` : ''}
        ${params.totalPoints ? `
        <tr>
          <td style="padding: 10px 0;">
            <div style="font-size: 13px; color: ${colors.lightGray}; margin-bottom: 4px;">Total Points</div>
            <div style="font-size: 16px; font-weight: 600; color: ${colors.dark};">${params.totalPoints} points</div>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${params.testLink ? `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${params.testLink}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.secondary} 0%, #4338ca 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);">
            📝 Start Test
          </a>
        </td>
      </tr>
    </table>
    ` : ''}

    <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 20px 0;">
      Good luck with your test!
    </p>
  `;
  return renderBrandedEmail({ 
    title, 
    message,
    footerNote: `Test published by ${params.tutorName}. Make sure to complete it before the due date.`
  });
}

// Student Approved Email
export function renderStudentApprovedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
  courseLink?: string;
}) {
  const title = `✅ Enrollment Approved - ${params.courseName}`;
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${params.studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        Great news! <strong style="color: ${colors.primary};">${params.tutorName}</strong> has approved your enrollment in <strong>${params.courseName}</strong>.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.2);">
      <div style="font-size: 14px; font-weight: 700; color: ${colors.success}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
        ✓ You Now Have Access To
      </div>
      <ul style="margin: 0; padding-left: 20px; color: ${colors.mediumGray};">
        <li style="margin: 8px 0;">Course materials and resources</li>
        <li style="margin: 8px 0;">Live sessions with your tutor</li>
        <li style="margin: 8px 0;">Tests and assignments</li>
        <li style="margin: 8px 0;">Direct communication with ${params.tutorName}</li>
      </ul>
    </div>

    ${params.courseLink ? `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0;">
      <tr>
        <td align="center">
          <a href="${params.courseLink}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, ${colors.success} 0%, #059669 100%); color: ${colors.white}; text-decoration: none; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);">
            🎓 Access Course
          </a>
        </td>
      </tr>
    </table>
    ` : ''}

    <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 20px 0;">
      Welcome to the class! We're excited to have you.
    </p>
  `;
  return renderBrandedEmail({ 
    title, 
    message,
    footerNote: `Your enrollment was approved by ${params.tutorName}. Start learning today!`
  });
}

// Student Rejected Email
export function renderStudentRejectedEmail(params: {
  studentName: string;
  tutorName: string;
  courseName: string;
}) {
  const title = `Enrollment Status - ${params.courseName}`;
  const message = `
    <div style="margin-bottom: 32px;">
      <p style="font-size: 18px; line-height: 1.7; color: ${colors.mediumGray}; margin: 0 0 20px; font-weight: 400;">
        Hi <strong style="color: ${colors.dark};">${params.studentName}</strong>,
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0 0 20px;">
        Thank you for your interest in <strong>${params.courseName}</strong>.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: ${colors.mediumGray}; margin: 0;">
        Unfortunately, your enrollment request has not been approved at this time.
      </p>
    </div>

    <div style="margin: 32px 0; padding: 20px 24px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; border-left: 4px solid ${colors.warning};">
      <p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.6;">
        <strong style="font-weight: 700;">Have Questions?</strong><br>
        If you have questions about this decision, please reply to this email to contact <strong>${params.tutorName}</strong> directly.
      </p>
    </div>
  `;
  return renderBrandedEmail({ 
    title, 
    message,
    footerNote: `You can reply to this email to contact ${params.tutorName} directly.`
  });
}
