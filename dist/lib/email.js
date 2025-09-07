import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendEmail(payload) {
    try {
        const { to, subject, content } = payload;
        const data = await resend.emails.send({
            from: 'Excellence Academia <notifications@excellenceacademia.com>',
            to: [to],
            subject: subject,
            html: content,
        });
        return { success: true, data };
    }
    catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}
