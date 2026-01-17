import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTutorDashboard(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tutor dashboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTutorDashboard(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tutorId } = req.query;

    if (!tutorId || typeof tutorId !== 'string') {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    // Get tutor information
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId }
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // Get tutor's students (enrolled in courses taught by this tutor)
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
        }
      }
    });

    // Get courses taught by this tutor
    const courses = await prisma.course.findMany({
      where: {
        // Assuming we have a tutorId field in Course model
        // For now, we'll get all courses
      },
      include: {
        enrollments: {
          include: {
            user: true
          }
        },
        tests: {
          include: {
            submissions: true
          }
        }
      }
    });

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: tutorId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Calculate dashboard statistics
    const totalStudents = students.length;
    const totalCourses = courses.length;
    const activeStudents = students.filter(s => 
      s.enrollments.some(e => e.status === 'enrolled')
    ).length;

    // Get upcoming sessions (mock data for now)
    const upcomingSessions = [
      {
        id: '1',
        courseName: 'Mathematics Grade 12',
        studentName: 'John Doe',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00 AM',
        duration: '60 minutes',
        type: '1-on-1'
      },
      {
        id: '2',
        courseName: 'Physics Grade 11',
        studentName: 'Jane Smith',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: '2:00 PM',
        duration: '90 minutes',
        type: 'Group'
      }
    ];

    // Get recent activities (mock data for now)
    const recentActivities = [
      {
        id: '1',
        type: 'session_completed',
        message: 'Completed session with John Doe - Mathematics',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        studentName: 'John Doe'
      },
      {
        id: '2',
        type: 'assignment_submitted',
        message: 'Jane Smith submitted Physics assignment',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        studentName: 'Jane Smith'
      }
    ];

    const dashboardData = {
      tutor: {
        id: tutor.id,
        name: tutor.name,
        subjects: JSON.parse(tutor.subjects || '[]'),
        contactEmail: tutor.contactEmail,
        contactPhone: tutor.contactPhone,
        description: tutor.description,
        image: tutor.image
      },
      statistics: {
        totalStudents,
        totalCourses,
        activeStudents,
        completedSessions: 45, // Mock data
        averageRating: 4.8, // Mock data
        totalEarnings: 12500 // Mock data
      },
      upcomingSessions,
      recentActivities,
      students: students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        progress: Math.floor(Math.random() * 100), // Mock progress
        lastActivity: student.updatedAt.toISOString(),
        status: 'active',
        enrolledCourses: student.enrollments.map(e => e.course.title),
        avatar: `https://ui-avatars.com/api/?name=${student.name}&background=random`
      })),
      courses: courses.map(course => ({
        id: course.id,
        name: course.title,
        description: course.description,
        students: course.enrollments.length,
        nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        progress: Math.floor(Math.random() * 100), // Mock progress
        materials: [], // Mock materials
        tests: course.tests.map(test => ({
          id: test.id,
          title: test.title,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          submissions: test.submissions.length,
          totalPoints: 100
        })),
        color: 'blue'
      })),
      notifications: notifications.map(notification => ({
        id: notification.id,
        message: notification.message,
        read: notification.read,
        timestamp: notification.createdAt.toISOString()
      }))
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching tutor dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch tutor dashboard' });
  }
}