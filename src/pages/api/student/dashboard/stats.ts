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

    // Get total courses
    const totalCourses = await prisma.courseEnrollment.count({
      where: { userId: studentId }
    })

    const activeCourses = await prisma.courseEnrollment.count({
      where: { 
        userId: studentId,
        status: 'active'
      }
    })

    const completedCourses = await prisma.courseEnrollment.count({
      where: { 
        userId: studentId,
        status: 'completed'
      }
    })

    // Mock data for other stats
    const totalSessions = 45
    const completedSessions = 42
    const averageGrade = 87
    const improvementRate = 12.5
    const studyHours = 28
    const weeklyGoal = 35
    const streak = 7
    const achievements = 15
    const nextExam = "Mathematics Final Exam"
    const overallProgress = 78

    const stats = {
      totalCourses,
      activeCourses,
      completedCourses,
      totalSessions,
      completedSessions,
      averageGrade,
      improvementRate,
      studyHours,
      weeklyGoal,
      streak,
      achievements,
      nextExam,
      overallProgress
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error('Error fetching student dashboard stats:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}