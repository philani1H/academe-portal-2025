import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

// Hardcoded Neon database URL as fallback
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_7M3BqCyjxNiE@ep-dawn-band-ah9ov9c8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const getClient = () => {
  try {
    // Priority: 
    // 1. Valid DATABASE_URL from env (must be non-empty and not localhost/internal if in production)
    // 2. Fallback NEON_DATABASE_URL
    let databaseUrl = process.env.DATABASE_URL;

    // If no env var, or if it looks invalid (e.g. empty), use fallback
    if (!databaseUrl || databaseUrl.trim() === '') {
      console.warn('⚠️ No DATABASE_URL found, using hardcoded Neon URL');
      databaseUrl = NEON_DATABASE_URL;
    }

    // Attempt to validate URL structure
    try {
      new URL(databaseUrl);
    } catch {
       console.warn('⚠️ Invalid DATABASE_URL format, switching to Neon URL');
       databaseUrl = NEON_DATABASE_URL;
    }

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
    console.warn('⚠️ WARNING: Using fallback hardcoded database URL. This is not recommended for production!');
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