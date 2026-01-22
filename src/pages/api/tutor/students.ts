import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';


import { authenticateJWT, AuthenticatedRequest } from '@/lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await getTutorStudents(req as AuthenticatedRequest, res);
        });
      case 'POST':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await addStudent(req as AuthenticatedRequest, res);
        });
      case 'PUT':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await updateStudent(req as AuthenticatedRequest, res);
        });
      case 'DELETE':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await removeStudent(req as AuthenticatedRequest, res);
        });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tutor students API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTutorStudents(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { tutorId } = req.query;

    if (!tutorId || typeof tutorId !== 'string') {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    const parsedTutorId = parseInt(tutorId);
    if (isNaN(parsedTutorId)) {
        return res.status(400).json({ error: 'Invalid Tutor ID' });
    }

    // Security check: Ensure the authenticated user is accessing their own students
    if (req.user.userId !== parsedTutorId) {
        return res.status(403).json({ error: 'Access denied: You can only view your own students' });
    }

    // Get students enrolled in courses taught by this tutor
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        courseEnrollments: {
          some: {
            course: {
              tutorId: parsedTutorId
            }
          }
        }
      },
      include: {
        courseEnrollments: {
          include: {
            course: true
          }
        },
        testSubmissions: {
          include: {
            test: true
          }
        }
      }
    });

    const formattedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      progress: Math.floor(Math.random() * 100), // Mock progress
      lastActivity: student.updatedAt?.toISOString() || new Date().toISOString(),
      status: 'active',
      enrolledCourses: student.courseEnrollments.map(e => e.course.name),
      avatar: `https://ui-avatars.com/api/?name=${student.name}&background=random`,
      grades: student.testSubmissions.reduce((acc, submission) => {
        acc[submission.test.title] = submission.score;
        return acc;
      }, {} as Record<string, number>),
      totalSessions: Math.floor(Math.random() * 20) + 5, // Mock data
      nextSession: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    return res.status(200).json(formattedStudents);
  } catch (error) {
    console.error('Error fetching tutor students:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
}

async function addStudent(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { studentEmail, courseId } = req.body;
    // tutorId is ignored from body, we use authenticated user's ID
    const tutorId = req.user.userId;

    if (!studentEmail || !courseId) {
      return res.status(400).json({ error: 'Student email and course ID are required' });
    }

    // Find student by email
    const student = await prisma.user.findUnique({
      where: { email: studentEmail }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Use transaction to prevent race condition
    const enrollment = await prisma.$transaction(async (tx) => {
      // Verify course exists and belongs to tutor
      const course = await tx.course.findUnique({
        where: { id: parseInt(courseId) }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.tutorId !== tutorId) {
        throw new Error('Course does not belong to this tutor');
      }

      // Check if already enrolled
      const existingEnrollment = await tx.courseEnrollment.findFirst({
        where: {
          userId: student.id,
          courseId: parseInt(courseId)
        }
      });

      if (existingEnrollment) {
        throw new Error('Student is already enrolled in this course');
      }

      // Create enrollment
      return await tx.courseEnrollment.create({
        data: {
          userId: student.id,
          courseId: parseInt(courseId),
          status: 'enrolled'
        },
        include: {
          user: true,
          course: true
        }
      });
    });

    return res.status(201).json({
      message: 'Student added successfully',
      enrollment
    });
  } catch (error: any) {
    console.error('Error adding student:', error);
    if (error.message === 'Course not found') {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (error.message === 'Student is already enrolled in this course') {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }
    if (error.message === 'Course does not belong to this tutor') {
      return res.status(403).json({ error: 'Access denied: Course does not belong to this tutor' });
    }
    return res.status(500).json({ error: 'Failed to add student' });
  }
}

async function updateStudent(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { studentId, updates } = req.body;
    const tutorId = req.user.userId;

    if (!studentId || !updates) {
      return res.status(400).json({ error: 'Student ID and updates are required' });
    }

    // Security check: Ensure student is enrolled in at least one of the tutor's courses
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: parseInt(studentId),
        course: {
          tutorId: tutorId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Access denied: You can only update students enrolled in your courses' });
    }

    // Prevent updating sensitive fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.email;
    delete safeUpdates.password;
    delete safeUpdates.role;
    delete safeUpdates.createdAt;
    delete safeUpdates.updatedAt;

    const updatedStudent = await prisma.user.update({
      where: { id: parseInt(studentId) },
      data: safeUpdates
    });

    return res.status(200).json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ error: 'Failed to update student' });
  }
}

async function removeStudent(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { studentId, courseId } = req.query;
    const tutorId = req.user.userId;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and course ID are required' });
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId as string) }
    });
    
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    if (course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied: Course does not belong to this tutor' });
    }

    // Remove enrollment
    await prisma.courseEnrollment.deleteMany({
      where: {
        userId: parseInt(studentId as string),
        courseId: parseInt(courseId as string)
      }
    });

    return res.status(200).json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error removing student:', error);
    return res.status(500).json({ error: 'Failed to remove student' });
  }
}