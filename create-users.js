import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function main() {
  const password = 'password123';
  const hashedPassword = await hashPassword(password);

  // Create tutor
  const tutorEmail = 'philanishoun50@gmail.com';
  const tutorName = 'Tutor Phila';

  let tutor = await prisma.user.findUnique({ where: { email: tutorEmail } });
  if (!tutor) {
    tutor = await prisma.user.create({
      data: {
        email: tutorEmail,
        name: tutorName,
        role: 'tutor',
        password_hash: hashedPassword,
      },
    });
    console.log('Created tutor:', tutor);
  } else {
    console.log('Tutor already exists:', tutor);
  }

  // Create student
  const studentEmail = 'student@example.com';
  const studentName = 'Test Student';

  let student = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        email: studentEmail,
        name: studentName,
        role: 'student',
        password_hash: hashedPassword,
      },
    });
    console.log('Created student:', student);
  } else {
    console.log('Student already exists:', student);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());