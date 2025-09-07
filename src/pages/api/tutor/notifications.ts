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

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipients: { has: 'tutors' } },
          { recipients: { has: tutorId } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include additional fields
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type as 'session' | 'student' | 'payment' | 'system' | 'reminder',
      priority: notification.priority as 'low' | 'medium' | 'high',
      date: notification.createdAt,
      read: notification.read,
      actionRequired: notification.priority === 'high'
    }))

    // Add some mock notifications for demonstration
    const mockNotifications = [
      {
        id: 'mock-1',
        title: 'New Student Registration',
        message: 'John Doe has registered for your Mathematics course',
        type: 'student' as const,
        priority: 'medium' as const,
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
        actionRequired: false
      },
      {
        id: 'mock-2',
        title: 'Session Reminder',
        message: 'You have a session with Sarah Johnson in 30 minutes',
        type: 'session' as const,
        priority: 'high' as const,
        date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false,
        actionRequired: true
      },
      {
        id: 'mock-3',
        title: 'Payment Received',
        message: 'Payment of $150 received for Mathematics tutoring',
        type: 'payment' as const,
        priority: 'low' as const,
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
        actionRequired: false
      }
    ]

    const allNotifications = [...transformedNotifications, ...mockNotifications]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    res.status(200).json(allNotifications)
  } catch (error) {
    console.error('Error fetching tutor notifications:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}