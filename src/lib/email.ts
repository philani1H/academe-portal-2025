import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = new Resend(resendApiKey);
const defaultFrom = process.env.RESEND_FROM_EMAIL || 'Excellence Academia <notifications@excellenceacademia.com>';

export interface EmailPayload {
  to: string;
  subject: string;
  content: string;
}

export function renderInvitationEmail({ recipientName, actionUrl, courseName, tutorName, department }: { recipientName: string; actionUrl: string; courseName?: string; tutorName?: string; department?: string }) {
  const title = "You're invited to Excellence Academia";
  const message = `
    <p>Hi ${recipientName || 'there'},</p>
    <p>You have been invited to join Excellence Academia. Click the button below to set your password and activate your account.</p>
    ${courseName || tutorName || department ? `
    <div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#334155;">
      ${courseName ? `<div><strong>Course:</strong> ${courseName}</div>` : ''}
      ${tutorName ? `<div><strong>Tutor:</strong> ${tutorName}</div>` : ''}
      ${department ? `<div><strong>Department:</strong> ${department}</div>` : ''}
    </div>` : ''}
    <p style="margin: 24px 0;">
      <a href="${actionUrl}" style="display:inline-block;padding:12px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px">Set Your Password</a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color:#334155; font-size: 12px;">${actionUrl}</p>
  `;
  return renderBrandedEmail({ title, message, footerNote: 'If you did not expect this invitation, you can ignore this email.' });
}

export function renderGenericActionEmail({ title, intro, actionText, actionUrl, courseName, tutorName, department }: { title: string; intro: string; actionText: string; actionUrl: string; courseName?: string; tutorName?: string; department?: string }) {
  const message = `
    <p>${intro}</p>
    ${courseName || tutorName || department ? `
    <div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#334155;">
      ${courseName ? `<div><strong>Course:</strong> ${courseName}</div>` : ''}
      ${tutorName ? `<div><strong>Tutor:</strong> ${tutorName}</div>` : ''}
      ${department ? `<div><strong>Department:</strong> ${department}</div>` : ''}
    </div>` : ''}
    <p style="margin: 24px 0;">
      <a href="${actionUrl}" style="display:inline-block;padding:12px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px">${actionText}</a>
    </p>
    <p style="word-break: break-all; color:#334155; font-size: 12px;">${actionUrl}</p>
  `;
  return renderBrandedEmail({ title, message });
}

export function renderBrandedEmail({ title, message, footerNote }: { title: string; message: string; footerNote?: string }) {
  const brandColor = '#4f46e5';
  const year = new Date().getFullYear();
  const safeFooter = footerNote || 'This is an automated notification. Please do not reply to this email.';
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden;">
        <tr>
          <td style="background:${brandColor}; padding:18px 24px; color:#fff;">
            <h2 style="margin:0; font-size:18px;">Excellence Academia</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h3 style="margin:0 0 8px; font-size:20px; color:#0f172a;">${title}</h3>
            <div style="margin:0 0 16px; line-height:1.6; color:#334155;">${message}</div>
            <div style="margin-top:16px; padding:12px 16px; background:#f1f5f9; border-radius:8px; color:#475569; font-size:12px;">
              ${safeFooter}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px; border-top:1px solid #e2e8f0; color:#64748b; font-size:12px;">
            © ${year} Excellence Academia. All rights reserved.
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const { to, subject, content } = payload;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set; skipping actual email send. Logging payload instead.');
      console.info('[EMAIL]', { to, subject, preview: content.slice(0, 140) + '...' });
      return { success: true, data: { mocked: true } };
    }
    const data = await resend.emails.send({
      from: defaultFrom,
      to: [to],
      subject: subject,
      html: content,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}