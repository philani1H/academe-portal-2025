import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        courses: true,
        enrollments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include additional fields
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      department: user.department,
      specialization: user.specialization,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      joinDate: user.createdAt,
      totalSessions: user.role === 'tutor' ? Math.floor(Math.random() * 100) + 20 : undefined,
      rating: user.role === 'tutor' ? Math.round((Math.random() * 2 + 3) * 10) / 10 : undefined,
      earnings: user.role === 'tutor' ? Math.floor(Math.random() * 5000) + 1000 : undefined,
      progress: user.role === 'student' ? Math.floor(Math.random() * 100) : undefined
    }))

    res.status(200).json(transformedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}