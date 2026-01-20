import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_7M3BqCyjxNiE@ep-dawn-band-ah9ov9c8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const getClient = (): PrismaClient => {
  const isProd = process.env.NODE_ENV === 'production';

  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === '') {
    if (isProd) {
      console.warn('⚠️ DATABASE_URL is not set in production environment. Using fallback Neon URL.');
    } else {
      console.warn('⚠️ No DATABASE_URL found, using hardcoded Neon URL (development only)');
    }
    databaseUrl = NEON_DATABASE_URL;
  }

  try {
    new URL(databaseUrl);
  } catch {
    if (isProd) {
      console.warn('⚠️ Invalid DATABASE_URL in production environment. Using fallback Neon URL.');
    } else {
      console.warn('⚠️ Invalid DATABASE_URL format, using hardcoded Neon URL (development only)');
    }
    databaseUrl = NEON_DATABASE_URL;
  }

  const url = new URL(databaseUrl);

  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '10');
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '60');
  }
  if (!url.searchParams.has('connect_timeout')) {
    url.searchParams.set('connect_timeout', '60');
  }

  console.log(`🔌 Connecting to database: ${url.host}`);

  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    log: isProd ? ['error'] : ['error', 'warn'],
  });
};

const prisma = global.prisma || getClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;