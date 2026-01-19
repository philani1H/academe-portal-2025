import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail, renderBrandedEmail } from '@/lib/email';
import prisma from '@/lib/prisma';

interface ShareSessionRequestBody {
  sessionId: string;
  courseId: string | number;
  courseName?: string;
  tutorName?: string;
  emails: string[];
  personalMessage?: string;
  sessionLink?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      sessionId,
      courseId,
      courseName,
      tutorName,
      emails,
      personalMessage,
      sessionLink: clientSessionLink,
    } = req.body as ShareSessionRequestBody;

    // Validation
    if (!sessionId || !courseId) {
      return res.status(400).json({ error: 'Missing required fields: sessionId and courseId' });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Valid email array is required' });
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid email addresses',
        invalidEmails,
      });
    }

    // Limit number of recipients to prevent abuse
    const MAX_RECIPIENTS = 50;
    if (emails.length > MAX_RECIPIENTS) {
      return res.status(400).json({ 
        error: `Too many recipients. Maximum allowed: ${MAX_RECIPIENTS}`,
      });
    }

    // Fetch course and tutor details if not provided
    const courseIdNum = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    
    let finalCourseName = courseName;
    let finalTutorName = tutorName;

    if (!courseName || !tutorName) {
      const courseData = await prisma.course.findUnique({
        where: { id: courseIdNum },
        select: {
          name: true,
          tutor: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!courseData) {
        return res.status(404).json({ error: 'Course not found' });
      }

      finalCourseName = courseName || courseData.name;
      finalTutorName = tutorName || courseData.tutor.name;
    }

    // Generate session link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
    const sessionLink =
      clientSessionLink && typeof clientSessionLink === 'string' && clientSessionLink.trim().length > 0
        ? clientSessionLink
        : `${baseUrl}/live-session/${sessionId}?courseId=${courseId}`;

    // Validate session link format
    try {
      new URL(sessionLink);
    } catch {
      return res.status(400).json({ error: 'Invalid session link format' });
    }

    // Send emails to all recipients with error tracking
    const emailResults = await Promise.allSettled(
      emails.map(async (email: string) => {
        const htmlContent = renderBrandedEmail({
          title: `Join Live Session: ${finalCourseName}`,
          intro: `${finalTutorName} has invited you to join a live session.`,
          content:
            personalMessage ||
            `You're invited to join an ongoing live session for ${finalCourseName}. Click the button below to join now.`,
          actionText: 'Join Live Session',
          actionUrl: sessionLink,
          highlights: [
            `Course: ${finalCourseName}`,
            `Instructor: ${finalTutorName}`,
            `Session ID: ${sessionId}`,
          ],
        });

        await sendEmail({
          to: email,
          subject: `Live Session Invitation: ${finalCourseName}`,
          content: htmlContent,
        });

        return email;
      })
    );

    // Track successes and failures
    const successful = emailResults.filter(result => result.status === 'fulfilled');
    const failed = emailResults.filter(result => result.status === 'rejected');

    if (failed.length > 0) {
      console.error('Some emails failed to send:', failed);
    }

    // Return appropriate response based on results
    if (successful.length === 0) {
      return res.status(500).json({
        error: 'Failed to send any emails',
        failedCount: failed.length,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Session link sent to ${successful.length} of ${emails.length} recipient(s)`,
      sessionLink,
      stats: {
        total: emails.length,
        successful: successful.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error('Error sharing session link:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to share session link',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
    
    return res.status(500).json({ error: 'Failed to share session link' });
  }
}