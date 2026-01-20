
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Checking for Rohan...")

  // Check Content Tutor
  const tutors = await prisma.tutor.findMany({
    where: {
      name: {
        contains: 'Rohan',
        mode: 'insensitive'
      }
    }
  })
  console.log("Content Tutors found:", JSON.stringify(tutors, null, 2))

  // Check System User
  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: 'Rohan',
        mode: 'insensitive'
      }
    }
  })
  console.log("System Users found:", JSON.stringify(users, null, 2))

  if (users.length > 0) {
      for (const u of users) {
          const courses = await prisma.course.findMany({
              where: {
                  tutorId: u.id
              }
          })
          console.log(`Courses for User ${u.name} (ID: ${u.id}):`, JSON.stringify(courses, null, 2))
      }
  } else {
      console.log("No System Users found, checking unassigned courses with 'Rohan' in name...")
  }
    
  const coursesByName = await prisma.course.findMany({
      where: {
          name: {
              contains: 'Rohan',
              mode: 'insensitive'
          }
      }
  })
  // console.log("Courses with 'Rohan' in name:", JSON.stringify(coursesByName, null, 2))

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
