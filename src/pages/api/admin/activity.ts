import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get recent activities from various sources
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    const recentCourses = await prisma.course.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        tutor: {
          select: {
            name: true
          }
        },
        createdAt: true
      }
    })

    // Transform into activity format
    const activities = [
      ...recentUsers.map(user => ({
        id: `user_${user.id}`,
        type: 'user_registration' as const,
        user: user.name,
        description: `New ${user.role} registered: ${user.name}`,
        timestamp: user.createdAt.toISOString(),
        status: 'success' as const
      })),
      ...recentCourses.map(course => ({
        id: `course_${course.id}`,
        type: 'course_creation' as const,
        user: course.tutor?.name || 'Unknown',
        description: `New course created: ${course.name}`,
        timestamp: course.createdAt.toISOString(),
        status: 'success' as const
      }))
    ]

    // Sort by timestamp and take the most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    // Add some mock activities for demonstration
    const mockActivities = [
      {
        id: 'payment_1',
        type: 'payment_received' as const,
        user: 'John Doe',
        description: 'Payment received for Mathematics course',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'success' as const,
        amount: 150
      },
      {
        id: 'session_1',
        type: 'session_completed' as const,
        user: 'Dr. Sarah Wilson',
        description: 'Tutoring session completed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'success' as const
      },
      {
        id: 'content_1',
        type: 'content_update' as const,
        user: 'Admin',
        description: 'Website content updated',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        status: 'success' as const
      }
    ]

    const allActivities = [...sortedActivities, ...mockActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15)

    res.status(200).json(allActivities)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}