
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const DB_PATH = path.join(__dirname, 'local_data.db');

async function fixLogin() {
  console.log('Fixing login credentials for philanishoun4@gmail.com...');

  // 1. Generate scrypt hash
  const password = 'password123';
  const salt = crypto.randomBytes(16).toString('hex');
  
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });

  const passwordHash = `scrypt:${salt}:${derivedKey}`;
  const email = 'philanishoun4@gmail.com';

  // 2. Update/Insert into SQLite user_credentials
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        email TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    const existing = await db.get('SELECT * FROM user_credentials WHERE email = ?', [email]);
    if (existing) {
      console.log('Updating existing credentials...');
      await db.run(
        'UPDATE user_credentials SET password_hash = ?, updated_at = ? WHERE email = ?',
        [passwordHash, new Date().toISOString(), email]
      );
    } else {
      console.log('Inserting new credentials...');
      await db.run(
        'INSERT INTO user_credentials (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [email, passwordHash, new Date().toISOString(), new Date().toISOString()]
      );
    }
    console.log('✅ Credentials set successfully.');

  } catch (err) {
    console.error('Error updating credentials:', err);
  } finally {
    await db.close();
  }

  // 3. Update/Insert into Prisma User table with 'tutor' role
  try {
    const user = await prisma.user.upsert({
      where: { email: email },
      update: { role: 'tutor' },
      create: {
        email: email,
        name: 'Philani Shoun',
        role: 'tutor',
        password_hash: passwordHash // Required by Prisma schema
      }
    });
    console.log(`✅ User role set to '${user.role}' in Prisma DB.`);
  } catch (err) {
    console.error('Error updating Prisma user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixLogin();
