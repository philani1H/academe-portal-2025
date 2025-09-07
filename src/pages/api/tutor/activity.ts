import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get tutor ID from query or auth (mock for now)
    const tutorId = req.query.tutorId as string || 'tutor-1'

    // Get recent course enrollments
    const recentEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        course: {
          tutorId: tutorId
        }
      },
      include: {
        user: true,
        course: true
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform into activity format
    const activities = recentEnrollments.map(enrollment => ({
      id: `enrollment_${enrollment.id}`,
      type: 'student_registered' as const,
      description: `New student ${enrollment.user.name} registered for ${enrollment.course.name}`,
      timestamp: enrollment.createdAt.toISOString(),
      student: enrollment.user.name
    }))

    // Add some mock activities for demonstration
    const mockActivities = [
      {
        id: 'session_1',
        type: 'session_completed' as const,
        description: 'Completed tutoring session with Sarah Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        student: 'Sarah Johnson'
      },
      {
        id: 'payment_1',
        type: 'payment_received' as const,
        description: 'Received payment for Mathematics tutoring',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        amount: 150
      },
      {
        id: 'rating_1',
        type: 'rating_received' as const,
        description: 'Received 5-star rating from John Doe',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        student: 'John Doe',
        rating: 5
      },
      {
        id: 'message_1',
        type: 'message_received' as const,
        description: 'Received message from student about upcoming exam',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        student: 'Emily Chen'
      }
    ]

    const allActivities = [...activities, ...mockActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    res.status(200).json(allActivities)
  } catch (error) {
    console.error('Error fetching tutor activity:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}