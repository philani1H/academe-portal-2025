
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = 'philanishoun50@gmail.com';
  console.log(`Setting up data for: ${email}`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found.');
      return;
    }

    // 1. Ensure Subjects exist
    const subjectsToCreate = [
      { name: 'Mathematics', icon: 'Calculator' },
      { name: 'Information Technology', icon: 'Server' },
      { name: 'Finance', icon: 'DollarSign' }
    ];

    for (const sub of subjectsToCreate) {
      const existing = await prisma.subjects.findFirst({
        where: { name: sub.name }
      });
      if (!existing) {
        await prisma.subjects.create({
          data: {
            id: randomUUID(),
            name: sub.name,
            icon: sub.icon,
            description: `${sub.name} Department`
          }
        });
        console.log(`Created subject: ${sub.name}`);
      }
    }

    // 2. Create Courses assigned to this tutor
    const coursesToCreate = [
      { name: 'Advanced Mathematics', description: 'Grade 12 Mathematics' },
      { name: 'Intro to IT Systems', description: 'Basic hardware and software concepts' },
      { name: 'Financial Accounting', description: 'Principles of accounting' }
    ];

    for (const courseData of coursesToCreate) {
      // Check if course exists for this tutor
      const existing = await prisma.course.findFirst({
        where: { 
          name: courseData.name,
          tutorId: user.id
        }
      });

      if (!existing) {
        await prisma.course.create({
          data: {
            name: courseData.name,
            description: courseData.description,
            tutorId: user.id
          }
        });
        console.log(`Assigned course to tutor: ${courseData.name}`);
      } else {
        console.log(`Course already assigned: ${courseData.name}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
