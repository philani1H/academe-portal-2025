import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAssignments(req, res)
      case 'POST':
        return await submitAssignment(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Student assignments API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getAssignments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId, courseId } = req.query

    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'Student ID is required' })
    }

    // Get student's enrolled courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: true,
      },
    })

    const courseIds = enrollments.map((e) => e.courseId)

    // Build where clause for assignments
    const where: any = {
      courseId: { in: courseIds },
    }

    if (courseId && typeof courseId === 'string') {
      where.courseId = courseId
    }

    // Get assignments
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        submissions: {
          where: { userId: studentId },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    // Format assignments with submission status
    const formattedAssignments = assignments.map((assignment) => {
      const submission = assignment.submissions && assignment.submissions.length > 0 ? assignment.submissions[0] : null
      const course = enrollments.find((e) => e.courseId === assignment.courseId)?.course

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        courseId: assignment.courseId,
        courseName: course?.title || 'Unknown Course',
        dueDate: assignment.dueDate.toISOString(),
        maxPoints: assignment.maxPoints,
        attachments: assignment.attachments ? JSON.parse(assignment.attachments) : [],
        status: submission
          ? submission.status
          : new Date(assignment.dueDate) < new Date()
          ? 'overdue'
          : 'pending',
        submission: submission
          ? {
              id: submission.id,
              content: submission.content,
              attachments: submission.attachments ? JSON.parse(submission.attachments) : [],
              score: submission.score,
              feedback: submission.feedback,
              status: submission.status,
              submittedAt: submission.submittedAt.toISOString(),
              gradedAt: submission.gradedAt?.toISOString() || null,
            }
          : null,
      }
    })

    return res.status(200).json(formattedAssignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return res.status(500).json({ error: 'Failed to fetch assignments' })
  }
}

async function submitAssignment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId, assignmentId, content, attachments } = req.body

    if (!studentId || !assignmentId || !content) {
      return res.status(400).json({ error: 'Student ID, assignment ID, and content are required' })
    }

    // Get assignment to check due date
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        userId: studentId,
        assignmentId: assignmentId,
      },
    })

    if (existingSubmission) {
      return res.status(400).json({ error: 'Assignment already submitted' })
    }

    // Determine if submission is late
    const isLate = new Date() > new Date(assignment.dueDate)
    const status = isLate ? 'late' : 'submitted'

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        userId: studentId,
        assignmentId: assignmentId,
        content: content,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: status,
      },
    })

    // Emit real-time update
    const io = (global as any).io
    if (io) {
      // Emit to course room so tutor (and potentially other students if group work) receives it
      // Better to emit to tutor specifically if possible, but course room is okay if tutor is in it
      // Also emit to specific 'assignment-submitted' event
      io.to(`course:${assignment.courseId}`).emit('assignment-submitted', {
        assignmentId,
        courseId: assignment.courseId,
        studentId,
        submission
      })
    }

    return res.status(201).json({
      message: 'Assignment submitted successfully',
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt.toISOString(),
        isLate,
      },
    })
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return res.status(500).json({ error: 'Failed to submit assignment' })
  }
}
