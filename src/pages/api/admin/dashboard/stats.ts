import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get active users (users with status 'active')
    const activeUsers = await prisma.user.count({
      where: { status: 'active' }
    });

    // Get total courses
    const totalCourses = await prisma.course.count();
    
    // Get active courses
    const activeCourses = await prisma.course.count({
      where: { status: 'active' }
    });

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Get active students
    const activeStudents = await prisma.user.count({
      where: {
        role: 'student',
        status: 'active'
      }
    });

    // Get active tutors
    const activeTutors = await prisma.user.count({
      where: {
        role: 'tutor',
        status: 'active'
      }
    });

    // Get pending approvals (users with status 'pending')
    const pendingApprovals = await prisma.user.count({
      where: { status: 'pending' }
    });

    const stats = {
      totalUsers,
      activeUsers,
      totalCourses,
      activeCourses,
      newUsersToday,
      activeStudents,
      activeTutors,
      pendingApprovals
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}