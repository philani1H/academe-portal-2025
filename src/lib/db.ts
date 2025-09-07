import { Pool } from 'pg';

// Create connection pool using Neon connection string
const pool = new Pool({
  connectionString: process.env.POSTGRES_PRISMA_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function to get a client from the pool
export async function getConnection() {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

// Helper function to execute queries
export async function executeQuery<T>(query: string, params?: any[]): Promise<T> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(query, params);
    return rows as T;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    client.release();
  }
}