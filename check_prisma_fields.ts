
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking User model fields...');
        // @ts-ignore - Intentionally ignore to see if runtime allows or if types are just missing
        const user = await prisma.user.findFirst();
        console.log('User keys:', Object.keys(user || {}));

        // Attempt cast to any to create with department
        try {
            const dummy = await prisma.user.create({
                data: {
                    email: 'dept_test@example.com',
                    name: 'Dept Test',
                    role: 'student',
                    password_hash: 'hash',
                    // @ts-ignore
                    department: 'Science',
                    // @ts-ignore
                    department_id: 'Science'
                } as any
            });
            console.log('User created with department info:', dummy);
            await prisma.user.delete({ where: { id: dummy.id } });
        } catch (e) {
            console.log('Failed to create user with department:', e.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
