import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { authenticateJWT, AuthenticatedRequest } from '@/lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await getTests(req as AuthenticatedRequest, res);
        });
      case 'POST':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await createTest(req as AuthenticatedRequest, res);
        });
      case 'PUT':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await updateTest(req as AuthenticatedRequest, res);
        });
      case 'DELETE':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await deleteTest(req as AuthenticatedRequest, res);
        });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tests API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getTests(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { courseId, tutorId } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const where: any = {};
    if (courseId) {
      where.courseId = parseInt(courseId as string);
    }

    // Role-based filtering
    if (userRole === 'tutor') {
        // Tutors can only see tests for their own courses
        where.course = {
            tutorId: userId
        };
        // If tutorId query param is provided, it must match authenticated user
        if (tutorId && parseInt(tutorId as string) !== userId) {
             return res.status(403).json({ success: false, error: 'Access denied: You can only view your own tests' });
        }
    } else if (userRole === 'student') {
        // Students can only see tests for courses they are enrolled in
        where.course = {
            courseEnrollments: {
                some: {
                    userId: userId
                }
            }
        };
    } else if (userRole !== 'admin') {
        // Admins can see all, others (if any) see none
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        course: true,
        questions: true,
        submissions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ success: true, tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tests' });
  }
}

async function createTest(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { title, courseId, questions } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'tutor') {
        return res.status(403).json({ success: false, error: 'Only tutors can create tests' });
    }

    if (!title || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
    });

    if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
    }

    if (course.tutorId !== userId) {
        return res.status(403).json({ success: false, error: 'Access denied: Course does not belong to this tutor' });
    }

    const test = await prisma.test.create({
      data: {
        title,
        courseId: parseInt(courseId),
        questions: {
          create: questions || []
        }
      },
      include: {
        questions: true
      }
    });

    return res.status(201).json({ success: true, test });
  } catch (error) {
    console.error('Error creating test:', error);
    return res.status(500).json({ success: false, error: 'Failed to create test' });
  }
}

async function updateTest(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { id, title, questions } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'tutor') {
        return res.status(403).json({ success: false, error: 'Only tutors can update tests' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Test ID required' });
    }

    // Verify test ownership via course
    const existingTest = await prisma.test.findUnique({
        where: { id },
        include: { course: true }
    });

    if (!existingTest) {
        return res.status(404).json({ success: false, error: 'Test not found' });
    }

    if (existingTest.course.tutorId !== userId) {
        return res.status(403).json({ success: false, error: 'Access denied: You can only update your own tests' });
    }

    const test = await prisma.test.update({
      where: { id },
      data: {
        ...(title && { title }),
      },
      include: {
        questions: true
      }
    });

    return res.status(200).json({ success: true, test });
  } catch (error) {
    console.error('Error updating test:', error);
    return res.status(500).json({ success: false, error: 'Failed to update test' });
  }
}

async function deleteTest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Test ID required' });
    }

    // Delete questions first
    await prisma.testQuestion.deleteMany({
      where: { testId: id as string }
    });

    // Delete test
    await prisma.test.delete({
      where: { id: id as string }
    });

    return res.status(200).json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete test' });
  }
}
