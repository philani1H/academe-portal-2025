import prisma from '../lib/prisma';

export interface DatabaseResponse<T> {
  data?: T;
  error?: string;
}

export async function executeQuery<T>(query: string, params: any[] = []): Promise<DatabaseResponse<T>> {
  try {
    const result = await prisma.$queryRaw<T>`${query}`;
    return { data: result };
  } catch (error) {
    console.error('Database query error:', error);
    return { error: error instanceof Error ? error.message : 'Database query failed' };
  }
}

export const runUpdate = async (query: string, params: any[] = []): Promise<DatabaseResponse<number>> => {
  try {
    const result = await prisma.$executeRaw`${query}`;
    return { data: result };
  } catch (error) {
    console.error('Database update error:', error);
    return { error: error instanceof Error ? error.message : 'Database update failed' };
  }
};