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

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            tutor: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    // Transform the data to include additional fields
    const courses = enrollments.map(enrollment => ({
      id: enrollment.course.id,
      name: enrollment.course.name,
      description: enrollment.course.description,
      subject: enrollment.course.department,
      level: 'Intermediate', // Mock level
      tutor: enrollment.course.tutor?.name || 'Unknown Tutor',
      tutorAvatar: enrollment.course.tutor?.avatar,
      progress: Math.floor(Math.random() * 100),
      status: enrollment.status as 'active' | 'completed' | 'paused',
      startDate: enrollment.course.startDate,
      endDate: enrollment.course.endDate,
      nextSession: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalSessions: Math.floor(Math.random() * 20) + 10,
      completedSessions: Math.floor(Math.random() * 15) + 5,
      assignments: Math.floor(Math.random() * 10) + 5,
      completedAssignments: Math.floor(Math.random() * 8) + 3,
      tests: Math.floor(Math.random() * 5) + 2,
      completedTests: Math.floor(Math.random() * 3) + 1,
      grade: Math.floor(Math.random() * 30) + 70,
      color: enrollment.course.color,
      materials: [
        'Course Textbook',
        'Practice Worksheets',
        'Video Lectures',
        'Assignment Templates'
      ],
      announcements: [
        'Midterm exam scheduled for next week',
        'New assignment posted',
        'Office hours changed to Tuesday'
      ]
    }))

    res.status(200).json(courses)
  } catch (error) {
    console.error('Error fetching student courses:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}