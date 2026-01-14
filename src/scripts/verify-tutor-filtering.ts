
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting verification of tutor student filtering...');

  // 1. Create a test tutor (User)
  const tutorEmail = `tutor-${Date.now()}@test.com`;
  const tutor = await prisma.user.create({
    data: {
      email: tutorEmail,
      name: 'Test Tutor Filter',
      password: 'password123',
      role: 'tutor',
    },
  });
  console.log(`Created Tutor: ${tutor.name} (${tutor.id})`);

  // 2. Create a test student (Enrolled)
  const studentEnrolledEmail = `student-enrolled-${Date.now()}@test.com`;
  const studentEnrolled = await prisma.user.create({
    data: {
      email: studentEnrolledEmail,
      name: 'Enrolled Student',
      password: 'password123',
      role: 'student',
    },
  });
  console.log(`Created Student (Enrolled): ${studentEnrolled.name} (${studentEnrolled.id})`);

  // 3. Create a test student (Unenrolled)
  const studentUnenrolledEmail = `student-unenrolled-${Date.now()}@test.com`;
  const studentUnenrolled = await prisma.user.create({
    data: {
      email: studentUnenrolledEmail,
      name: 'Unenrolled Student',
      password: 'password123',
      role: 'student',
    },
  });
  console.log(`Created Student (Unenrolled): ${studentUnenrolled.name} (${studentUnenrolled.id})`);

  // 4. Create a course for the tutor
  const course = await prisma.course.create({
    data: {
      title: 'Tutor Filtering Test Course',
      description: 'Test Course',
      tutorId: tutor.id, // User.id is Int, Course.tutorId is Int
      price: 0,
      level: 'Beginner',
      category: 'Test',
      thumbnail: '',
      duration: '1h'
    },
  });
  console.log(`Created Course: ${course.title} (${course.id})`);

  // 5. Enroll the student
  await prisma.courseEnrollment.create({
    data: {
      userId: studentEnrolled.id,
      courseId: course.id,
      status: 'active',
      enrolledAt: new Date(),
      progress: 0
    },
  });
  console.log(`Enrolled student ${studentEnrolled.name} in course ${course.title}`);

  // 6. Execute the filtering logic (Simulation of /api/tutor/:tutorId/students)
  console.log('Executing filtering logic...');
  
  const tutorIdToTest = tutor.id; // Int

  const courses = await prisma.course.findMany({
    where: { tutorId: tutorIdToTest },
    include: {
      courseEnrollments: { include: { user: true } }
    }
  });

  const studentMap = new Map();
  courses.forEach(course => {
    course.courseEnrollments.forEach(enrollment => {
      const student = enrollment.user;
      if (student && student.role === 'student') {
        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, {
            ...student,
            enrolledCourses: [course] 
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

  console.log(`Found ${students.length} students for tutor ${tutor.name}`);
  students.forEach((s: any) => {
    console.log(` - ${s.name} (${s.email})`);
  });

  // Verification
  const enrolledFound = students.some((s: any) => s.id === studentEnrolled.id);
  const unenrolledFound = students.some((s: any) => s.id === studentUnenrolled.id);

  if (enrolledFound && !unenrolledFound) {
    console.log('SUCCESS: Only enrolled students are visible.');
  } else {
    console.error('FAILURE: Filtering logic is incorrect.');
    if (!enrolledFound) console.error(' - Enrolled student NOT found.');
    if (unenrolledFound) console.error(' - Unenrolled student FOUND.');
    process.exit(1);
  }

  // Cleanup
  await prisma.courseEnrollment.deleteMany({ where: { courseId: course.id } });
  await prisma.course.delete({ where: { id: course.id } });
  await prisma.user.delete({ where: { id: studentEnrolled.id } });
  await prisma.user.delete({ where: { id: studentUnenrolled.id } });
  await prisma.user.delete({ where: { id: tutor.id } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
