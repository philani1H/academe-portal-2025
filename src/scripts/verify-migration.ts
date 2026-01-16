
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const models = [
    'user',
    'course',
    'adminUser',
    'announcements',
    'heroContent',
    'feature',
    'announcement',
    'pricingPlan',
    'testimonial',
    'teamMember',
    'aboutUsContent',
    'siteSettings',
    'tutor',
    'subject',
    'footerContent',
    'navigationItem',
    'becomeTutorContent',
    'examRewriteContent',
    'contactUsContent'
  ];

  console.log('Verifying row counts in PostgreSQL:');
  for (const model of models) {
    // @ts-ignore
    const count = await prisma[model].count();
    console.log(`${model}: ${count}`);
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
