
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'philanishoun4@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`User ${email} not found. Creating...`)
    // Create user logic if needed, but better to use the make-tutor script logic
    // For now just log
  } else {
    console.log(`User found: ${user.name}, Role: ${user.role}`)
    if (user.role !== 'tutor') {
        console.log('Updating role to tutor...')
        await prisma.user.update({
            where: { email },
            data: { role: 'tutor' }
        })
        console.log('Role updated.')
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
