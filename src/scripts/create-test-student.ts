
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create or find a Tutor
  const tutorEmail = 'tutor@example.com';
  const tutorPassword = await bcrypt.hash('password123', 10);
  
  let tutor = await prisma.user.findUnique({ where: { email: tutorEmail } });
  if (!tutor) {
    tutor = await prisma.user.create({
      data: {
        name: 'Test Tutor',
        email: tutorEmail,
        password_hash: tutorPassword,
        role: 'tutor',
      },
    });
    console.log('Created Tutor:', tutor.email);
  } else {
    console.log('Found Tutor:', tutor.email);
  }

  // 2. Create or find a Course
  const courseName = 'Mathematics 101';
  let course = await prisma.course.findFirst({ where: { name: courseName } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        name: courseName,
        description: 'Introduction to Calculus',
        category: 'Mathematics',
        tutorId: tutor.id,
      },
    });
    console.log('Created Course:', course.name);
  } else {
    console.log('Found Course:', course.name);
  }

  // 3. Create a Student
  const studentEmail = 'student@example.com';
  const studentPassword = await bcrypt.hash('password123', 10);
  
  let student = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        name: 'Test Student',
        email: studentEmail,
        password_hash: studentPassword,
        role: 'student',
      },
    });
    console.log('Created Student:', student.email);
  } else {
    console.log('Found Student:', student.email);
  }

  // 4. Enroll Student in Course
  // Check if already enrolled
  const existingEnrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userId: student.id,
      courseId: course.id,
    },
  });

  if (!existingEnrollment) {
    await prisma.courseEnrollment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        status: 'active',
      },
    });
    console.log(`Enrolled ${student.name} in ${course.name}`);
  } else {
    console.log(`Student already enrolled in ${course.name}`);
  }
  
  // Also create a credential in user_credentials table if it exists (for raw SQL login check)
  // But wait, the server login code checks `user_credentials` table (SQLite specific) OR auto-registers from `User` table?
  // Let's re-read the server login code carefully.
  // It says: "Auto-register if no credentials exist (Dev/Test convenience)" 
  // "let user = await prisma.user.findUnique({ where: { email: userEmail } });"
  // So creating the Prisma User should be enough for the auto-register fallback logic in `server/index.ts`.

  console.log('\n--- LOGIN DETAILS ---');
  console.log('Student Email: student@example.com');
  console.log('Password: password123');
  console.log('Student ID:', student.id);
  console.log('---------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
