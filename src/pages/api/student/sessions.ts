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

    // Get student's courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            tutor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Generate mock sessions based on courses
    const sessions = []
    const statuses = ['scheduled', 'completed', 'cancelled']
    const types = ['online', 'in-person']
    const times = ['09:00', '10:30', '14:00', '15:30', '17:00', '18:30']

    enrollments.forEach((enrollment, courseIndex) => {
      const course = enrollment.course
      const numSessions = Math.floor(Math.random() * 8) + 5

      for (let i = 0; i < numSessions; i++) {
        const sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() + i)
        
        const status = statuses[i % statuses.length]
        const isCompleted = status === 'completed'
        const isScheduled = status === 'scheduled'
        
        sessions.push({
          id: `session-${course.id}-${i}`,
          course: course.name,
          tutor: course.tutor?.name || 'Unknown Tutor',
          date: sessionDate.toISOString(),
          time: times[i % times.length],
          duration: 60,
          status: status as 'scheduled' | 'completed' | 'cancelled',
          type: types[i % types.length] as 'online' | 'in-person',
          location: types[i % types.length] === 'in-person' ? 'Classroom A' : undefined,
          meetingLink: types[i % types.length] === 'online' ? 'https://meet.google.com/abc-defg-hij' : undefined,
          notes: `Session ${i + 1} notes for ${course.name}`,
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
          outcomes: isCompleted ? [
            'Student showed improvement in problem-solving',
            'Completed all practice problems',
            'Ready for next topic'
          ] : [],
          rating: isCompleted ? Math.round((Math.random() * 2 + 3) * 10) / 10 : undefined,
          feedback: isCompleted ? 'Great session! Student was engaged and asked good questions.' : undefined
        })
      }
    })

    // Sort by date
    sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    res.status(200).json(sessions)
  } catch (error) {
    console.error('Error fetching student sessions:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}