import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'APP-Database.db');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = new Database(dbPath);

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create contact_messages table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Insert the contact message
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO contact_messages
      (id, name, email, subject, message, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'unread', ?, ?)
    `);

    stmt.run(id, name, email, subject, message, now, now);

    // Log the message for admin notification
    console.log(`New contact message from ${name} (${email}): ${subject}`);

    // TODO: In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, we store in database and admin can view in admin panel

    db.close();

    res.status(200).json({
      success: true,
      message: 'Message received! We will get back to you soon.'
    });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    db.close();
    res.status(500).json({
      error: 'Failed to send message. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
