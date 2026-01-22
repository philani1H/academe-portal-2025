import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { authenticateJWT, AuthenticatedRequest } from '@/lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await getCourses(req as AuthenticatedRequest, res);
        });
      case 'PUT':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await updateCourse(req as AuthenticatedRequest, res);
        });
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Tutor courses API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getCourses(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { tutorId } = req.query
    const authenticatedTutorId = req.user.userId;

    if (tutorId && parseInt(tutorId as string) !== authenticatedTutorId) {
        return res.status(403).json({ error: 'Access denied: You can only view your own courses' });
    }

    // Get all courses (in a real app, filter by tutor)
    const courses = await prisma.course.findMany({
      where: {
        tutorId: authenticatedTutorId
      },
      include: {
        materials: {
          orderBy: { order: 'asc' },
        },
        tests: {
          include: {
            questions: true,
            submissions: true,
          },
        },
        courseEnrollments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      title: course.name,
      description: course.description,
      category: course.category,
      status: 'active', // Default status as it's not in schema
      startDate: course.createdAt?.toISOString(),
      endDate: course.updatedAt?.toISOString(),
      color: 'blue', // Default color
      studentsCount: course.courseEnrollments.length,
      materialsCount: course.materials.length,
      testsCount: course.tests.length,
      materials: course.materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        url: m.url,
        size: m.size,
        order: m.order,
        createdAt: m.createdAt.toISOString(),
      })),
      tests: course.tests.map((t) => ({
        id: t.id,
        title: t.title,
        questionsCount: t.questions.length,
        submissionsCount: t.submissions.length,
      })),
    }))

    return res.status(200).json(formattedCourses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return res.status(500).json({ error: 'Failed to fetch courses' })
  }
}

async function updateCourse(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { courseId, title, description, category, status, startDate, endDate, color } = req.body
    const authenticatedTutorId = req.user.userId;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    if (course.tutorId !== authenticatedTutorId) {
        return res.status(403).json({ error: 'Access denied: You can only update your own courses' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(color && { color }),
      },
    })

    return res.status(200).json({
      message: 'Course updated successfully',
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        category: updatedCourse.category,
        status: updatedCourse.status,
        startDate: updatedCourse.startDate?.toISOString(),
        endDate: updatedCourse.endDate?.toISOString(),
        color: updatedCourse.color,
      },
    })
  } catch (error) {
    console.error('Error updating course:', error)
    return res.status(500).json({ error: 'Failed to update course' })
  }
}
