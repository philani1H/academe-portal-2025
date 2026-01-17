import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Try to get user ID from token or query parameter
    let userId: number | null = null;

    // First try JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        userId = decoded.userId;
      } catch (error) {
        console.error('JWT verification failed:', error);
      }
    }

    // Fallback to query parameter
    if (!userId && req.query.studentId) {
      userId = parseInt(req.query.studentId as string);
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - No valid authentication' });
    }

    // Get courses the student is enrolled in
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: true }
    });

    const courseIds = enrollments.map(e => e.courseId);

    if (courseIds.length === 0) {
      return res.status(200).json({ sessions: [] });
    }

    // Get scheduled sessions for enrolled courses
    const sessions = await prisma.scheduledSession.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'scheduled',
        scheduledAt: {
          gte: new Date() // Only future sessions
        }
      },
      include: {
        course: true,
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('Student scheduled sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}