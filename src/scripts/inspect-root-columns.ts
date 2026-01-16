
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'APP-Database.db');
const db = new Database(dbPath);

function inspectTable(tableName: string) {
    console.log(`--- ${tableName} ---`);
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    console.log('Columns:', columns.map((c: any) => c.name).join(', '));
    
    const rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT 1`).all();
    if (rows.length > 0) {
        console.log('Sample Row:', rows[0]);
    } else {
        console.log('No data');
    }
}

inspectTable('user_credentials');
inspectTable('announcements');
inspectTable('announcements_board');
inspectTable('users');
inspectTable('courses');
inspectTable('admin_users');
