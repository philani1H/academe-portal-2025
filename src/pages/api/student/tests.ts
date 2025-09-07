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
        course: true
      }
    })

    // Generate mock tests based on courses
    const tests = []
    const statuses = ['upcoming', 'in_progress', 'completed', 'missed']
    const topics = [
      ['Algebra', 'Geometry', 'Trigonometry'],
      ['Physics', 'Chemistry', 'Biology'],
      ['Literature', 'Writing', 'Grammar'],
      ['History', 'Geography', 'Civics']
    ]

    enrollments.forEach((enrollment, courseIndex) => {
      const course = enrollment.course
      const numTests = Math.floor(Math.random() * 4) + 2

      for (let i = 0; i < numTests; i++) {
        const testDate = new Date()
        testDate.setDate(testDate.getDate() + Math.floor(Math.random() * 30) + 1)
        
        const status = statuses[i % statuses.length]
        const isUpcoming = status === 'upcoming'
        const isInProgress = status === 'in_progress'
        const isCompleted = status === 'completed'
        
        tests.push({
          id: `test-${course.id}-${i}`,
          title: `${course.name} Test ${i + 1}`,
          course: course.name,
          date: testDate.toISOString(),
          duration: 90, // 90 minutes
          status: status as 'upcoming' | 'in_progress' | 'completed' | 'missed',
          score: isCompleted ? Math.floor(Math.random() * 30) + 70 : undefined,
          totalQuestions: 25,
          answeredQuestions: isInProgress ? Math.floor(Math.random() * 25) : (isCompleted ? 25 : 0),
          timeRemaining: isInProgress ? Math.floor(Math.random() * 90) : undefined,
          instructions: [
            'Read all questions carefully',
            'Show all your work',
            'Use a calculator if needed',
            'Submit when finished'
          ],
          topics: topics[courseIndex % topics.length] || ['General Topics']
        })
      }
    })

    // Sort by date
    tests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    res.status(200).json(tests)
  } catch (error) {
    console.error('Error fetching student tests:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}