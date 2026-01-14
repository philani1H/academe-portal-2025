
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTutorCourses() {
  const email = 'philanishoun4@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      courses: true // Assuming 'courses' is the relation for courses taught by the user
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User: ${user.name} (${user.email})`);
  console.log(`Role: ${user.role}`);
  console.log('Assigned Courses:', user.courses);
  
  // Also check if there's a different relation name, e.g. "taughtCourses"
  // But based on schema usually it's "courses" or similar. 
  // Let's inspect the schema if needed, but "courses" is a safe bet for a first try or I can check schema.prisma first.
}

checkTutorCourses()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
