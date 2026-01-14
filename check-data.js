import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  console.log(`Total users: ${userCount}`);
  
  const subjectCount = await prisma.subjects.count();
  console.log(`Total subjects: ${subjectCount}`);
  
  const courseCount = await prisma.course.count();
  console.log(`Total courses: ${courseCount}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());