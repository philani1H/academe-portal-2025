import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { sendEmail, renderBrandedEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(req: NextApiRequest): { userId: number; role: string; name: string } | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { students, subject, body, emailType, template } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'No students selected' });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true, name: true, role: true }
    });

    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const student of students) {
      try {
        let recipientEmail: string;
        let shouldSendExternal = false;

        if (emailType === 'external') {
          // For external emails (updates, newsletters), use personal email
          recipientEmail = student.personalEmail || student.email;
          shouldSendExternal = true;
        } else {
          // For internal mailbox communication
          recipientEmail = student.email;
        }

        // Replace placeholders
        let personalizedSubject = subject
          .replace(/\[Student Name\]/g, student.name)
          .replace(/\[Course Name\]/g, student.course || 'Your Course')
          .replace(/\[Tutor Name\]/g, sender.name);

        let personalizedBody = body
          .replace(/\[Student Name\]/g, student.name)
          .replace(/\[Course Name\]/g, student.course || 'Your Course')
          .replace(/\[Tutor Name\]/g, sender.name)
          .replace(/\[Date\]/g, new Date().toLocaleDateString())
          .replace(/\[Time\]/g, new Date().toLocaleTimeString());

        if (shouldSendExternal) {
          // Send via Brevo to personal email
          const htmlContent = renderBrandedEmail({
            title: personalizedSubject,
            intro: `Dear ${student.name},`,
            content: personalizedBody,
            highlights: [
              `From: ${sender.name}`,
              `Role: ${sender.role === 'admin' ? 'Administrator' : 'Tutor'}`,
            ]
          });

          await sendEmail({
            to: recipientEmail,
            subject: personalizedSubject,
            content: htmlContent,
            fromEmail: process.env.BREVO_FROM_EMAIL,
            fromName: sender.name
          });
        } else {
          // Save to internal mailbox (database)
          // Create in sent folder for sender
          await prisma.email.create({
            data: {
              from: sender.email,
              fromName: sender.name,
              to: recipientEmail,
              subject: personalizedSubject,
              body: personalizedBody,
              folder: 'sent',
              read: true
            }
          });

          // Create in inbox for recipient
          await prisma.email.create({
            data: {
              from: sender.email,
              fromName: sender.name,
              to: recipientEmail,
              subject: personalizedSubject,
              body: personalizedBody,
              folder: 'inbox',
              read: false
            }
          });
        }

        results.sent++;
      } catch (error) {
        console.error(`Failed to send email to ${student.name}:`, error);
        results.failed++;
        results.errors.push(`${student.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sent ${results.sent} email(s), ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk email send error:', error);
    return res.status(500).json({ error: 'Failed to send bulk emails' });
  }
}
