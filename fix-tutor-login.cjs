
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const crypto = require('crypto');
const path = require('path');

const DB_PATH = path.resolve(process.cwd(), 'APP-Database.db');
const EMAIL = 'philanishoun4@gmail.com';
const PASSWORD = 'password123';

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log(`Connecting to database at ${DB_PATH}...`);
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    // 1. Check users table schema (id type)
    const tableInfo = await db.all(`PRAGMA table_info(users)`);
    console.log('Users table schema:', tableInfo.map(c => `${c.name} (${c.type})`).join(', '));

    // 2. Ensure user exists
    let user = await db.get('SELECT * FROM users WHERE email = ?', [EMAIL]);
    let userId;

    if (!user) {
      console.log('User not found. Creating user...');
      // Determine if we need to provide ID or if it's autoincrement
      // Based on prisma schema it is Int Autoincrement
      // But let's see if we can just insert without ID
      const now = new Date().toISOString();
      // Note: Prisma schema has password_hash in users, but server uses user_credentials.
      // We will provide a dummy hash in users if required, or null.
      // Prisma schema says String (not optional?), let's check.
      // Line 14: password_hash String
      // So we must provide it.
      
      const result = await db.run(
        `INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Philani Shoun', EMAIL, 'placeholder', 'tutor', now, now]
      );
      userId = result.lastID;
      console.log(`User created with ID: ${userId}`);
    } else {
      console.log(`User found with ID: ${user.id}. Updating role to tutor...`);
      userId = user.id;
      await db.run('UPDATE users SET role = ? WHERE id = ?', ['tutor', userId]);
    }

    // 3. Ensure user_credentials table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        email TEXT PRIMARY KEY,
        user_id TEXT,
        password_hash TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    // 4. Update password in user_credentials
    const hash = await hashPassword(PASSWORD);
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, user_id=excluded.user_id, updated_at=excluded.updated_at`,
      [EMAIL, userId, hash, now, now]
    );

    console.log(`Password set for ${EMAIL} to '${PASSWORD}'`);
    console.log('Role set to tutor.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.close();
  }
}

main();
