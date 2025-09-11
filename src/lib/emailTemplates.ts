const BRAND_NAME = 'Excellence Academia';
const BRAND_COLOR = '#4f46e5';
const BRAND_SECONDARY = '#0ea5e9';
const BRAND_URL = process.env.FRONTEND_URL || 'https://www.excellenceacademia.co.za';

function escapeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function preheader(text: string): string {
  const t = (text || '').slice(0, 160);
  return `<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(t)}</span>`;
}

function button(label: string, url: string): string {
  const safeLabel = escapeHtml(label || 'Open');
  const safeUrl = url || BRAND_URL;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:auto;">
      <tr>
        <td style="border-radius:8px;background:${BRAND_COLOR};text-align:center;">
          <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:600;font-family:Inter,Segoe UI,Arial,sans-serif;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>`;
}

function baseTemplate(options: {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  preheaderText?: string;
}): string {
  const { title, bodyHtml, ctaLabel, ctaUrl, preheaderText } = options;
  return `
${preheader(preheaderText || title)}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:24px 0;">
  <tr>
    <td>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">
        <tr>
          <td style="padding:20px 24px;background:${BRAND_COLOR};">
            <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">${BRAND_NAME}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 8px 24px;">
            <h1 style="margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:20px;line-height:28px;color:#111827;">${escapeHtml(title)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 24px 24px 24px;">
            <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:14px;line-height:22px;color:#374151;">
              ${bodyHtml}
            </div>
            ${ctaLabel ? `<div style=\"padding-top:20px;\">${button(escapeHtml(ctaLabel), ctaUrl || BRAND_URL)}</div>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #eef2f7;background:#fafbff;">
            <div style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
              You’re receiving this email because you have an account with ${BRAND_NAME}.<br/>
              <span style="color:#9ca3af;">Do not reply to this automated message.</span>
            </div>
          </td>
        </tr>
      </table>
      <div style="max-width:640px;margin:16px auto 0 auto;text-align:center;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;color:#9ca3af;">
        © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
      </div>
    </td>
  </tr>
  <tr>
    <td style="height:24px"></td>
  </tr>
</table>`;
}

export function renderContactAdmin(params: { name: string; email: string; subject?: string; message: string }): string {
  const { name, email, subject, message } = params;
  const body = `
    <p>You have received a new contact form submission.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0;background:#f9fafb;border:1px solid #eef2f7;border-radius:8px;">
      <tr><td style="padding:12px 16px;font-weight:600;color:#111827;">From</td><td style="padding:12px 16px;color:#374151;">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</td></tr>
      ${subject ? `<tr><td style=\"padding:12px 16px;font-weight:600;color:#111827;\">Subject</td><td style=\"padding:12px 16px;color:#374151;\">${escapeHtml(subject)}</td></tr>` : ''}
      <tr><td style="padding:12px 16px;font-weight:600;color:#111827;">Message</td><td style="padding:12px 16px;color:#374151;white-space:pre-line;">${escapeHtml(message)}</td></tr>
    </table>
  `;
  return baseTemplate({ title: 'New Contact Message', bodyHtml: body, preheaderText: `New message from ${name}` });
}

export function renderContactAck(params: { name: string }): string {
  const { name } = params;
  const body = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thanks for reaching out to ${BRAND_NAME}. We’ve received your message and will get back to you shortly.</p>
    <p>If this is urgent, please contact us via the phone number on our website.</p>
  `;
  return baseTemplate({ title: 'We received your message', bodyHtml: body, ctaLabel: 'Visit our website', ctaUrl: BRAND_URL, preheaderText: 'We’ll reply as soon as possible.' });
}

export function renderAdminNotification(params: { subject: string; message: string }): string {
  const { subject, message } = params;
  const body = `
    <p>${escapeHtml(message)}</p>
  `;
  return baseTemplate({ title: subject || 'Announcement', bodyHtml: body, preheaderText: subject });
}

export function renderTutorInvite(params: { name: string; loginUrl?: string }): string {
  const { name, loginUrl } = params;
  const url = loginUrl || `${BRAND_URL}/auth/tutor`;
  const body = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>You’ve been invited to join ${BRAND_NAME} as a tutor. Please sign in to complete your profile and get started.</p>
  `;
  return baseTemplate({ title: 'You have been invited as a Tutor', bodyHtml: body, ctaLabel: 'Sign in as Tutor', ctaUrl: url, preheaderText: 'Complete your tutor profile and start teaching.' });
}

export function renderStudentInvite(params: { studentName: string; tutorName?: string; studentUrl?: string }): string {
  const { studentName, tutorName, studentUrl } = params;
  const url = studentUrl || `${BRAND_URL}/auth/student`;
  const body = `
    <p>Hi ${escapeHtml(studentName)},</p>
    <p>${escapeHtml(tutorName || 'Your tutor')} has invited you to join ${BRAND_NAME}. Create your account to access courses and materials.</p>
  `;
  return baseTemplate({ title: 'Your tutor invited you to join', bodyHtml: body, ctaLabel: 'Create your account', ctaUrl: url, preheaderText: 'Join to access your courses and materials.' });
}

