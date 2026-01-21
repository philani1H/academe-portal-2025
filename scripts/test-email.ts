import 'dotenv/config';
import { sendEmail } from '../src/lib/email.js';

async function main() {
  console.log('Testing SMTP configuration...');
  const testEmail = 'notifications@excellenceakademie.co.za'; // Loopback test
  console.log(`Sending test email to ${testEmail}...`);
  
  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'SMTP Configuration Test',
      content: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #0EA5E9;">SMTP Test Success</h1>
          <p>This email confirms that the SMTP configuration is working correctly.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

main();
