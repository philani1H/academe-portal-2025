
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRole() {
  const email = 'philanishoun4@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email }
  });
  console.log('User:', user);
}

checkUserRole()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
