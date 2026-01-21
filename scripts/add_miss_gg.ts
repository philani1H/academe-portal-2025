import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generatePasswordFromName } from '../src/lib/utils.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding new tutor Miss Gg...');

  const tutor = {
    name: 'Miss Gg',
    fullName: 'Gogontle Mathila',
    email: 'miss.gg@excellenceakademie.co.za',
    personalEmail: 'gogontlemathila35@gmail.com',
    role: 'tutor',
    department: 'Social Sciences, Natural Sciences, Languages',
    subjects: JSON.stringify(['Geography', 'Life Sciences', 'English HL']),
  };

  const password = generatePasswordFromName(tutor.name);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: tutor.email }
    });

    if (existingUser) {
      console.log(`⚠️ User ${tutor.email} already exists. Updating details...`);
      // Update existing user using raw SQL to avoid schema mismatch issues if any
      await prisma.$executeRaw`
        UPDATE "users" 
        SET "full_name" = ${tutor.fullName}, 
            "personal_email" = ${tutor.personalEmail},
            "department" = ${tutor.department},
            "subjects" = ${tutor.subjects},
            "name" = ${tutor.name}
        WHERE "email" = ${tutor.email}
      `;
      console.log(`✅ Updated ${tutor.email}`);
    } else {
      console.log(`Creating new user ${tutor.email}...`);
      // Insert new user using raw SQL or Prisma create
      // Using Prisma create should be fine if schema is up to date
      // But let's use raw SQL for consistency with recent updates and to avoid potential schema issues
      // Actually, create is safer for ID generation
      
      await prisma.user.create({
        data: {
          name: tutor.name,
          fullName: tutor.fullName,
          email: tutor.email,
          personalEmail: tutor.personalEmail,
          role: tutor.role,
          department: tutor.department,
          subjects: tutor.subjects,
          password_hash: passwordHash,
        }
      });
      console.log(`✅ Created ${tutor.email}`);
    }
  } catch (error) {
    console.error(`❌ Failed to add/update ${tutor.email}:`, error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
