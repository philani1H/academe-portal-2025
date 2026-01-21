
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        password_hash: true,
      },
    });

    console.log('--- Current Users ---');
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user) => {
        console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Hash: ${user.password_hash.substring(0, 10)}...`);
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
