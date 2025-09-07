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
        enrollments: {
          include: {
            user: true
          }
        }
      }
    })

    // Generate mock sessions based on courses and students
    const sessions = []
    const statuses = ['scheduled', 'completed', 'cancelled', 'rescheduled']
    const types = ['online', 'in-person']
    const times = ['09:00', '10:30', '14:00', '15:30', '17:00', '18:30']

    courses.forEach(course => {
      course.enrollments.forEach((enrollment, index) => {
        const sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() + index)
        
        sessions.push({
          id: `session-${course.id}-${enrollment.user.id}-${index}`,
          studentId: enrollment.user.id,
          studentName: enrollment.user.name,
          course: course.name,
          date: sessionDate.toISOString(),
          time: times[index % times.length],
          duration: 60,
          status: statuses[index % statuses.length] as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
          type: types[index % types.length] as 'online' | 'in-person',
          location: types[index % types.length] === 'in-person' ? 'Classroom A' : undefined,
          meetingLink: types[index % types.length] === 'online' ? 'https://meet.google.com/abc-defg-hij' : undefined,
          notes: `Session ${index + 1} notes for ${enrollment.user.name}`,
          materials: [
            'Chapter 5: Advanced Algebra',
            'Practice Problems Set 3',
            'Previous Exam Solutions'
          ],
          objectives: [
            'Review quadratic equations',
            'Practice word problems',
            'Prepare for upcoming test'
          ],
          outcomes: statuses[index % statuses.length] === 'completed' ? [
            'Student showed improvement in problem-solving',
            'Completed all practice problems',
            'Ready for next topic'
          ] : [],
          rating: statuses[index % statuses.length] === 'completed' ? Math.round((Math.random() * 2 + 3) * 10) / 10 : undefined,
          feedback: statuses[index % statuses.length] === 'completed' ? 'Great session! Student was engaged and asked good questions.' : undefined
        })
      })
    })

    // Sort by date
    sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    res.status(200).json(sessions)
  } catch (error) {
    console.error('Error fetching tutor sessions:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}