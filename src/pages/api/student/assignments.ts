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

    // Generate mock assignments based on courses
    const assignments = []
    const statuses = ['pending', 'in_progress', 'completed', 'late']
    const priorities = ['low', 'medium', 'high']
    const types = ['homework', 'project', 'essay', 'presentation']

    enrollments.forEach((enrollment, courseIndex) => {
      const course = enrollment.course
      const numAssignments = Math.floor(Math.random() * 5) + 3

      for (let i = 0; i < numAssignments; i++) {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1)
        
        const status = statuses[i % statuses.length]
        const isLate = status === 'late' || (status === 'pending' && dueDate < new Date())
        
        assignments.push({
          id: `assignment-${course.id}-${i}`,
          title: `${course.name} Assignment ${i + 1}`,
          description: `Complete the assigned problems and submit your work. This assignment covers chapters ${i + 1} and ${i + 2}.`,
          course: course.name,
          dueDate: dueDate.toISOString(),
          status: isLate ? 'late' : status,
          priority: priorities[i % priorities.length] as 'low' | 'medium' | 'high',
          type: types[i % types.length] as 'homework' | 'project' | 'essay' | 'presentation',
          grade: status === 'completed' ? Math.floor(Math.random() * 30) + 70 : undefined,
          feedback: status === 'completed' ? 'Good work! Make sure to show all your steps clearly.' : undefined,
          materials: [
            'Assignment Instructions.pdf',
            'Practice Problems.pdf',
            'Reference Materials.pdf'
          ],
          instructions: [
            'Read the problem carefully',
            'Show all your work',
            'Submit by the due date',
            'Use proper formatting'
          ]
        })
      }
    })

    // Sort by due date
    assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    res.status(200).json(assignments)
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}