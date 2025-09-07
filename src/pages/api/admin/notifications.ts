import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include additional fields
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      date: notification.createdAt,
      type: notification.type,
      status: notification.status,
      recipients: {
        tutors: notification.recipients.includes('tutors'),
        students: notification.recipients.includes('students'),
        specific: notification.recipients.filter(r => r !== 'tutors' && r !== 'students')
      },
      priority: notification.priority,
      read: notification.read
    }))

    res.status(200).json(transformedNotifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}