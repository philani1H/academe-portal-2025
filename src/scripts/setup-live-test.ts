
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tutorEmail = 'philanishoun4@gmail.com';
  const studentEmail = 'student@example.com';

  console.log(`Checking tutor: ${tutorEmail}`);
  const tutor = await prisma.user.findUnique({
    where: { email: tutorEmail },
    include: { courses: true }
  });

  if (!tutor) {
    console.error('Tutor not found!');
    return;
  }
  console.log('Tutor found:', tutor.id, tutor.name);
  console.log('Tutor courses:', tutor.courses.map(c => c.name));

  if (tutor.courses.length === 0) {
    console.log('Creating a course for the tutor...');
    const course = await prisma.course.create({
      data: {
        name: 'Live Session Test Course',
        description: 'A course for testing live sessions',
        code: 'TEST101',
        tutorId: tutor.id,
        category: 'Testing'
      }
    });
    console.log('Course created:', course.name);
    tutor.courses.push(course);
  }

  const targetCourses = ['Advanced Mathematics', 'Intro to IT Systems', 'Financial Accounting'];
  console.log(`Target courses to enroll: ${targetCourses.join(', ')}`);

  console.log(`Checking student: ${studentEmail}`);
  const student = await prisma.user.findUnique({
    where: { email: studentEmail },
    include: { enrollments: true }
  });

  if (!student) {
    console.error('Student not found!');
    return;
  }
  console.log('Student found:', student.id, student.name);

  for (const courseName of targetCourses) {
      const course = await prisma.course.findFirst({
          where: { name: courseName }
      });

      if (!course) {
          console.warn(`Course '${courseName}' not found in database. Skipping.`);
          continue;
      }

      const isEnrolled = student.enrollments.some(e => e.courseId === course.id);

      if (!isEnrolled) {
        console.log(`Enrolling student in '${courseName}' (${course.id})...`);
        await prisma.courseEnrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            status: 'active'
          }
        });
        console.log(`Student enrolled in '${courseName}' successfully.`);
      } else {
        console.log(`Student is already enrolled in '${courseName}'.`);
      }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
