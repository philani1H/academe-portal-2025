import express, { Response } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

function parseArrayField(value: string | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

// Tutor Dashboard
router.get("/dashboard", authenticateJWT, authorizeRoles("tutor", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorIdParam = (req.query.tutorId as string) || (req as any).user?.id;
    if (!tutorIdParam) return res.status(400).json({ success: false, error: "Tutor ID is required" });

    const tutorId = Number.parseInt(tutorIdParam, 10);
    if (isNaN(tutorId)) return res.status(400).json({ success: false, error: "Invalid tutor ID" });

    const tutorUser = await prisma.user.findFirst({
      where: { id: tutorId, role: "tutor" },
    });
    if (!tutorUser) return res.status(404).json({ success: false, error: "Tutor not found" });

    const courses = await prisma.course.findMany({
      where: { tutorId: tutorId },
      include: {
        courseEnrollments: { include: { user: true } },
        tests: { include: { submissions: true } },
      },
    });

    const studentMap = new Map();
    courses.forEach((course) => {
      course.courseEnrollments.forEach((enrollment) => {
        const student = enrollment.user;
        if (student && student.role === "student") {
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              ...student,
              enrolledCourses: [course],
            });
          } else {
            const existing = studentMap.get(student.id);
            if (!existing.enrolledCourses.find((c: any) => c.id === course.id)) {
              existing.enrolledCourses.push(course);
            }
          }
        }
      });
    });

    const students = Array.from(studentMap.values());

    const notifications = await prisma.notification.findMany({
      where: { userId: tutorId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const scheduledSessions = await prisma.scheduledSession.findMany({
      where: { tutorId: tutorId },
      include: { course: true },
      orderBy: { scheduledAt: "asc" },
    });

    const dashboardData = {
      tutor: {
        id: tutorUser.id,
        name: tutorUser.name,
        email: tutorUser.email,
        department: tutorUser.department || "General",
        subjects: parseArrayField(tutorUser.subjects),
        contactEmail: tutorUser.email,
        contactPhone: "",
        description: "",
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorUser.name)}&background=random`,
      },
      statistics: {
        totalStudents: students.length,
        totalCourses: courses.length,
        activeStudents: students.length,
        completedSessions: scheduledSessions.filter((s) => s.status === "completed").length,
        averageRating: 4.8,
        totalEarnings: 0,
      },
      upcomingSessions: scheduledSessions
        .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt) > new Date())
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          courseName: s.course?.name || s.title,
          studentName: "All Students",
          studentEmail: "",
          date: s.scheduledAt.toISOString(),
          time: s.scheduledAt.toLocaleTimeString(),
          duration: s.duration,
          type: "class",
          status: s.status,
          location: "Online",
          notes: s.description || "",
          materials: [],
        })),
      recentActivities: scheduledSessions
        .filter((s) => s.status === "completed")
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          type: "session_completed",
          message: `Completed session: ${s.title}`,
          timestamp: s.updatedAt.toISOString(),
          studentName: "Class",
        })),
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        progress: Math.floor(Math.random() * 100),
        lastActivity: s.updatedAt?.toISOString() || new Date().toISOString(),
        status: "active",
        enrolledCourses: s.enrolledCourses.map((c: any) => c.name),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`,
        grades: {},
        totalSessions: 0,
        nextSession: null,
      })),
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        students: c.courseEnrollments.length,
        nextSession: null,
        progress: Math.floor(Math.random() * 100),
        materials: [],
        tests: c.tests.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          submissions: t.submissions.length,
          totalPoints: 100,
        })),
        color: "blue",
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        message: n.message,
        read: n.read,
        timestamp: n.createdAt.toISOString(),
      })),
      scheduledSessions: scheduledSessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        courseId: s.courseId,
        courseName: s.course?.name || "Unknown Course",
        scheduledAt: s.scheduledAt.toISOString(),
        duration: s.duration,
        status: s.status,
        sessionId: s.sessionId,
      })),
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching tutor dashboard:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch tutor dashboard" });
  }
});

// Tutor Stats
router.get("/stats", authenticateJWT, authorizeRoles("tutor", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorIdParam = (req.query.tutorId as string) || (req as any).user?.id;
    if (!tutorIdParam) return res.status(400).json({ success: false, error: "Tutor ID is required" });

    const tutorId = Number.parseInt(tutorIdParam, 10);
    if (isNaN(tutorId)) return res.status(400).json({ success: false, error: "Invalid tutor ID" });

    // Get tutor's courses
    const courses = await prisma.course.findMany({
      where: { tutorId: tutorId },
      include: {
        courseEnrollments: { include: { user: true } },
        tests: { include: { submissions: true } },
      },
    });

    // Get unique students enrolled in tutor's courses
    const studentSet = new Set<number>();
    courses.forEach((course) => {
      course.courseEnrollments.forEach((enrollment) => {
        if (enrollment.user && enrollment.user.role === "student") {
          studentSet.add(enrollment.user.id);
        }
      });
    });

    const totalStudents = studentSet.size;
    const totalCourses = courses.length;
    const activeStudents = Math.round(totalStudents * 0.8);

    // Calculate completion rate based on test submissions
    let totalSubmissions = 0;
    let totalPossibleSubmissions = 0;
    courses.forEach(c => {
        c.tests.forEach(t => {
            totalPossibleSubmissions += c.courseEnrollments.length;
            totalSubmissions += t.submissions.length;
        });
    });

    const completionRate = totalPossibleSubmissions > 0 
        ? Math.round((totalSubmissions / totalPossibleSubmissions) * 100) 
        : 0;

    return res.json({
        totalStudents,
        activeStudents,
        totalCourses,
        completionRate,
        averageGrade: 0,
        monthlyGrowth: 0,
        courseStats: [],
        monthlyData: []
    });

  } catch (error) {
    console.error("Error fetching tutor stats:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch tutor stats" });
  }
});

export default router;
