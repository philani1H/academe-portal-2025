import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Helper function to get database connection
async function getConnection(): Promise<Database> {
  try {
    const dbFile = path.resolve(process.cwd(), 'APP-Database.db');
    const db = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });
    return db;
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

// Helper function to execute queries
async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  const db = await getConnection();
  try {
    const rows = await db.all<T>(query, params);
    return rows as unknown as T[];
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    await db.close();
  }
}

export { getConnection, executeQuery };