import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    switch (req.method) {
      case 'GET':
        return await getScheduledSessions(req, res, decoded.userId);
      case 'POST':
        return await createScheduledSession(req, res, decoded.userId);
      case 'PUT':
        return await updateScheduledSession(req, res, decoded.userId);
      case 'DELETE':
        return await deleteScheduledSession(req, res, decoded.userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Scheduled sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getScheduledSessions(req: NextApiRequest, res: NextApiResponse, userId: number) {
  try {
    const { courseId, status } = req.query;

    const where: any = { tutorId: userId };

    if (courseId) {
      where.courseId = parseInt(courseId as string);
    }

    if (status) {
      where.status = status;
    }

    const sessions = await prisma.scheduledSession.findMany({
      where,
      include: {
        course: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error fetching scheduled sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled sessions' });
  }
}

async function createScheduledSession(req: NextApiRequest, res: NextApiResponse, userId: number) {
  try {
    const { courseId, title, description, scheduledAt, duration } = req.body;

    if (!courseId || !title || !scheduledAt || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the user is the tutor for this course
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course || course.tutorId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to schedule sessions for this course' });
    }

    const session = await prisma.scheduledSession.create({
      data: {
        courseId: parseInt(courseId),
        tutorId: userId,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration)
      },
      include: {
        course: true
      }
    });

    return res.status(201).json({ session });
  } catch (error) {
    console.error('Error creating scheduled session:', error);
    return res.status(500).json({ error: 'Failed to create scheduled session' });
  }
}

async function updateScheduledSession(req: NextApiRequest, res: NextApiResponse, userId: number) {
  try {
    const { id, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Verify ownership
    const existingSession = await prisma.scheduledSession.findUnique({
      where: { id }
    });

    if (!existingSession || existingSession.tutorId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this session' });
    }

    const session = await prisma.scheduledSession.update({
      where: { id },
      data: {
        ...updates,
        scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : undefined
      },
      include: {
        course: true
      }
    });

    return res.status(200).json({ session });
  } catch (error) {
    console.error('Error updating scheduled session:', error);
    return res.status(500).json({ error: 'Failed to update scheduled session' });
  }
}

async function deleteScheduledSession(req: NextApiRequest, res: NextApiResponse, userId: number) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Verify ownership
    const existingSession = await prisma.scheduledSession.findUnique({
      where: { id }
    });

    if (!existingSession || existingSession.tutorId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this session' });
    }

    await prisma.scheduledSession.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled session:', error);
    return res.status(500).json({ error: 'Failed to delete scheduled session' });
  }
}