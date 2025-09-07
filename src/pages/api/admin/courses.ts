import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const courses = await prisma.course.findMany({
      include: {
        tutor: {
          select: {
            name: true
          }
        },
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
      department: course.department,
      tutorId: course.tutorId,
      tutorName: course.tutor?.name || 'Unknown Tutor',
      status: course.status,
      students: course.enrollments.length,
      maxStudents: 30, // Default max students
      createdAt: course.createdAt,
      startDate: course.startDate,
      endDate: course.endDate,
      color: course.color,
      price: Math.floor(Math.random() * 500) + 100, // Mock price
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Mock rating
      completionRate: Math.floor(Math.random() * 30) + 70, // Mock completion rate
      revenue: Math.floor(Math.random() * 10000) + 2000 // Mock revenue
    }))

    res.status(200).json(transformedCourses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}