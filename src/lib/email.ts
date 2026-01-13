import * as brevo from '@getbrevo/brevo';

const brevoApiKey = process.env.BREVO_API_KEY || '';
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
const defaultFromEmail = process.env.BREVO_FROM_EMAIL || 'notifications@excellenceakademie.co.za';
const defaultFromName = process.env.BREVO_FROM_NAME || 'Excellence Academia';

export interface EmailPayload {
  to: string;
  subject: string;
  content: string;
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
              
              <!-- Modern Footer -->
              <tr>
                <td style="background: ${colors.dark}; padding: 48px 40px;">
                  
                  <!-- Contact Section -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td style="padding-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: ${colors.white}; letter-spacing: -0.3px;">
                          Get in Touch
                        </h3>
                      </td>
                    </tr>
                  </table>
                  
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                    <!-- Contact Info Grid -->
                    <tr>
                      <td width="50%" style="padding: 12px 12px 12px 0; vertical-align: top;">
                        <table cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="32" valign="top">
                              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px;">📞</div>
                            </td>
                            <td style="padding-left: 12px;">
                              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; font-weight: 500;">Phone</div>
                              <a href="tel:+27123456789" style="font-size: 15px; color: #93C5FD; text-decoration: none; font-weight: 600;">
                                +27 (0) 12 345 6789
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td width="50%" style="padding: 12px 0 12px 12px; vertical-align: top;">
                        <table cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="32" valign="top">
                              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px;">✉️</div>
                            </td>
                            <td style="padding-left: 12px;">
                              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; font-weight: 500;">Email</div>
                              <a href="mailto:info@excellenceakademie.co.za" style="font-size: 15px; color: #93C5FD; text-decoration: none; font-weight: 600;">
                                info@excellenceakademie.co.za
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td colspan="2" style="padding: 20px 0 12px;">
                        <table cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="32" valign="top">
                              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px;">🌐</div>
                            </td>
                            <td style="padding-left: 12px;">
                              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; font-weight: 500;">Website</div>
                              <a href="https://www.excellenceakademie.co.za" style="font-size: 15px; color: #93C5FD; text-decoration: none; font-weight: 600;">
                                www.excellenceakademie.co.za
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td colspan="2" style="padding: 12px 0;">
                        <table cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td width="32" valign="top">
                              <div style="width: 28px; height: 28px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>
                            </td>
                            <td style="padding-left: 12px;">
                              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; font-weight: 500;">Address</div>
                              <div style="font-size: 15px; color: rgba(255, 255, 255, 0.85); line-height: 1.6; font-weight: 500;">
                                123 Academic Boulevard, Education District<br>
                                Cape Town, Western Cape 8000<br>
                                South Africa
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Social Media -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
                    <tr>
                      <td style="padding: 24px 0; border-top: 1px solid rgba(255, 255, 255, 0.08); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="text-align: center; margin-bottom: 16px;">
                          <span style="font-size: 14px; color: rgba(255, 255, 255, 0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Connect With Us</span>
                        </div>
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center">
                              <a href="https://facebook.com/excellenceacademia" style="display: inline-block; margin: 0 8px; width: 44px; height: 44px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border-radius: 12px; text-decoration: none; line-height: 44px; text-align: center; font-size: 20px; transition: all 0.3s ease;">
                                📘
                              </a>
                              <a href="https://twitter.com/excellenceacad" style="display: inline-block; margin: 0 8px; width: 44px; height: 44px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border-radius: 12px; text-decoration: none; line-height: 44px; text-align: center; font-size: 20px;">
                                🐦
                              </a>
                              <a href="https://instagram.com/excellenceacademia" style="display: inline-block; margin: 0 8px; width: 44px; height: 44px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border-radius: 12px; text-decoration: none; line-height: 44px; text-align: center; font-size: 20px;">
                                📷
                              </a>
                              <a href="https://linkedin.com/company/excellence-academia" style="display: inline-block; margin: 0 8px; width: 44px; height: 44px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border-radius: 12px; text-decoration: none; line-height: 44px; text-align: center; font-size: 20px;">
                                💼
                              </a>
                              <a href="https://youtube.com/@excellenceacademia" style="display: inline-block; margin: 0 8px; width: 44px; height: 44px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); border-radius: 12px; text-decoration: none; line-height: 44px; text-align: center; font-size: 20px;">
                                🎥
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Quick Links -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="https://www.excellenceakademie.co.za/about" style="color: #93C5FD; text-decoration: none; font-size: 14px; margin: 0 16px; font-weight: 500;">About</a>
                        <span style="color: rgba(255, 255, 255, 0.2); margin: 0 4px;">•</span>
                        <a href="https://www.excellenceakademie.co.za/courses" style="color: #93C5FD; text-decoration: none; font-size: 14px; margin: 0 16px; font-weight: 500;">Courses</a>
                        <span style="color: rgba(255, 255, 255, 0.2); margin: 0 4px;">•</span>
                        <a href="https://www.excellenceakademie.co.za/tutors" style="color: #93C5FD; text-decoration: none; font-size: 14px; margin: 0 16px; font-weight: 500;">Tutors</a>
                        <span style="color: rgba(255, 255, 255, 0.2); margin: 0 4px;">•</span>
                        <a href="https://www.excellenceakademie.co.za/contact" style="color: #93C5FD; text-decoration: none; font-size: 14px; margin: 0 16px; font-weight: 500;">Contact</a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Business Hours Card -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
                    <tr>
                      <td style="padding: 24px; background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(10px); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="text-align: center;">
                          <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">⏰ Business Hours</div>
                          <table width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="text-align: center; font-size: 14px; color: rgba(255, 255, 255, 0.85); line-height: 1.8; font-weight: 500;">
                                Monday - Friday: 8:00 AM - 6:00 PM<br>
                                Saturday: 9:00 AM - 2:00 PM<br>
                                Sunday: Closed
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Legal & Copyright -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 32px;">
                    <tr>
                      <td style="padding: 28px 0 0; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
                        <p style="margin: 0 0 16px; font-size: 13px; color: rgba(255, 255, 255, 0.5); line-height: 1.7; font-weight: 500;">
                          © ${year} Excellence Academia. All rights reserved.<br>
                          Registered Education Provider • Reg. No: 2024/123456/07
                        </p>
                        <p style="margin: 16px 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.35); line-height: 1.6;">
                          <a href="https://www.excellenceakademie.co.za/privacy" style="color: rgba(255, 255, 255, 0.35); text-decoration: none; margin: 0 12px;">Privacy Policy</a>
                          <span style="color: rgba(255, 255, 255, 0.2);">•</span>
                          <a href="https://www.excellenceakademie.co.za/terms" style="color: rgba(255, 255, 255, 0.35); text-decoration: none; margin: 0 12px;">Terms of Service</a>
                          <span style="color: rgba(255, 255, 255, 0.2);">•</span>
                          <a href="https://www.excellenceakademie.co.za/unsubscribe" style="color: rgba(255, 255, 255, 0.35); text-decoration: none; margin: 0 12px;">Unsubscribe</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                  
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
    const { to, subject, content } = payload;
    if (!brevoApiKey) {
      console.warn('⚠️ BREVO_API_KEY not configured. Email sending skipped (dev mode).');
      console.info('📧 [EMAIL PREVIEW]', {
        to,
        subject,
        contentLength: content.length,
        preview: content.slice(0, 200) + '...'
      });
      return { success: true, data: { mocked: true, message: 'Email logged in development mode' } };
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: defaultFromEmail, name: defaultFromName };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = content;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.info('✅ Email sent successfully via Brevo:', { to, subject, messageId: data.messageId });
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error);
    return { success: false, error };
  }
}