
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = "roshan@excellenceakademie.co.za"
  console.log(`Checking user with email: ${email}`)

  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (user) {
      console.log("User found:", JSON.stringify(user, null, 2))
  } else {
      console.log("No user found with this email.")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
