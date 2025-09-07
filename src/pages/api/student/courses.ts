import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getStudentCourses(req, res);
      case 'POST':
        return await enrollInCourse(req, res);
      case 'DELETE':
        return await unenrollFromCourse(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Student courses API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStudentCourses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId } = req.query;

    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Get student's enrolled courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            tests: {
              include: {
                submissions: {
                  where: { userId: studentId }
                }
              }
            }
          }
        }
      }
    });

    // Get all available courses for enrollment
    const allCourses = await prisma.course.findMany({
      include: {
        enrollments: {
          where: { userId: studentId }
        }
      }
    });

    const enrolledCourses = enrollments.map(enrollment => {
      const course = enrollment.course;
      const courseTests = course.tests || [];
      const completedTests = courseTests.filter(test => 
        test.submissions && test.submissions.length > 0
      );
      
      return {
        id: course.id,
        name: course.title,
        description: course.description,
        tutor: 'Dr. Smith', // Mock tutor name
        tutorEmail: 'dr.smith@example.com',
        nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        progress: courseTests.length > 0 ? (completedTests.length / courseTests.length) * 100 : 0,
        materials: [
          {
            id: '1',
            name: 'Course Syllabus',
            type: 'pdf',
            url: '/materials/syllabus.pdf',
            dateAdded: new Date().toISOString(),
            completed: true,
            description: 'Course overview and requirements'
          },
          {
            id: '2',
            name: 'Lecture Notes - Chapter 1',
            type: 'pdf',
            url: '/materials/lecture-1.pdf',
            dateAdded: new Date().toISOString(),
            completed: false,
            description: 'Introduction to the subject'
          },
          {
            id: '3',
            name: 'Video Lecture - Basics',
            type: 'video',
            url: '/videos/basics.mp4',
            dateAdded: new Date().toISOString(),
            completed: false,
            description: 'Fundamental concepts explained'
          }
        ],
        tests: courseTests.map(test => ({
          id: test.id,
          title: test.title,
          description: 'Test covering key concepts',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          questions: 10,
          totalPoints: 100,
          status: test.submissions && test.submissions.length > 0 ? 'completed' : 'upcoming',
          score: test.submissions && test.submissions.length > 0 ? test.submissions[0].score : null,
          timeLimit: 60 // minutes
        })),
        color: 'blue',
        announcements: [
          {
            id: '1',
            title: 'Important: Midterm Exam Next Week',
            content: 'Please prepare for the midterm exam scheduled for next Tuesday.',
            date: new Date().toISOString(),
            type: 'info'
          },
          {
            id: '2',
            title: 'Assignment Due Date Extended',
            content: 'The assignment due date has been extended by 2 days.',
            date: new Date().toISOString(),
            type: 'success'
          }
        ],
        grade: testSubmissions.length > 0 
          ? testSubmissions.reduce((sum, submission) => sum + submission.score, 0) / testSubmissions.length
          : null,
        enrollmentDate: enrollment.createdAt.toISOString(),
        status: enrollment.status
      };
    });

    const availableCourses = allCourses
      .filter(course => !course.enrollments.length)
      .map(course => ({
        id: course.id,
        name: course.title,
        description: course.description,
        tutor: 'Dr. Smith', // Mock tutor name
        tutorEmail: 'dr.smith@example.com',
        color: 'gray',
        enrollmentDate: null,
        status: 'available'
      }));

    return res.status(200).json({
      enrolled: enrolledCourses,
      available: availableCourses
    });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

async function enrollInCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and course ID are required' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: studentId,
        courseId: courseId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: studentId,
        courseId: courseId,
        status: 'enrolled'
      },
      include: {
        course: true
      }
    });

    return res.status(201).json({
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return res.status(500).json({ error: 'Failed to enroll in course' });
  }
}

async function unenrollFromCourse(req: NextApiRequest, res: NextApiResponse) {
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

    return res.status(200).json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    return res.status(500).json({ error: 'Failed to unenroll from course' });
  }
}