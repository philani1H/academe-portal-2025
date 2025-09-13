import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = new Resend(resendApiKey);
const defaultFrom = process.env.RESEND_FROM_EMAIL || 'Excellence Academia <notifications@excellenceacademia.com>';

export interface EmailPayload {
  to: string;
  subject: string;
  content: string;
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