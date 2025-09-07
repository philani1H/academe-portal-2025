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

    // Get total students
    const totalStudents = await prisma.courseEnrollment.count({
      where: {
        course: {
          tutorId: tutorId
        }
      }
    })

    const activeStudents = await prisma.courseEnrollment.count({
      where: {
        course: {
          tutorId: tutorId
        },
        status: 'active'
      }
    })

    // Get total courses
    const totalCourses = await prisma.course.count({
      where: { tutorId: tutorId }
    })

    const activeCourses = await prisma.course.count({
      where: { 
        tutorId: tutorId,
        status: 'active'
      }
    })

    // Mock data for sessions and earnings
    const totalSessions = 245
    const completedSessions = 230
    const totalEarnings = 18500
    const monthlyEarnings = 3200
    const averageRating = 4.8
    const satisfactionRate = 96
    const studentGrowth = 15.2
    const earningsGrowth = 22.5
    const sessionCompletion = 94
    const responseTime = 15 // minutes

    const stats = {
      totalStudents,
      activeStudents,
      totalSessions,
      completedSessions,
      totalEarnings,
      monthlyEarnings,
      averageRating,
      satisfactionRate,
      studentGrowth,
      earningsGrowth,
      sessionCompletion,
      responseTime
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error('Error fetching tutor dashboard stats:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}