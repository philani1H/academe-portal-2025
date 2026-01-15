import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

type EnrolledCourse = {
  id: number;
  name: string;
};

type DashboardStudent = {
  id: number;
  name: string;
  email: string;
  updatedAt: Date | null;
  enrolledCourses: EnrolledCourse[];
};

async function getTutorDashboard(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tutorIdParam = (req.query.tutorId as string) || '';

    if (!tutorIdParam) {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    const tutorId = parseInt(tutorIdParam, 10);

    if (Number.isNaN(tutorId)) {
      return res.status(400).json({ error: 'Invalid tutor ID' });
    }

    const tutorUser = await prisma.user.findFirst({
      where: { id: tutorId, role: 'tutor' }
    });

    if (!tutorUser) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const [courses, notifications, scheduledSessions] = await Promise.all([
      prisma.course.findMany({
        where: { tutorId },
        include: {
          courseEnrollments: { include: { user: true } },
          tests: { include: { submissions: true } }
        }
      }),
      prisma.notification.findMany({
        where: { userId: tutorId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.scheduledSession.findMany({
        where: { tutorId },
        include: { course: true },
        orderBy: { scheduledAt: 'asc' }
      })
    ]);

    const studentMap = new Map<number, DashboardStudent>();

    courses.forEach((course) => {
      course.courseEnrollments.forEach((enrollment) => {
        const student = enrollment.user;
        if (student && student.role === 'student') {
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              id: student.id,
              name: student.name,
              email: student.email,
              updatedAt: student.updatedAt ?? null,
              enrolledCourses: [
                {
                  id: course.id,
                  name: course.name
                }
              ]
            });
          } else {
            const existing = studentMap.get(student.id);
            if (existing && !existing.enrolledCourses.find((c) => c.id === course.id)) {
              existing.enrolledCourses.push({
                id: course.id,
                name: course.name
              });
            }
          }
        }
      });
    });

    const students = Array.from(studentMap.values());

    const upcomingSessions = scheduledSessions
      .filter((s) => s.status === 'scheduled' && s.scheduledAt > new Date())
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        courseName: s.course?.name || s.title,
        studentName: 'All Students',
        studentEmail: '',
        date: s.scheduledAt.toISOString(),
        time: s.scheduledAt.toLocaleTimeString(),
        duration: s.duration,
        type: 'class'
      }));

    const recentActivities = scheduledSessions
      .filter((s) => s.status === 'completed')
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        type: 'session_completed',
        message: `Completed session: ${s.title}`,
        timestamp: s.updatedAt.toISOString(),
        studentName: 'Class'
      }));

    let subjects: string[] = [];

    if (typeof tutorUser.subjects === 'string' && tutorUser.subjects.trim().length > 0) {
      try {
        const parsed = JSON.parse(tutorUser.subjects);
        if (Array.isArray(parsed)) {
          subjects = parsed.filter((s): s is string => typeof s === 'string');
        } else if (parsed && typeof parsed === 'object') {
          const withSubjects = parsed as { subjects?: unknown };
          if (Array.isArray(withSubjects.subjects)) {
            subjects = withSubjects.subjects.filter((s): s is string => typeof s === 'string');
          }
        } else {
          subjects = tutorUser.subjects.split(/[|;,]/).map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        subjects = tutorUser.subjects.split(/[|;,]/).map((s) => s.trim()).filter(Boolean);
      }
    }

    const totalStudents = students.length;
    const totalCourses = courses.length;

    const dashboardData = {
      tutor: {
        id: tutorUser.id,
        name: tutorUser.name,
        subjects,
        contactEmail: tutorUser.email,
        contactPhone: '',
        description: '',
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorUser.name)}&background=random`
      },
      statistics: {
        totalStudents,
        totalCourses,
        activeStudents: totalStudents,
        completedSessions: scheduledSessions.filter((s) => s.status === 'completed').length,
        averageRating: 4.8,
        totalEarnings: 0,
        completionRate: totalCourses > 0 ? Math.round((totalStudents / totalCourses) * 10) / 10 : 0
      },
      upcomingSessions,
      recentActivities,
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        progress: Math.floor(Math.random() * 100),
        lastActivity: student.updatedAt ? student.updatedAt.toISOString() : new Date().toISOString(),
        status: 'active',
        enrolledCourses: student.enrolledCourses.map((course) => course.name),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`
      })),
      courses: courses.map((course) => ({
        id: course.id,
        name: course.name,
        description: course.description,
        students: course.courseEnrollments.length,
        nextSession: null,
        progress: Math.floor(Math.random() * 100),
        materials: [],
        tests: course.tests.map((test) => ({
          id: test.id,
          title: test.title,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          submissions: test.submissions.length,
          totalPoints: 100
        })),
        color: 'blue'
      })),
      notifications: notifications.map((notification) => ({
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
