
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Retry helper
async function safeDbOp<T>(fn: () => Promise<T>): Promise<T> {
  let retries = 5;
  while (retries > 0) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
        console.log(`Database connection failed, retrying... (${retries} attempts left)`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to connect to database after multiple retries");
}

async function main() {
  console.log('Fixing admin permissions...')

  try {
    // Update all admins to have 'superadmin' permissions
    // This ensures consistency across all admin users
    const result = await safeDbOp(() => prisma.adminUser.updateMany({
      data: {
        permissions: 'superadmin'
      }
    }))

    console.log(`Updated ${result.count} admin users to 'superadmin' permissions.`)

    // Verify Jacob's profile specifically
    const jacob = await safeDbOp(() => prisma.adminUser.findFirst({
      where: { email: 'minaseabate.work@gmail.com' }
    }))

    if (jacob) {
      console.log('Jacob Abate profile:', jacob)
    } else {
      console.log('Jacob Abate profile not found.')
    }

  } catch (error) {
    console.error('Error updating admin permissions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
