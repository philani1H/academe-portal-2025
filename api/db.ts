import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'philani',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'akademie_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

export const executeQuery = async <T>(query: string, params?: any[]): Promise<T> => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};
