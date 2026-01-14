
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.user.findMany({
        where: { role: 'student' },
        take: 5
    });
    console.log('Students:', students);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
