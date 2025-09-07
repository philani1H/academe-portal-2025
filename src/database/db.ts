import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initializeDatabase() {
    if (db) return db;

    try {
        // Open database connection
        db = await open({
            filename: path.join(__dirname, '..', '..', 'APP-Database.db'),
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await db.run('PRAGMA foreign_keys = ON');

        // Read and execute schema.sql
        const schema = await import('./schema.sql');
        await db.exec(schema.default);

        console.log('Database initialized successfully');
        return db;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

export async function getDatabase() {
    if (!db) {
        await initializeDatabase();
    }
    return db;
}

export async function closeDatabase() {
    if (db) {
        await db.close();
        db = null;
    }
}

// Utility function to handle database transactions
export async function runTransaction<T>(callback: (db: Database) => Promise<T>): Promise<T> {
    const database = await getDatabase();
    if (!database) throw new Error('Database not initialized');

    try {
        await database.run('BEGIN TRANSACTION');
        const result = await callback(database);
        await database.run('COMMIT');
        return result;
    } catch (error) {
        await database.run('ROLLBACK');
        throw error;
    }
}