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

    const courses = await prisma.course.findMany({
      where: { tutorId: tutorId },
      include: {
        enrollments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include additional fields
    const transformedCourses = courses.map(course => ({
      id: course.id,
      name: course.name,
      description: course.description,
      subject: course.department,
      level: 'Intermediate', // Mock level
      students: course.enrollments.length,
      maxStudents: 30,
      status: course.status as 'active' | 'inactive' | 'completed',
      startDate: course.startDate,
      endDate: course.endDate,
      price: Math.floor(Math.random() * 500) + 100,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      completionRate: Math.floor(Math.random() * 30) + 70,
      materials: [
        'Course Textbook',
        'Practice Worksheets',
        'Video Lectures',
        'Assignment Templates'
      ],
      assignments: Math.floor(Math.random() * 10) + 5,
      tests: Math.floor(Math.random() * 5) + 2
    }))

    res.status(200).json(transformedCourses)
  } catch (error) {
    console.error('Error fetching tutor courses:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}