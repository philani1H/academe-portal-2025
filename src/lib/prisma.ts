import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Hardcoded Neon database URL as fallback
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_7M3BqCyjxNiE@ep-dawn-band-ah9ov9c8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const getClient = () => {
  try {
    const databaseUrl = process.env.DATABASE_URL || NEON_DATABASE_URL;
    const url = new URL(databaseUrl);

    // Increase connection limit to handle concurrent dashboard requests
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '20');
    }
    // Increase timeout to handle serverless cold starts
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '30');
    }

    console.log(`🔌 Connecting to database: ${url.host}`);

    return new PrismaClient({
      datasources: {
        db: {
          url: url.toString(),
        },
      },
    });
  } catch (e) {
    console.error('Failed to parse DATABASE_URL, using hardcoded Neon URL', e);
    return new PrismaClient({
      datasources: {
        db: {
          url: NEON_DATABASE_URL,
        },
      },
    });
  }
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