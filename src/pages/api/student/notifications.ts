import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get student ID from query or auth (mock for now)
    const studentId = req.query.studentId as string || 'student-1'

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipients: { has: 'students' } },
          { recipients: { has: studentId } }
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
      type: notification.type as 'assignment' | 'test' | 'session' | 'grade' | 'announcement',
      priority: notification.priority as 'low' | 'medium' | 'high',
      date: notification.createdAt,
      read: notification.read,
      actionRequired: notification.priority === 'high'
    }))

    // Add some mock notifications for demonstration
    const mockNotifications = [
      {
        id: 'mock-1',
        title: 'New Assignment Posted',
        message: 'Mathematics Assignment 3 has been posted. Due date: March 15, 2024',
        type: 'assignment' as const,
        priority: 'medium' as const,
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
        actionRequired: false
      },
      {
        id: 'mock-2',
        title: 'Test Reminder',
        message: 'Physics Test 2 is scheduled for tomorrow at 10:00 AM',
        type: 'test' as const,
        priority: 'high' as const,
        date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false,
        actionRequired: true
      },
      {
        id: 'mock-3',
        title: 'Grade Posted',
        message: 'Your grade for Mathematics Assignment 2 has been posted: 85%',
        type: 'grade' as const,
        priority: 'low' as const,
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
        actionRequired: false
      },
      {
        id: 'mock-4',
        title: 'Session Scheduled',
        message: 'Your tutoring session with Dr. Sarah Wilson is scheduled for tomorrow at 2:00 PM',
        type: 'session' as const,
        priority: 'medium' as const,
        date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        read: false,
        actionRequired: false
      },
      {
        id: 'mock-5',
        title: 'Course Announcement',
        message: 'Office hours for Mathematics have been changed to Tuesday 3:00-5:00 PM',
        type: 'announcement' as const,
        priority: 'low' as const,
        date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        read: true,
        actionRequired: false
      }
    ]

    const allNotifications = [...transformedNotifications, ...mockNotifications]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    res.status(200).json(allNotifications)
  } catch (error) {
    console.error('Error fetching student notifications:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}