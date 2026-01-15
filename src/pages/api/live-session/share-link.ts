import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail, renderBrandedEmail } from '@/lib/email';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, courseId, courseName, tutorName, emails, personalMessage } = req.body;

    if (!sessionId || !courseId || !emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate session link
    const sessionLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/live-session/${sessionId}?courseId=${courseId}`;

    // Send emails to all recipients
    const emailPromises = emails.map(async (email: string) => {
      const htmlContent = renderBrandedEmail({
        title: `Join Live Session: ${courseName}`,
        intro: `${tutorName} has invited you to join a live session.`,
        content: personalMessage || `You're invited to join an ongoing live session for ${courseName}. Click the button below to join now.`,
        actionText: 'Join Live Session',
        actionUrl: sessionLink,
        highlights: [
          `Course: ${courseName}`,
          `Instructor: ${tutorName}`,
          `Session ID: ${sessionId}`,
        ],
      });

      return sendEmail({
        to: email,
        subject: `Live Session Invitation: ${courseName}`,
        content: htmlContent,
      });
    });

    await Promise.all(emailPromises);

    return res.status(200).json({
      success: true,
      message: `Session link sent to ${emails.length} recipient(s)`,
      sessionLink,
    });
  } catch (error) {
    console.error('Error sharing session link:', error);
    return res.status(500).json({ error: 'Failed to share session link' });
  }
}
