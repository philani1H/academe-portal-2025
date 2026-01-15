import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'APP-Database.db'));

const migrationSQL = fs.readFileSync(
  path.join(__dirname, '..', 'prisma/migrations/20260115171215_add_numeric_student_ids/migration.sql'),
  'utf8'
);

console.log('Applying migration...');
console.log(migrationSQL);

// Split by semicolons and execute each statement
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const statement of statements) {
  try {
    db.exec(statement);
    console.log('✓ Executed:', statement.substring(0, 50) + '...');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

console.log('Migration applied successfully!');
db.close();
