import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const tutors = [
  {
    systemEmail: 'simon@excellenceakademie.co.za',
    fullName: 'Simon Ngidi',
    personalEmail: 'ngidisimon63@gmail.com'
  },
  {
    systemEmail: 'unobuhle@excellenceakademie.co.za',
    fullName: 'Unobuhle Sibeko',
    personalEmail: 'unobuhlesibeko@gmail.com'
  },
  {
    systemEmail: 'e.a.abby@excellenceakademie.co.za',
    fullName: 'Abigail Chetty',
    personalEmail: 'e.aabby00@gmail.com'
  },
  {
    systemEmail: 'miss.k@excellenceakademie.co.za',
    fullName: 'Kgaugelo Makhubedu',
    personalEmail: 'makhubedu.kgaugelo23@gmail.com'
  },
  {
    systemEmail: 'sirmr.lovers@excellenceakademie.co.za',
    fullName: 'Sfiso Chauke',
    personalEmail: 'chaukesfiso12@gmail.com'
  },
  {
    systemEmail: 'rohan@excellenceakademie.co.za', // Rohan Dunn
    fullName: 'Rohan Dunn',
    personalEmail: 'rohan.dunn@outlook.com'
  },
  {
    systemEmail: 'amanda.utembe@excellenceakademie.co.za',
    fullName: 'Amanda Utembe',
    personalEmail: 'Utembeamanda2@gmail.com'
  },
  {
    systemEmail: 'miss.keturah@excellenceakademie.co.za',
    fullName: 'Keturah Mulenga',
    personalEmail: 'mulengaketurah66@gmail.com'
  },
  {
    systemEmail: 'jacob@excellenceakademie.co.za',
    fullName: 'Jacob Abate',
    personalEmail: 'minaseabate.work@gmail.com'
  },
  {
    systemEmail: 'roshan@excellenceakademie.co.za', // Roshan (mr mvp)
    fullName: 'Roshan Singh',
    personalEmail: 'roshansinghrsa02@gmail.com'
  },
  // New Tutor: Miss Gg
  {
    systemEmail: 'miss.gg@excellenceakademie.co.za',
    name: 'Miss Gg',
    fullName: 'Gogontle Mathila',
    personalEmail: 'gogontlemathila35@gmail.com',
    department: 'Natural Sciences, Social Sciences, Languages',
    subjects: JSON.stringify(['Geography', 'Life Sciences', 'English HL']),
    isNew: true
  }
];

function generatePasswordFromName(name: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
  return `${normalized}@EA25!`;
}

async function main() {
  console.log('Starting tutor details update...');

  for (const tutor of tutors) {
    console.log(`Processing ${tutor.fullName} (${tutor.systemEmail})...`);
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: tutor.systemEmail }
      });

      if (existingUser) {
        // Update existing user
        if ((tutor as any).department) {
           await prisma.$executeRaw`
             UPDATE "users" 
             SET "full_name" = ${tutor.fullName}, "personal_email" = ${tutor.personalEmail}, "department" = ${(tutor as any).department}, "subjects" = ${(tutor as any).subjects}
             WHERE "email" = ${tutor.systemEmail}
           `;
        } else {
           await prisma.$executeRaw`
             UPDATE "users" 
             SET "full_name" = ${tutor.fullName}, "personal_email" = ${tutor.personalEmail}
             WHERE "email" = ${tutor.systemEmail}
           `;
        }
        console.log(`✅ Updated ${tutor.systemEmail}`);
      } else if (tutor.isNew) {
        // Create new user
        console.log(`Creating new user: ${tutor.name}`);
        const password = generatePasswordFromName(tutor.name!);
        const passwordHash = await bcrypt.hash(password, 10);

        // We use raw insert to avoid potential Prisma schema mismatch issues if not regenerated
        // But for creation, we need to be careful with ID autoincrement.
        // Prisma create is safer if the schema matches.
        // Since we added fields, and hopefully regenerated or using raw.
        // Let's use raw INSERT to be consistent with the update strategy if we suspect schema issues.
        // But simpler to try prisma.user.create first? No, we are avoiding prisma client methods that rely on updated types if we haven't regenerated.
        // But I see `npx prisma migrate dev` running in a terminal in the context!
        // Terminal 4: `npx prisma migrate dev --name add_full_name_to_user`
        // If that finished, the client should be updated.
        // I'll check the terminal status if possible.
        // Assuming it might not be done or I want to be safe, I'll use raw SQL for insert too.
        
        await prisma.$executeRaw`
          INSERT INTO "users" ("name", "email", "personal_email", "full_name", "password_hash", "role", "department", "subjects", "created_at", "updated_at")
          VALUES (${tutor.name}, ${tutor.systemEmail}, ${tutor.personalEmail}, ${tutor.fullName}, ${passwordHash}, 'tutor', ${tutor.department}, ${tutor.subjects}, NOW(), NOW())
        `;
        console.log(`✅ Created new user: ${tutor.systemEmail}`);
      } else {
        console.warn(`⚠️ User not found and not marked as new: ${tutor.systemEmail}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${tutor.systemEmail}:`, error);
    }
  }

  console.log('Update complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
