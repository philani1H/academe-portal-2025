
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(process.cwd(), 'data-root.json');
  if (!fs.existsSync(dataPath)) {
    console.error('data-root.json not found!');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  for (const [modelName, rows] of Object.entries(data)) {
    // Model name should be as exported: User, Course, etc.
    // However, Prisma Client usually exposes models as camelCase (user, course).
    // EXCEPT if the model name is PascalCase in schema, Prisma Client usually exposes it as camelCase key on client instance.
    // e.g. model User -> prisma.user
    // model HeroContent -> prisma.heroContent
    // model announcements -> prisma.announcements (if mapped?) or announcements?
    
    // Let's normalize to lowerCamelCase first char.
    let prismaClientKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    // Special handling if needed?
    // User -> user
    // AdminUser -> adminUser
    
    // @ts-ignore
    const model = prisma[prismaClientKey];
    
    if (!model) {
      console.warn(`Model ${prismaClientKey} (from ${modelName}) not found in Prisma Client. Trying original name.`);
      // @ts-ignore
      const modelOriginal = prisma[modelName];
      if (!modelOriginal) {
          console.warn(`Model ${modelName} also not found. Skipping.`);
          continue;
      }
      // @ts-ignore
      model = modelOriginal;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`No data for ${modelName}. Skipping.`);
      continue;
    }

    console.log(`Importing ${rows.length} rows into ${modelName} (${prismaClientKey})...`);

    // Fix specific data issues
    const processedRows = rows.map((row: any) => {
         // Fix Announcement missing title and authorId if needed
         if (modelName === 'Announcement') {
            const { isActive, ...rest } = row;
             return {
                 ...rest,
                 title: row.title || 'Untitled Announcement',
                 authorId: row.authorId || 1
             };
         }
         
         // Fix announcements (snake_case model) field mapping
         if (modelName === 'announcements') {
             const { media_url, media_type, ...rest } = row;
             return {
                 ...rest,
                 mediaUrl: media_url,
                 mediaType: media_type
             };
         }
         return row;
    });

    try {
        await model.createMany({
            data: processedRows,
            skipDuplicates: true
        });
        console.log(`Successfully imported ${modelName}`);
    } catch (e: any) {
        console.error(`Error importing ${modelName}:`, e.message);
        if (e.meta) {
            console.error('Meta:', e.meta);
        }
    }
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
