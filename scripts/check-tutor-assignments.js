
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'philanishoun4@gmail.com';
  console.log(`Checking assignments for: ${email}`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        courses: true,
      },
    });

    if (!user) {
      console.log('User not found.');
      return;
    }

    console.log(`User ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    
    // Check for direct course assignments
    if (user.courses.length > 0) {
      console.log('\nAssigned Courses (Subjects):');
      user.courses.forEach(c => {
        console.log(`- [${c.id}] ${c.name}: ${c.description || 'No description'}`);
      });
    } else {
      console.log('\nNo courses currently assigned to this tutor.');
    }

    // List all available subjects/departments from 'subjects' table
    console.log('\nAvailable Departments/Subjects in System:');
    const allSubjects = await prisma.subjects.findMany();
    if (allSubjects.length > 0) {
      allSubjects.forEach(s => {
        console.log(`- ${s.name} (${s.id})`);
      });
    } else {
      console.log('No subjects defined in the system yet.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
