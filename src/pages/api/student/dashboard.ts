import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getStudentDashboard(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Student dashboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStudentDashboard(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId } = req.query;

    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Get student information
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
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

    // Get student's test submissions
    const testSubmissions = await prisma.testSubmission.findMany({
      where: { userId: studentId },
      include: {
        test: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: studentId },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Calculate dashboard statistics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const activeCourses = enrollments.filter(e => e.status === 'enrolled').length;
    const averageGrade = testSubmissions.length > 0 
      ? testSubmissions.reduce((sum, submission) => sum + submission.score, 0) / testSubmissions.length
      : 0;

    // Get upcoming sessions (mock data for now)
    const upcomingSessions = [
      {
        id: '1',
        courseName: 'Mathematics Grade 12',
        tutorName: 'Dr. Smith',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00 AM',
        duration: '60 minutes',
        type: '1-on-1',
        location: 'Online'
      },
      {
        id: '2',
        courseName: 'Physics Grade 11',
        tutorName: 'Prof. Johnson',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: '2:00 PM',
        duration: '90 minutes',
        type: 'Group',
        location: 'Online'
      }
    ];

    // Get recent activities (mock data for now)
    const recentActivities = [
      {
        id: '1',
        type: 'assignment_submitted',
        message: 'Submitted Mathematics assignment',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        courseName: 'Mathematics Grade 12'
      },
      {
        id: '2',
        type: 'test_completed',
        message: 'Completed Physics test - Score: 85%',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        courseName: 'Physics Grade 11'
      }
    ];

    // Format courses with progress and materials
    const courses = enrollments.map(enrollment => {
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
            completed: true
          },
          {
            id: '2',
            name: 'Lecture Notes - Chapter 1',
            type: 'pdf',
            url: '/materials/lecture-1.pdf',
            dateAdded: new Date().toISOString(),
            completed: false
          }
        ],
        tests: courseTests.map(test => ({
          id: test.id,
          title: test.title,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          questions: 10, // Mock data
          totalPoints: 100,
          status: test.submissions && test.submissions.length > 0 ? 'completed' : 'upcoming',
          score: test.submissions && test.submissions.length > 0 ? test.submissions[0].score : null
        })),
        color: 'blue',
        announcements: [
          {
            id: '1',
            title: 'Important: Midterm Exam Next Week',
            content: 'Please prepare for the midterm exam scheduled for next Tuesday.',
            date: new Date().toISOString(),
            type: 'info'
          }
        ],
        grade: averageGrade
      };
    });

    const dashboardData = {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: `https://ui-avatars.com/api/?name=${student.name}&background=random`
      },
      statistics: {
        totalCourses,
        completedCourses,
        activeCourses,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalStudyHours: 45, // Mock data
        streak: 7 // Mock data
      },
      upcomingSessions,
      recentActivities,
      courses,
      notifications: notifications.map(notification => ({
        id: notification.id,
        message: notification.message,
        read: notification.read,
        timestamp: notification.createdAt.toISOString()
      })),
      achievements: [
        {
          id: '1',
          title: 'First Assignment',
          description: 'Completed your first assignment',
          icon: '🎯',
          unlocked: true,
          date: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Study Streak',
          description: '7 days of consistent study',
          icon: '🔥',
          unlocked: true,
          date: new Date().toISOString()
        }
      ]
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch student dashboard' });
  }
}