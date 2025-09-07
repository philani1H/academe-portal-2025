import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get total users
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: { status: 'active' }
    })

    // Get total courses
    const totalCourses = await prisma.course.count()
    const activeCourses = await prisma.course.count({
      where: { status: 'active' }
    })

    // Get total sessions (mock data for now)
    const totalSessions = 1250
    const completedSessions = 1180

    // Get average rating (mock data for now)
    const averageRating = 4.7
    const satisfactionRate = 94

    // Calculate growth percentages (mock data for now)
    const userGrowth = 12.5
    const revenueGrowth = 18.3
    const courseCompletion = 87
    const tutorPerformance = 92

    // Calculate revenue (mock data for now)
    const totalRevenue = 125000
    const monthlyRevenue = 18500

    const stats = {
      totalUsers,
      activeUsers,
      totalRevenue,
      monthlyRevenue,
      totalCourses,
      activeCourses,
      totalSessions,
      completedSessions,
      averageRating,
      satisfactionRate,
      userGrowth,
      revenueGrowth,
      courseCompletion,
      tutorPerformance
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}