import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
function verifyToken(req: NextApiRequest): { userId: number; role: string } | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getEmails(req, res, user);
      case 'POST':
        return await sendEmail(req, res, user);
      case 'PATCH':
        return await updateEmail(req, res, user);
      case 'DELETE':
        return await deleteEmail(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getEmails(req: NextApiRequest, res: NextApiResponse, user: { userId: number; role: string }) {
  const { folder = 'inbox' } = req.query;

  try {
    // Get user email
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true }
    });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    let emails;
    if (folder === 'sent') {
      emails = await prisma.email.findMany({
        where: {
          from: userRecord.email,
          folder: 'sent'
        },
        orderBy: { timestamp: 'desc' }
      });
    } else {
      emails = await prisma.email.findMany({
        where: {
          to: userRecord.email,
          folder: folder as string
        },
        orderBy: { timestamp: 'desc' }
      });
    }

    return res.status(200).json({ emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return res.status(500).json({ error: 'Failed to fetch emails' });
  }
}

async function sendEmail(req: NextApiRequest, res: NextApiResponse, user: { userId: number; role: string }) {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true, name: true }
    });

    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Create email in sent folder for sender
    const sentEmail = await prisma.email.create({
      data: {
        from: sender.email,
        fromName: sender.name,
        to,
        subject,
        body,
        folder: 'sent',
        read: true
      }
    });

    // Create email in inbox for recipient
    const inboxEmail = await prisma.email.create({
      data: {
        from: sender.email,
        fromName: sender.name,
        to,
        subject,
        body,
        folder: 'inbox',
        read: false
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      email: sentEmail 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

async function updateEmail(req: NextApiRequest, res: NextApiResponse, user: { userId: number; role: string }) {
  const { id } = req.query;
  const { read, starred, folder } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Email ID required' });
  }

  try {
    const email = await prisma.email.update({
      where: { id: id as string },
      data: {
        ...(typeof read === 'boolean' && { read }),
        ...(typeof starred === 'boolean' && { starred }),
        ...(folder && { folder })
      }
    });

    return res.status(200).json({ success: true, email });
  } catch (error) {
    console.error('Error updating email:', error);
    return res.status(500).json({ error: 'Failed to update email' });
  }
}

async function deleteEmail(req: NextApiRequest, res: NextApiResponse, user: { userId: number; role: string }) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Email ID required' });
  }

  try {
    // Move to trash instead of deleting
    await prisma.email.update({
      where: { id: id as string },
      data: { folder: 'trash' }
    });

    return res.status(200).json({ success: true, message: 'Email moved to trash' });
  } catch (error) {
    console.error('Error deleting email:', error);
    return res.status(500).json({ error: 'Failed to delete email' });
  }
}
