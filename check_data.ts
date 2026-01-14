
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const studentId = 2;
    const enrollments = await prisma.courseEnrollment.findMany({
        where: { userId: studentId },
        include: { course: true }
    });
    console.log('Enrollments:', enrollments.map(e => ({ courseId: e.courseId, courseName: e.course.name })));

    if (enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.courseId);
        const sessions = await prisma.scheduledSession.findMany({
            where: {
                courseId: { in: courseIds }
            }
        });
        console.log('Sessions in enrolled courses:', sessions);
    } else {
        console.log('Student not enrolled in any courses.');
    }

    // Also check active sessions map if possible? No, strict mode.
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
