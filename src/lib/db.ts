
import prisma from './prisma.js';

// Adapter to mimic sqlite.Database using Prisma
// This allows legacy code using SQLite-style queries to work with PostgreSQL via Prisma
class PrismaSQLiteAdapter {
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pgSql = convertToPgSql(sql, params);
    try {
        const rows = await prisma.$queryRawUnsafe<T[]>(pgSql.sql, ...pgSql.params);
        return rows as unknown as T[];
    } catch (e: any) {
        console.error("Error in db.all:", e.message, "SQL:", pgSql.sql);
        throw e;
    }
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await this.all<T>(sql, params);
    return rows[0];
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: string | number; changes: number }> {
    const pgSql = convertToPgSql(sql, params);
    
    // Check if it's an INSERT to handle lastID
    const upperSql = pgSql.sql.trim().toUpperCase();
    if (upperSql.startsWith('INSERT')) {
        // If query doesn't already have RETURNING, append it to get the ID
        let runSql = pgSql.sql;
        if (!upperSql.includes('RETURNING')) {
             runSql += ' RETURNING id';
        }
        
        try {
            const rows: any[] = await prisma.$queryRawUnsafe(runSql, ...pgSql.params);
            // Postgres returns the inserted row(s)
            // We assume the first row has the ID
            let lastID: string | number = 0;
            if (rows && rows.length > 0 && rows[0].id !== undefined) {
                lastID = rows[0].id;
            }
            
            // For changes, we assume 1 if successful insert
            return { changes: rows.length, lastID };
        } catch (e: any) {
            console.error("Error in db.run (INSERT):", e.message, "SQL:", runSql);
            throw e;
        }
    } else {
        try {
            const changes = await prisma.$executeRawUnsafe(pgSql.sql, ...pgSql.params);
            return { changes, lastID: 0 };
        } catch (e: any) {
            console.error("Error in db.run:", e.message, "SQL:", pgSql.sql);
            throw e;
        }
    }
  }

  async exec(sql: string): Promise<void> {
    const upperSql = sql.trim().toUpperCase();
    
    // Skip CREATE TABLE for tables managed by Prisma
    if (upperSql.startsWith('CREATE TABLE')) {
        const match = upperSql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (match) {
            const tableName = match[1].toLowerCase();
            // List of tables managed by Prisma (based on schema)
            const managedTables = [
                'users', 
                'courses', 
                'admin_users', 
                'notifications', 
                'scheduled_sessions', 
                'course_enrollments', 
                'course_materials', 
                'test_submissions', 
                'tests', 
                'test_questions',
                'timetable_entries',
                'channels',
                'channel_members',
                'channel_messages',
                'direct_messages',
                'announcements_board'
            ];
            
            if (managedTables.includes(tableName)) {
                // console.log(`Skipping CREATE TABLE for managed table: ${tableName}`);
                return;
            }
        }
    }
    
    // Convert SQLite AUTOINCREMENT to Postgres SERIAL (approximate)
    // Actually, we just remove AUTOINCREMENT because SERIAL or INT PRIMARY KEY handles it differently.
    // But since we only run this for unmanaged tables (user_credentials, tutor_ratings), 
    // and they don't use AUTOINCREMENT in the code we saw, we might be fine.
    // user_credentials: TEXT PRIMARY KEY
    // tutor_ratings: TEXT PRIMARY KEY
    // So we just run it.
    
    try {
        await prisma.$executeRawUnsafe(sql);
    } catch (e: any) {
        // Ignore "relation already exists" errors if we missed skipping
        if (e.code === '42P07') { // duplicate_table
             return;
        }
        console.error("Error in db.exec:", e.message);
        throw e;
    }
  }

  async close(): Promise<void> {
    // No-op for prisma, we keep connection open
  }
}

function convertToPgSql(sql: string, params: any[] = []): { sql: string, params: any[] } {
    let paramIndex = 1;
    // Replace ? with $1, $2...
    const newSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    return { sql: newSql, params };
}

// Deprecated: Use Prisma directly
async function getConnection() {
  return new PrismaSQLiteAdapter();
}

// Helper function to execute queries
async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const db = new PrismaSQLiteAdapter();
  return db.all<T>(query, params);
}

export { getConnection, executeQuery };
