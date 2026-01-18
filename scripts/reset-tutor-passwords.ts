
import { PrismaClient } from '@prisma/client';
import { generatePasswordFromName } from '../src/lib/utils';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting dynamic tutor password reset (using shared utility)...');

  try {
    // 1. Find all tutors
    const tutors = await prisma.user.findMany({
      where: { role: 'tutor' },
    });

    console.log(`Found ${tutors.length} tutors.`);
    console.log('--------------------------------------------------------------------------------');
    console.log('| Name                 | Email                                | New Password     |');
    console.log('--------------------------------------------------------------------------------');

    for (const tutor of tutors) {
      const newPassword = generatePasswordFromName(tutor.name);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: tutor.id },
        data: { password_hash: hashedPassword },
      });

      console.log(
        `| ${tutor.name.padEnd(20)} | ${tutor.email.padEnd(36)} | ${newPassword.padEnd(16)} |`
      );
    }

    console.log('--------------------------------------------------------------------------------');
    console.log('✅ All tutor passwords updated successfully.');

  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
