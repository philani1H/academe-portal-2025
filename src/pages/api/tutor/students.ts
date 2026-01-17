import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTutorStudents(req, res);
      case 'POST':
        return await addStudent(req, res);
      case 'PUT':
        return await updateStudent(req, res);
      case 'DELETE':
        return await removeStudent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tutor students API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTutorStudents(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tutorId } = req.query;

    if (!tutorId || typeof tutorId !== 'string') {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    // Get students enrolled in courses taught by this tutor
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        enrollments: {
          some: {
            course: {
              // Assuming we have a tutorId field in Course model
              // For now, we'll get all students
            }
          }
        }
      },
      include: {
        enrollments: {
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
      lastActivity: student.updatedAt.toISOString(),
      status: 'active',
      enrolledCourses: student.enrollments.map(e => e.course.title),
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

async function addStudent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tutorId, studentEmail, courseId } = req.body;

    if (!tutorId || !studentEmail || !courseId) {
      return res.status(400).json({ error: 'Tutor ID, student email, and course ID are required' });
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
      // Verify course exists
      const course = await tx.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Check if already enrolled
      const existingEnrollment = await tx.courseEnrollment.findFirst({
        where: {
          userId: student.id,
          courseId: courseId
        }
      });

      if (existingEnrollment) {
        throw new Error('Student is already enrolled in this course');
      }

      // Create enrollment
      return await tx.courseEnrollment.create({
        data: {
          userId: student.id,
          courseId: courseId,
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
    return res.status(500).json({ error: 'Failed to add student' });
  }
}

async function updateStudent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId, updates } = req.body;

    if (!studentId || !updates) {
      return res.status(400).json({ error: 'Student ID and updates are required' });
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: updates
    });

    return res.status(200).json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ error: 'Failed to update student' });
  }
}

async function removeStudent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId, courseId } = req.query;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and course ID are required' });
    }

    // Remove enrollment
    await prisma.courseEnrollment.deleteMany({
      where: {
        userId: studentId as string,
        courseId: courseId as string
      }
    });

    return res.status(200).json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error removing student:', error);
    return res.status(500).json({ error: 'Failed to remove student' });
  }
}