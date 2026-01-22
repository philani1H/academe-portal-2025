import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { authenticateJWT, AuthenticatedRequest } from '@/lib/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await authenticateJWT(req as AuthenticatedRequest, res, async () => {
          return await getTutorDashboard(req as AuthenticatedRequest, res);
        });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tutor dashboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTutorDashboard(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { tutorId } = req.query;

    if (!tutorId || typeof tutorId !== 'string') {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    const parsedTutorId = parseInt(tutorId);
    if (isNaN(parsedTutorId)) {
        return res.status(400).json({ error: 'Invalid Tutor ID' });
    }

    // Security check: Ensure the authenticated user is accessing their own dashboard
    if (req.user.userId !== parsedTutorId) {
        return res.status(403).json({ error: 'Access denied: You can only view your own dashboard' });
    }

    // Get tutor information (Tutors are Users with role 'tutor')
    const tutor = await prisma.user.findUnique({
      where: { id: parsedTutorId }
    });

    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // Get tutor's students (enrolled in courses taught by this tutor)
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
        }
      }
    });

    // Get courses taught by this tutor
    const courses = await prisma.course.findMany({
      where: {
        tutorId: parsedTutorId
      },
      include: {
        courseEnrollments: {
          include: {
            user: true
          }
        },
        tests: {
          include: {
            testSubmissions: true
          }
        }
      }
    });

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: parsedTutorId
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
      s.courseEnrollments.some(e => e.status === 'enrolled')
    ).length;

    // Get upcoming sessions (Real Data)
    const upcomingSessionsRaw = await prisma.scheduledSession.findMany({
      where: {
        tutorId: parsedTutorId,
        scheduledAt: {
            gte: new Date()
        }
      },
      include: {
        course: true,
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: 5
    });

    const upcomingSessions = upcomingSessionsRaw.map(session => ({
        id: session.id,
        courseName: session.course.name,
        studentName: 'Students', // Group session or check enrollment if specific
        date: session.scheduledAt.toISOString(),
        time: session.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `${session.duration} minutes`,
        type: 'Session'
    }));

    // Get recent activities (Real Data: Completed Sessions and Assignments)
    // 1. Completed sessions
    const completedSessions = await prisma.scheduledSession.findMany({
        where: {
            tutorId: parsedTutorId,
            scheduledAt: { lt: new Date() }
        },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
        include: { course: true }
    });

    // 2. Recent assignment submissions for this tutor's courses
    const recentSubmissions = await prisma.assignmentSubmission.findMany({
        where: {
            assignment: {
                course: {
                    tutorId: parsedTutorId
                }
            }
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: {
            user: true,
            assignment: true
        }
    });

    const recentActivities = [
        ...completedSessions.map(s => ({
            id: s.id,
            type: 'session_completed',
            message: `Completed session for ${s.course.name}`,
            timestamp: s.scheduledAt.toISOString(),
            studentName: 'Class'
        })),
        ...recentSubmissions.map(s => ({
            id: s.id,
            type: 'assignment_submitted',
            message: `${s.user.name} submitted ${s.assignment.title}`,
            timestamp: s.submittedAt.toISOString(),
            studentName: s.user.name
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    const dashboardData = {
      tutor: {
        id: tutor.id,
        name: tutor.name,
        subjects: tutor.subjects ? JSON.parse(tutor.subjects) : [],
        contactEmail: tutor.email, // Use email as contactEmail
        contactPhone: null, // User model doesn't have phone
        description: null, // User model doesn't have description
        image: null // User model doesn't have image
      },
      statistics: {
        totalStudents,
        totalCourses,
        activeStudents,
        completedSessions: completedSessions.length, // Real count from recent fetch (approximate)
        averageRating: 0, // No rating system yet
        totalEarnings: 0 // No earnings system yet
      },
      upcomingSessions,
      recentActivities,
      students: students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        progress: 0, // Placeholder
        lastActivity: student.updatedAt?.toISOString() || new Date().toISOString(),
        status: 'active',
        enrolledCourses: student.courseEnrollments.map(e => e.course.name),
        avatar: `https://ui-avatars.com/api/?name=${student.name}&background=random`
      })),
      courses: courses.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        students: course.courseEnrollments.length,
        nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Placeholder
        progress: 0, // Placeholder
        materials: [], // Materials not fetched here to save bandwidth
        tests: course.tests.map(test => ({
          id: test.id,
          title: test.title,
          dueDate: test.dueDate,
          submissions: test.testSubmissions.length,
          totalPoints: test.totalPoints
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