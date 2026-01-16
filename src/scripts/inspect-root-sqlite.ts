
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'APP-Database.db');
const db = new Database(dbPath);

console.log(`Inspecting database at: ${dbPath}`);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

console.log('Tables and row counts:');
for (const table of tables) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get();
    console.log(`${table.name}: ${count.count}`);
  } catch (e) {
    console.log(`${table.name}: Error - ${e.message}`);
  }
}
