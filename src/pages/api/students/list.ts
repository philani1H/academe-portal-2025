import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(req: NextApiRequest): { userId: number; role: string } | null {
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only admins and tutors can access student list
  if (user.role !== 'admin' && user.role !== 'tutor') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    let students;

    if (user.role === 'tutor') {
      // Tutors can only see students in their courses
      const tutorCourses = await prisma.course.findMany({
        where: { tutorId: user.userId },
        select: { id: true, name: true }
      });

      const courseIds = tutorCourses.map(c => c.id);

      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          courseId: { in: courseIds },
          status: 'enrolled'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              personalEmail: true
            }
          },
          course: {
            select: {
              name: true
            }
          }
        }
      });

      students = enrollments.map(e => ({
        id: e.user.id.toString(),
        name: e.user.name,
        email: e.user.email,
        personalEmail: e.user.personalEmail,
        course: e.course.name
      }));
    } else {
      // Admins can see all students
      const allStudents = await prisma.user.findMany({
        where: { role: 'student' },
        select: {
          id: true,
          name: true,
          email: true,
          personalEmail: true,
          courseEnrollments: {
            include: {
              course: {
                select: { name: true }
              }
            }
          }
        }
      });

      students = allStudents.map(s => ({
        id: s.id.toString(),
        name: s.name,
        email: s.email,
        personalEmail: s.personalEmail,
        course: s.courseEnrollments[0]?.course.name || 'No course'
      }));
    }

    return res.status(200).json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
}
