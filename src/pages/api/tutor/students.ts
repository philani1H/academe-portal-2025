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

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        course: {
          tutorId: tutorId
        }
      },
      include: {
        user: true,
        course: true
      }
    })

    // Transform the data to include additional fields
    const students = enrollments.map(enrollment => ({
      id: enrollment.user.id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      avatar: enrollment.user.avatar,
      course: enrollment.course.name,
      progress: Math.floor(Math.random() * 100),
      lastSession: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextSession: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalSessions: Math.floor(Math.random() * 20) + 5,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      status: enrollment.status as "active" | "inactive" | "pending",
      phone: enrollment.user.phone,
      location: enrollment.user.location,
      goals: [
        "Improve problem-solving skills",
        "Master advanced concepts",
        "Prepare for exams"
      ],
      strengths: [
        "Strong analytical thinking",
        "Good work ethic",
        "Asks thoughtful questions"
      ],
      areasForImprovement: [
        "Time management",
        "Complex problem solving",
        "Exam strategies"
      ],
      notes: "Dedicated student with great potential. Shows consistent improvement in problem-solving skills."
    }))

    res.status(200).json(students)
  } catch (error) {
    console.error('Error fetching tutor students:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}