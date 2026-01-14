
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'philanishoun4@gmail.com';
  console.log(`Checking user with email: ${email}`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found. Creating new tutor user...');
      const newUser = await prisma.user.create({
        data: {
          email,
          name: 'Phila',
          role: 'tutor',
          password_hash: '$2b$10$EpOrzZ.0.R/..', // Dummy hash
        },
      });
      console.log('Created user:', newUser);
    } else {
      console.log('User found:', user);
      if (user.role !== 'tutor') {
        const updated = await prisma.user.update({
          where: { email },
          data: { role: 'tutor' },
        });
        console.log('Updated user role to tutor:', updated);
      } else {
        console.log('User is already a tutor.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
