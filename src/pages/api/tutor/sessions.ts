import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; role: string };
    if (decoded.role !== 'tutor') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Attach user info to request for handlers to use
    (req as any).user = decoded;

    switch (req.method) {
      case 'GET':
        return await getTutorSessions(req, res);
      case 'POST':
        return await createSession(req, res);
      case 'PUT':
        return await updateSession(req, res);
      case 'DELETE':
        return await deleteSession(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tutor sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTutorSessions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tutorId, date } = req.query;
    const user = (req as any).user;

    if (!tutorId || typeof tutorId !== 'string') {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    // Enforce ownership
    if (parseInt(tutorId) !== user.userId) {
      return res.status(403).json({ error: 'Access denied: You can only view your own sessions' });
    }

    const whereClause: any = {
      tutorId: parseInt(tutorId),
    };

    if (date) {
      const targetDate = new Date(date as string);
      const nextDate = new Date(targetDate);
      nextDate.setDate(targetDate.getDate() + 1);

      whereClause.scheduledAt = {
        gte: targetDate,
        lt: nextDate,
      };
    }

    const sessions = await prisma.scheduledSession.findMany({
      where: whereClause,
      include: {
        course: true,
        // liveSession: true // Include if needed
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // Transform data to match frontend expectations if necessary
    // The frontend seems to expect specific fields like courseName, studentName, etc.
    // Since ScheduledSession is linked to Course (which can have students via CourseEnrollment),
    // mapping "studentName" might be tricky if it's a 1-to-many session.
    // However, the mock data implied 1-on-1 sessions with a specific student.
    // The schema has `courseId` but not `studentId`.
    // We will return the sessions as is, but mapped to a friendly format.

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      courseName: session.course.name,
      // studentName: 'Multiple Students', // Schema doesn't have studentId on ScheduledSession
      date: session.scheduledAt.toISOString(),
      time: session.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: session.duration,
      type: 'Class', // Or derive from course type
      status: session.status,
      title: session.title,
      description: session.description,
      // location: 'Online',
    }));

    return res.status(200).json(formattedSessions);
  } catch (error) {
    console.error('Error fetching tutor sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}

async function createSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tutorId, courseId, date, time, duration, title, description } = req.body;
    const user = (req as any).user;

    if (!tutorId || !courseId || !date || !time || !duration || !title) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Enforce ownership
    if (parseInt(tutorId) !== user.userId) {
      return res.status(403).json({ error: 'Access denied: You can only create sessions for yourself' });
    }

    // Verify course belongs to tutor
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.tutorId !== user.userId) {
      return res.status(403).json({ error: 'Access denied: You can only create sessions for your own courses' });
    }

    // Combine date and time into scheduledAt
    // Assuming date is "YYYY-MM-DD" and time is "HH:MM"
    const scheduledAt = new Date(`${date}T${time}:00`);

    const newSession = await prisma.scheduledSession.create({
      data: {
        title,
        description,
        duration: parseInt(duration),
        status: 'scheduled',
        courseId: parseInt(courseId),
        tutorId: parseInt(tutorId),
        scheduledAt,
      },
    });

    return res.status(201).json({
      message: 'Session created successfully',
      session: newSession,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
}

async function updateSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId, updates } = req.body;
    const user = (req as any).user;

    if (!sessionId || !updates) {
      return res.status(400).json({ error: 'Session ID and updates are required' });
    }

    // Verify session belongs to tutor
    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.tutorId !== user.userId) {
      return res.status(403).json({ error: 'Access denied: You can only update your own sessions' });
    }

    const updatedSession = await prisma.scheduledSession.update({
      where: { id: sessionId },
      data: updates,
    });

    return res.status(200).json({
      message: 'Session updated successfully',
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
}

async function deleteSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId } = req.query;
    const user = (req as any).user;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Verify session belongs to tutor
    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.tutorId !== user.userId) {
      return res.status(403).json({ error: 'Access denied: You can only delete your own sessions' });
    }

    await prisma.scheduledSession.delete({
      where: { id: sessionId },
    });

    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
}