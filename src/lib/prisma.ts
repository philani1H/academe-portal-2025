import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

const getClient = () => {
  try {
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      // Increase connection limit to handle concurrent dashboard requests
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '20');
      }
      // Increase timeout to handle serverless cold starts
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30');
      }
      
      return new PrismaClient({
        datasources: {
          db: {
            url: url.toString(),
          },
        },
      });
    }
  } catch (e) {
    console.warn('Failed to parse DATABASE_URL, using default Prisma configuration', e);
  }
  
  return new PrismaClient();
};

if (process.env.NODE_ENV === 'production') {
  prisma = getClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = getClient();
  }
  prisma = (global as any).prisma;
}

export default prisma;