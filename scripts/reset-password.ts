
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: tsx scripts/reset-password.ts <email> <new_password>');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password_hash: hashedPassword },
    });

    console.log(`✅ Password updated successfully for user: ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to update password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
