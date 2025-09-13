import express from 'express';
import cors from 'cors';
import { getConnection } from '../lib/db';
import prisma from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { sendEmail, renderBrandedEmail, renderInvitationEmail } from '../lib/email';
import crypto from 'crypto';

// Resolve base path in both ESM and CJS
const resolvedDir = (typeof __dirname !== 'undefined')
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(resolvedDir, '..');
const uploadsDir = path.resolve(baseDir, '..', 'public', 'uploads');

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          'https://excellence-akademie.com',
          'https://www.excellence-akademie.com',
          'https://excellence-akademie.co.za',
          'https://www.excellence-akademie.co.za',
          'https://excellenceakademie.co.za',
          'https://www.excellenceakademie.co.za',
          'https://excellenceacademia.co.za',
          'https://www.excellenceacademia.co.za',
          'https://academe-2025.onrender.com',
          'https://academe-portal-2025.onrender.com',
          process.env.FRONTEND_URL
        ].filter(Boolean as any);

        try {
          const originUrl = new URL(origin);
          const originHost = originUrl.host;
          const allowedHosts = allowedOrigins.map((u: string) => new URL(u).host);
          const isAllowed = allowedHosts.some((h: string) => originHost === h);
          if (isAllowed) return callback(null, true);
        } catch {}

        callback(new Error('Not allowed by CORS'));
      }
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'https://academe-portal-2025.onrender.com'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS']
}));

// Preflight handler to avoid framework default errors
app.options('*', cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS']
}));

// Security and performance middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static uploads (images)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

// University Application content – return default payload if none exists
app.get('/api/admin/content/university-application', async (req, res) => {
  try {
    // Try to read from a canonical table if it exists; otherwise return defaults
    const record = await prisma.universityApplicationContent
      ?.findFirst({ where: { isActive: true } })
      .catch(() => null as any);
    if (record) {
      return res.json({
        success: true,
        services: record.services ?? '[]',
        requirements: record.requirements ?? '[]',
        process: record.process ?? '[]',
      });
    }
    // Default empty response (avoid 404 for better UX)
    return res.json({ success: true, services: '[]', requirements: '[]', process: '[]' });
  } catch (error) {
    console.error('University application content error:', error);
    return res.json({ success: true, services: '[]', requirements: '[]', process: '[]' });
  }
});

// Tutor ratings – lightweight storage in SQLite for now
async function ensureTutorRatingsTable() {
  const db = await getConnection();
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tutor_ratings (
        id TEXT PRIMARY KEY,
        tutor_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL
      );
    `);
  } finally {
    await db.close();
  }
}

app.post('/api/admin/content/tutors/:id/ratings', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const tutorId = String(req.params.id || '');
    const { rating, comment } = req.body || {};
    const r = Number(rating);
    if (!tutorId) return res.status(400).json({ success: false, error: 'Tutor ID is required' });
    if (!Number.isFinite(r) || r < 1 || r > 5) return res.status(400).json({ success: false, error: 'Rating must be 1-5' });

    await ensureTutorRatingsTable();
    const db = await getConnection();
    try {
      const id = (globalThis.crypto?.randomUUID?.() || require('crypto').randomUUID());
      const now = new Date().toISOString();
      await db.run(
        'INSERT INTO tutor_ratings (id, tutor_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)',
        [id, tutorId, r, String(comment || ''), now]
      );
      return res.json({ success: true, id });
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('Create tutor rating error:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit rating' });
  }
});

// Invite tutors (admin only)
app.post('/api/admin/tutors/invite', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { emails, department, tutorName } = req.body || {};
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'emails[] is required' });
    }
    const frontendBase = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
    const results: any[] = [];
    for (const email of emails) {
      const clean = String(email || '').trim().toLowerCase();
      if (!clean || !clean.includes('@')) continue;
      const token = jwt.sign({ email: clean, purpose: 'tutor-invite' }, JWT_SECRET, { expiresIn: '7d' });
      const link = `${frontendBase.replace(/\/$/, '')}/set-password?token=${encodeURIComponent(token)}`;
      const content = renderInvitationEmail({ recipientName: clean.split('@')[0], actionUrl: link, tutorName, department });
      const send = await sendEmail({ to: clean, subject: 'Tutor Invitation • Excellence Academia', content });
      results.push({ email: clean, sent: !!send.success });
    }
    return res.json({ success: true, invited: results });
  } catch (error) {
    console.error('Tutor invite error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send tutor invitations' });
  }
});

// Student auth: login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });
    await ensureCredentialsTable();
    const db = await getConnection();
    try {
      const row = await db.get('SELECT * FROM user_credentials WHERE email = ?', [String(email).toLowerCase()]);
      if (!row || !row.password_hash) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      const [scheme, salt, stored] = String(row.password_hash).split(':');
      if (scheme !== 'scrypt' || !salt || !stored) return res.status(500).json({ success: false, error: 'Invalid credential record' });
      const derived = await new Promise<string>((resolve, reject) => {
        crypto.scrypt(String(password), salt, 64, (err, dk) => err ? reject(err) : resolve(dk.toString('hex')));
      });
      if (derived !== stored) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      // load or create user
      const userEmail = String(email).toLowerCase();
      let user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!user) user = await prisma.user.create({ data: { email: userEmail, name: userEmail.split('@')[0], role: 'student' } });
      const token = jwt.sign({ id: user.id, email: user.email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
      const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
      res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax;${secure}`);
      return res.json({ success: true, user: { id: user.id, email: user.email, role: 'student' } });
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Student auth: logout
app.post('/api/auth/logout', (req, res) => {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;${secure}`);
  return res.json({ success: true });
});

// Current user (student/admin)
app.get('/api/auth/me', authenticateJWT, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// List users (basic) - for tutor student-management
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

// Admin stats for analytics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const totalCourses = await prisma.course.count().catch(() => 0 as any);
    const activeStudents = Math.round(totalStudents * 0.7);
    return res.json({ success: true, data: {
      totalStudents,
      activeStudents,
      courses: totalCourses,
      completionRate: 75,
      averageGrade: 82,
      monthlyGrowth: 12,
      courseStats: [],
      monthlyData: []
    }});
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
});

// Ensure credentials table exists (for student password storage)
async function ensureCredentialsTable() {
  const db = await getConnection();
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        email TEXT PRIMARY KEY,
        user_id TEXT,
        password_hash TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);
  } finally {
    await db.close();
  }
}

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

// Invite students (admin only)
app.post('/api/admin/students/invite', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { emails, courseName, tutorName, department } = req.body || {};
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'emails[] is required' });
    }
    const frontendBase = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
    const results: any[] = [];
    for (const email of emails) {
      const clean = String(email || '').trim().toLowerCase();
      if (!clean || !clean.includes('@')) continue;
      const token = jwt.sign({ email: clean, purpose: 'invite' }, JWT_SECRET, { expiresIn: '7d' });
      const link = `${frontendBase.replace(/\/$/, '')}/set-password?token=${encodeURIComponent(token)}`;
      const content = renderInvitationEmail({ recipientName: clean.split('@')[0], actionUrl: link, courseName, tutorName, department });
      const send = await sendEmail({ to: clean, subject: 'You are invited to Excellence Academia', content });
      results.push({ email: clean, sent: !!send.success });
    }
    return res.json({ success: true, invited: results });
  } catch (error) {
    console.error('Invite error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send invitations' });
  }
});

// Set password from invitation token
app.post('/api/auth/set-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Valid token and password (min 8 chars) are required' });
    }
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
    if (!payload.email || !['invite', 'tutor-invite'].includes(String(payload.purpose))) {
      return res.status(400).json({ success: false, error: 'Invalid token purpose' });
    }
    const email = String(payload.email).toLowerCase();
    await ensureCredentialsTable();
    const hash = await hashPassword(String(password));

    // Ensure User exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const role = payload.purpose === 'tutor-invite' ? 'tutor' : 'student';
      user = await prisma.user.create({ data: { email, name: email.split('@')[0], role } });
    }

    const db = await getConnection();
    try {
      const now = new Date().toISOString();
      await db.run(
        `INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, user_id=excluded.user_id, updated_at=excluded.updated_at`,
        [email, user.id, hash, now, now]
      );
    } finally {
      await db.close();
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Set password error:', error);
    return res.status(500).json({ success: false, error: 'Failed to set password' });
  }
});
app.use('/uploads', express.static(uploadsDir));

// Request compression for better performance
app.set('trust proxy', 1);

// Enhanced request logging with performance metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Basic cookie parser
function parseCookies(req) {
  const header = req.headers?.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const [key, ...v] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(v.join('='));
    return acc;
  }, {} as Record<string, string>);
}

// JWT auth helpers
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authenticateJWT(req, res, next) {
  try {
    const cookies = parseCookies(req);
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice('Bearer '.length)
      : undefined;
    const token = headerToken || cookies['admin_token'] || cookies['auth_token'];
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

function authorizeRoles(...allowedRoles: string[]) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error in ${req.method} ${req.path}:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.status || 500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check with database connectivity
app.get('/api/health', async (req, res) => {
  try {
    // Quick database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Admin auth endpoints
app.post('/api/admin/auth/login', async (req, res) => {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const { username, email, password } = req.body || {};
  const submittedId = (email || username || '').toString().trim();

  if (submittedId && submittedId === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username: submittedId, role: 'admin', exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) }, JWT_SECRET);
    const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict;${secure}`);
    return res.status(200).json({ success: true, message: 'Login successful', user: { username: submittedId, role: 'admin' } });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/admin/auth/verify', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

app.post('/api/admin/auth/logout', (req, res) => {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict;${secure}`);
  return res.status(200).json({ success: true, message: 'Logged out' });
});

// Optimized generic query endpoint with validation
app.post('/api/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid query string is required' 
      });
    }

    // Basic SQL injection protection - restrict dangerous operations
    const dangerousPatterns = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\b/i;
    if (dangerousPatterns.test(query)) {
      return res.status(403).json({ 
        success: false,
        error: 'Query contains restricted operations' 
      });
    }

    const db = await getConnection();
    const result = await db.all(query, params || []);
    await db.close();
    
    res.json({ 
      success: true,
      data: result,
      count: Array.isArray(result) ? result.length : 1,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database query failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Optimized User routes with caching headers
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id?.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID is required' 
      });
    }

    const db = await getConnection();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    await db.close();
    
    if (user) {
      // Set cache headers for better performance
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body || {};
    if (!id?.trim()) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const db = await getConnection();
    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      await db.close();
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const nextName = name !== undefined ? name : existing.name;
    const nextEmail = email !== undefined ? email : existing.email;
    const nextStatus = status !== undefined ? status : existing.status;
    await db.run('UPDATE users SET name = ?, email = ?, status = ?, updated_at = ? WHERE id = ?', [
      nextName,
      nextEmail,
      nextStatus,
      new Date().toISOString(),
      id,
    ]);
    const updated = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    await db.close();
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user (soft delete -> set status inactive)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id?.trim()) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const db = await getConnection();
    const result = await db.run('UPDATE users SET status = ? WHERE id = ?', ['inactive', id]);
    await db.close();
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// High-performance Course routes
app.get('/api/courses', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category } = req.query;
    const limitInt = Math.min(parseInt(limit) || 50, 100); // Max 100 items
    const offsetInt = Math.max(parseInt(offset) || 0, 0);
    
    const db = await getConnection();
    let query = 'SELECT * FROM courses';
    const params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitInt, offsetInt);
    
    const courses = await db.all(query, params);
    await db.close();
    
    // Cache for 10 minutes
    res.set('Cache-Control', 'public, max-age=600');
    res.json({ 
      success: true,
      data: courses,
      pagination: {
        limit: limitInt,
        offset: offsetInt,
        count: courses.length,
        hasMore: courses.length === limitInt
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch courses' 
    });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id?.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Course ID is required' 
      });
    }

    const db = await getConnection();
    const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    await db.close();
    
    if (course) {
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ success: true, data: course });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch course' 
    });
  }
});

// Create course
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, department, tutorId, startDate, endDate, category } = req.body;
    
    if (!title || !description || !department || !tutorId) {
      return res.status(400).json({ 
        success: false,
        error: 'title, description, department, and tutorId are required' 
      });
    }

    const db = await getConnection();
    const result = await db.run(
      'INSERT INTO courses (title, description, department, tutor_id, start_date, end_date, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, department, tutorId, startDate, endDate, category || department, new Date().toISOString()]
    );
    await db.close();

    const newCourse = {
      id: result.lastID.toString(),
      title,
      description,
      department,
      tutorId,
      startDate,
      endDate,
      category: category || department,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, data: newCourse });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create course' 
    });
  }
});

// Delete course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id?.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Course ID is required' 
      });
    }

    const db = await getConnection();
    const result = await db.run('DELETE FROM courses WHERE id = ?', [id]);
    await db.close();
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete course' 
    });
  }
});

// High-performance Tutors API with advanced filtering
app.get('/api/tutors', async (req, res) => {
  try {
    const { 
      subject, 
      rating, 
      limit = 20, 
      offset = 0, 
      search 
    } = req.query;
    
    const limitInt = Math.min(parseInt(limit) || 20, 50);
    const offsetInt = Math.max(parseInt(offset) || 0, 0);
    
    const whereConditions = { isActive: true };
    
    // Apply filters
    if (subject) {
      whereConditions.subjects = { contains: subject };
    }
    
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const tutors = await prisma.tutor.findMany({
      where: whereConditions,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limitInt,
      skip: offsetInt
    });

    // Efficiently calculate ratings
    const tutorsWithMetrics = tutors.map(tutor => {
      let ratings = [];
      let subjectsList = [];
      
      try {
        ratings = typeof tutor.ratings === 'string' ? JSON.parse(tutor.ratings) : (tutor.ratings || []);
        subjectsList = typeof tutor.subjects === 'string' ? JSON.parse(tutor.subjects) : (tutor.subjects || []);
      } catch (e) {
        console.warn('JSON parse error for tutor:', tutor.id);
      }
      
      const avgRating = ratings.length > 0 
        ? Math.round((ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length) * 10) / 10
        : 0;
      
      return {
        ...tutor,
        averageRating: avgRating,
        totalReviews: ratings.length,
        subjectsList,
        // Remove large JSON fields for list view
        ratings: undefined
      };
    });

    // Filter by rating if specified
    const filteredTutors = rating 
      ? tutorsWithMetrics.filter(t => t.averageRating >= parseFloat(rating))
      : tutorsWithMetrics;

    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.json({
      success: true,
      data: filteredTutors,
      pagination: {
        limit: limitInt,
        offset: offsetInt,
        count: filteredTutors.length,
        hasMore: filteredTutors.length === limitInt
      }
    });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tutors' 
    });
  }
});

app.get('/api/tutors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tutor = await prisma.tutor.findUnique({
      where: { id }
    });
    
    if (!tutor) {
      return res.status(404).json({ 
        success: false,
        error: 'Tutor not found' 
      });
    }
    
    // Parse JSON fields safely
    let ratings = [];
    let subjectsList = [];
    
    try {
      ratings = typeof tutor.ratings === 'string' ? JSON.parse(tutor.ratings) : (tutor.ratings || []);
      subjectsList = typeof tutor.subjects === 'string' ? JSON.parse(tutor.subjects) : (tutor.subjects || []);
    } catch (e) {
      console.warn('JSON parse error for tutor:', tutor.id);
    }
    
    const avgRating = ratings.length > 0 
      ? Math.round((ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length) * 10) / 10
      : 0;
    
    const enhancedTutor = {
      ...tutor,
      averageRating: avgRating,
      totalReviews: ratings.length,
      subjectsList,
      ratingsList: ratings
    };

    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes cache
    res.json({ success: true, data: enhancedTutor });
  } catch (error) {
    console.error('Error fetching tutor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tutor' 
    });
  }
});

// High-performance Content API with comprehensive caching
app.get('/api/admin/content/:type', async (req, res) => {
  try {
    const contentType = req.params.type;
    let content;
    let cacheTime = 600; // 10 minutes default
    
    const contentQueries = {
      'tutors': async () => {
        const tutors = await prisma.tutor.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] 
        });
        
        return tutors.map(tutor => {
          let ratings = [];
          try {
            ratings = typeof tutor.ratings === 'string' ? JSON.parse(tutor.ratings) : (tutor.ratings || []);
          } catch (e) {
            console.warn('Ratings parse error:', tutor.id);
          }
          
          const avgRating = ratings.length > 0 
            ? Math.round((ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length) * 10) / 10
            : 0;
          
          return {
            ...tutor,
            averageRating: avgRating,
            totalReviews: ratings.length
          };
        });
      },
      'team-members': () => prisma.teamMember.findMany({ 
        where: { isActive: true }, 
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] 
      }),
      'about-us': () => prisma.aboutUsContent.findFirst({ 
        where: { isActive: true }, 
        orderBy: { updatedAt: 'desc' } 
      }),
      'hero': () => prisma.heroContent.findFirst({ 
        orderBy: { updatedAt: 'desc' } 
      }),
      'features': () => prisma.feature.findMany({ 
        where: { isActive: true }, 
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
      }),
      'announcements': () => prisma.announcement.findMany({ 
        where: { isActive: true }, 
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] 
      }),
      'testimonials': () => prisma.testimonial.findMany({ 
        where: { isActive: true }, 
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] 
      }),
      'pricing': () => prisma.pricingPlan.findMany({ 
        where: { isActive: true }, 
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
      }),
      'events': () => prisma.$queryRawUnsafe('SELECT * FROM events ORDER BY date ASC'),
      'footer': () => prisma.footerContent.findFirst({ 
        where: { isActive: true }, 
        orderBy: { updatedAt: 'desc' } 
      }),
      'subjects': () => prisma.subject.findMany({ 
        where: { isActive: true }, 
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
      }),
      'navigation': () => prisma.navigationItem.findMany({ 
        where: { isActive: true }, 
        select: { path: true, label: true, type: true }, 
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
      }),
      'exam-rewrite': () => prisma.examRewriteContent.findFirst({ 
        where: { isActive: true }, 
        orderBy: { updatedAt: 'desc' } 
      }),
      'university-application': () => prisma.universityApplicationContent.findFirst({ 
        where: { isActive: true }, 
        orderBy: { updatedAt: 'desc' } 
      }),
      'contact-us': () => prisma.contactUsContent.findFirst({ 
        where: { isActive: true }, 
        orderBy: { updatedAt: 'desc' } 
      }),
      'become-tutor': () => prisma.becomeTutorContent.findFirst({ 
        where: { isActive: true }, 
        orderBy: { updatedAt: 'desc' } 
      })
    };

    const queryFn = contentQueries[contentType];
    
    if (!queryFn) {
      return res.status(404).json({ 
        success: false,
        error: 'Content type not found',
        availableTypes: Object.keys(contentQueries)
      });
    }

    content = await queryFn();

    if (content !== null && content !== undefined) {
      const listTypes = [
        'tutors', 'team-members', 'features', 'testimonials', 
        'pricing', 'subjects', 'announcements', 'events', 'navigation'
      ];
      
      res.set('Cache-Control', `public, max-age=${cacheTime}`);
      res.json({ 
        success: true,
        data: content,
        type: contentType,
        isArray: listTypes.includes(contentType),
        count: Array.isArray(content) ? content.length : 1,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: `${contentType} content not found` 
      });
    }
  } catch (error) {
    console.error(`Error fetching ${req.params.type} content:`, error);
    // In production, avoid leaking error details
    const status = 500;
    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd ? 'Failed to fetch content' : (error as any)?.message;
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch ${req.params.type} content`,
      message
    });
  }
});

// Content configuration for CRUD
const contentConfig = {
  'features': { model: () => prisma.feature, jsonFields: ['benefits'], isSingleton: false },
  'testimonials': { model: () => prisma.testimonial, jsonFields: [], isSingleton: false },
  'team-members': { model: () => prisma.teamMember, jsonFields: [], isSingleton: false },
  'pricing': { model: () => prisma.pricingPlan, jsonFields: ['features', 'notIncluded'], isSingleton: false },
  'announcements': { model: () => prisma.announcement, jsonFields: [], isSingleton: false },
  'subjects': { model: () => prisma.subject, jsonFields: ['popularTopics', 'difficulty'], isSingleton: false },
  'navigation': { model: () => prisma.navigationItem, jsonFields: [], isSingleton: false },
  'tutors': { model: () => prisma.tutor, jsonFields: ['subjects', 'ratings'], isSingleton: false },
  'footer': { model: () => prisma.footerContent, jsonFields: ['socialLinks', 'quickLinks', 'resourceLinks'], isSingleton: true },
  'hero': { model: () => prisma.heroContent, jsonFields: ['universities', 'features'], isSingleton: true },
  'about-us': { model: () => prisma.aboutUsContent, jsonFields: ['rolesResponsibilities'], isSingleton: true },
  'contact-us': { model: () => prisma.contactUsContent, jsonFields: ['contactInfo'], isSingleton: true },
  'exam-rewrite': { model: () => prisma.examRewriteContent, jsonFields: ['benefits', 'process', 'subjects', 'pricingInfo'], isSingleton: true },
  'university-application': { model: () => prisma.universityApplicationContent, jsonFields: ['services', 'process', 'requirements', 'pricing'], isSingleton: true },
  'become-tutor': { model: () => prisma.becomeTutorContent, jsonFields: ['requirements', 'benefits'], isSingleton: true }
} as const;

function stringifyJsonFields(data: Record<string, any>, fields: string[]) {
  const out: Record<string, any> = { ...data };
  for (const f of fields) {
    if (out[f] !== undefined) out[f] = JSON.stringify(out[f]);
  }
  return out;
}

function parseJsonFields(entity: any, fields: string[]) {
  if (!entity) return entity;
  const out: any = { ...entity };
  for (const f of fields) {
    try {
      out[f] = entity[f] ? JSON.parse(entity[f]) : (Array.isArray(out[f]) ? out[f] : (out[f] ?? null));
    } catch {
      // ignore parse errors
    }
  }
  return out;
}

// Create content
app.post('/api/admin/content/:type', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { type } = req.params as { type: keyof typeof contentConfig };
    const cfg = contentConfig[type];
    if (!cfg) return res.status(404).json({ success: false, error: 'Content type not found' });
    const model = cfg.model();
    const payload = stringifyJsonFields(req.body || {}, cfg.jsonFields);

    let created;
    if (cfg.isSingleton) {
      await model.updateMany({ where: { isActive: true }, data: { isActive: false } });
      created = await model.create({ data: { ...payload, isActive: true } });
    } else {
      created = await model.create({ data: { ...payload, isActive: true } });
    }

    const parsed = parseJsonFields(created, cfg.jsonFields);
    return res.status(201).json({ success: true, data: parsed });
  } catch (error) {
    console.error('Content create error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create content' });
  }
});

// Update content
app.put('/api/admin/content/:type', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { type } = req.params as { type: keyof typeof contentConfig };
    const cfg = contentConfig[type];
    if (!cfg) return res.status(404).json({ success: false, error: 'Content type not found' });
    const model = cfg.model();
    const { id, ...rest } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
    const data = stringifyJsonFields(rest, cfg.jsonFields);
    const updated = await model.update({ where: { id }, data });
    const parsed = parseJsonFields(updated, cfg.jsonFields);
    return res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    console.error('Content update error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update content' });
  }
});

// Delete content (soft delete where applicable)
app.delete('/api/admin/content/:type', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { type } = req.params as { type: keyof typeof contentConfig };
    const cfg = contentConfig[type];
    if (!cfg) return res.status(404).json({ success: false, error: 'Content type not found' });
    const model = cfg.model();
    const id = (req.query.id as string) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
    await model.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Content delete error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete content' });
  }
});

// Image upload endpoint (base64)
app.post('/api/admin/upload', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { file, fileName } = req.body || {};
    if (!file || typeof file !== 'string') {
      return res.status(400).json({ success: false, error: 'file (base64) is required' });
    }

    const match = /^data:(image\/(png|jpeg|jpg|webp|svg\+xml));base64,(.+)$/i.exec(file);
    if (!match) return res.status(400).json({ success: false, error: 'Invalid image data URL' });
    const mime = match[1];
    const ext = mime.includes('svg') ? 'svg' : mime.split('/')[1].replace('jpeg', 'jpg');
    const base64 = match[3];
    const buffer = Buffer.from(base64, 'base64');

    await fs.mkdir(uploadsDir, { recursive: true });
    const safeBase = (fileName?.toString().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'image');
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = `${safeBase}-${unique}.${ext}`;
    const fullPath = path.join(uploadsDir, name);
    await fs.writeFile(fullPath, buffer);

    // Public URL
    const urlPath = `/uploads/${name}`;
    return res.status(201).json({ success: true, url: urlPath, mime, size: buffer.length });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

// Contact email endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'name, email, and message are required' });
    }
    const to = process.env.CONTACT_EMAIL || 'admin@excellenceacademia.com';
    const adminHtml = renderBrandedEmail({
      title: 'New Contact Form Submission',
      message: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${(message || '').replace(/\n/g, '<br/>')}</p>
      `,
      footerNote: 'A visitor submitted this message via the contact form.',
    });
    const adminSend = await sendEmail({ to, subject: subject || 'New Contact Message', content: adminHtml });

    // Optional: send acknowledgement to user (best UX)
    if (email) {
      const ackHtml = renderBrandedEmail({
        title: 'We received your message',
        message: `
          <p>Hi ${name},</p>
          <p>We received your message and will get back to you shortly.</p>
          <p>Best regards,<br/>Excellence Academia</p>
        `,
      });
      try { await sendEmail({ to: email, subject: 'We received your message', content: ackHtml }); } catch {}
    }

    if (!adminSend.success) throw new Error('Email send failed');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact email error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Admin test email endpoint (for verifying RESEND configuration)
app.post('/api/admin/test-email', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const to = (req.body && req.body.to) || (process.env.CONTACT_EMAIL || 'admin@excellenceacademia.com');
    const html = renderBrandedEmail({
      title: 'Test Email from Excellence Academia',
      message: '<p>This is a test email to verify your email delivery configuration.</p>',
    });
    const sent = await sendEmail({ to, subject: 'Test Email', content: html });
    return res.status(200).json({ success: true, result: sent });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send test email' });
  }
});

// Tests API endpoints
app.post('/api/tests', async (req, res) => {
  try {
    const { title, description, dueDate, courseId, questions, totalPoints } = req.body;
    
    if (!title || !courseId) {
      return res.status(400).json({ 
        success: false,
        error: 'title and courseId are required' 
      });
    }

    const db = await getConnection();
    const result = await db.run(
      'INSERT INTO tests (title, description, due_date, course_id, questions, total_points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, dueDate, courseId, JSON.stringify(questions || []), totalPoints || 0, new Date().toISOString()]
    );
    await db.close();

    const newTest = {
      id: result.lastID.toString(),
      title,
      description,
      dueDate,
      courseId,
      questions: questions || [],
      totalPoints: totalPoints || 0,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, data: newTest });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create test' 
    });
  }
});

// List tests
app.get('/api/tests', async (req, res) => {
  try {
    const db = await getConnection();
    const tests = await db.all('SELECT * FROM tests ORDER BY created_at DESC');
    await db.close();
    res.set('Cache-Control', 'public, max-age=300');
    return res.json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tests' });
  }
});

// Bulk students creation endpoint
app.post('/api/students/bulk', async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'emails array is required' 
      });
    }

    const db = await getConnection();
    const ids = [];
    
    for (const email of emails) {
      if (email && email.includes('@')) {
        const name = email
          .split("@")[0]
          .replace(/[.]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        
        const result = await db.run(
          'INSERT INTO users (name, email, role, created_at) VALUES (?, ?, ?, ?)',
          [name, email, 'student', new Date().toISOString()]
        );
        ids.push(result.lastID.toString());
      }
    }
    
    await db.close();

    res.status(201).json({ success: true, ids, count: ids.length });
  } catch (error) {
    console.error('Error creating bulk students:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create students' 
    });
  }
});

// Notifications endpoint
app.post('/api/notifications', async (req, res) => {
  try {
    const { title, message, type, recipients } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title and message are required' });
    }

    // Save notification to database
    const db = await getConnection();
    const result = await db.run(
      'INSERT INTO notifications (title, message, type, recipients, created_at) VALUES (?, ?, ?, ?, ?)',
      [title, message, type || 'system', JSON.stringify(recipients || {}), new Date().toISOString()]
    );
    await db.close();

    // Send emails to recipients
    if (recipients) {
      const emails = [];
      
      if (recipients.tutors) {
        const tutors = await prisma.tutor.findMany({ where: { isActive: true }, select: { contactEmail: true } });
        emails.push(...tutors.map(t => t.contactEmail).filter(Boolean));
      }
      
      if (recipients.students) {
        const students = await prisma.user.findMany({ where: { role: 'student' }, select: { email: true } });
        emails.push(...students.map(s => s.email).filter(Boolean));
      }
      
      if (recipients.specific && Array.isArray(recipients.specific)) {
        emails.push(...recipients.specific);
      }

      // Send emails
      const brandColor = '#4f46e5';
      const emailPromises = emails.map(email => {
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
            <table width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="background:${brandColor}; padding:18px 24px; color:#fff;">
                  <h2 style="margin:0; font-size:18px;">Excellence Academia</h2>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h3 style="margin:0 0 8px; font-size:20px; color:#0f172a;">${title}</h3>
                  <p style="margin:0 0 16px; line-height:1.6; color:#334155;">${message}</p>
                  <div style="margin-top:16px; padding:12px 16px; background:#f1f5f9; border-radius:8px; color:#475569; font-size:12px;">
                    This is an automated notification. Please do not reply to this email.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px; border-top:1px solid #e2e8f0; color:#64748b; font-size:12px;">
                  © ${new Date().getFullYear()} Excellence Academia. All rights reserved.
                </td>
              </tr>
            </table>
          </div>
        `;
        return sendEmail({ to: email, subject: title, content: html });
      });

      await Promise.allSettled(emailPromises);
    }

    return res.status(201).json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// List notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const db = await getConnection();
    const notifications = await db.all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200');
    await db.close();
    res.set('Cache-Control', 'public, max-age=120');
    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Students list
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      orderBy: { updatedAt: 'desc' },
      include: {
        enrollments: { include: { course: true } },
      },
    });
    const result = students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      status: (s as any).status || 'active',
      progress: Math.floor(Math.random() * 100),
      lastActivity: (s.updatedAt as Date).toISOString(),
      enrolledCourses: (s.enrollments || []).map((e: any) => e.course?.id).filter(Boolean),
      joinDate: (s.createdAt as Date).toISOString(),
      totalAssignments: Math.floor(Math.random() * 12),
      completedAssignments: Math.floor(Math.random() * 12),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Student')}&background=random`,
    }));
    res.set('Cache-Control', 'public, max-age=120');
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

// Student Dashboard
app.get('/api/student/dashboard', async (req, res) => {
  try {
    const studentId = (req.query.studentId as string) || (req as any).user?.id;
    if (!studentId) return res.status(400).json({ success: false, error: 'Student ID is required' });

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            tests: {
              include: {
                submissions: { where: { userId: studentId } }
              }
            }
          }
        }
      }
    });

    const testSubmissions = await prisma.testSubmission.findMany({
      where: { userId: studentId },
      include: { test: { include: { course: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const averageGrade = testSubmissions.length > 0
      ? testSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / testSubmissions.length
      : 0;

    const courses = enrollments.map(e => {
      const course = e.course as any;
      const courseTests = (course.tests || []) as any[];
      const completedTests = courseTests.filter(t => t.submissions && t.submissions.length > 0);
      return {
        id: course.id,
        name: course.title,
        description: course.description,
        tutor: 'Dr. Smith',
        tutorEmail: 'dr.smith@example.com',
        nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        progress: courseTests.length > 0 ? (completedTests.length / courseTests.length) * 100 : 0,
        materials: [
          { id: '1', name: 'Course Syllabus', type: 'pdf', url: '/materials/syllabus.pdf', dateAdded: new Date().toISOString(), completed: true },
          { id: '2', name: 'Lecture Notes - Chapter 1', type: 'pdf', url: '/materials/lecture-1.pdf', dateAdded: new Date().toISOString(), completed: false }
        ],
        tests: courseTests.map(t => ({ id: t.id, title: t.title, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), questions: 10, totalPoints: 100, status: (t.submissions && t.submissions.length > 0) ? 'completed' : 'upcoming', score: (t.submissions && t.submissions.length > 0) ? t.submissions[0].score : null })),
        color: 'blue',
        announcements: [ { id: '1', title: 'Important: Midterm Exam Next Week', content: 'Please prepare for the midterm exam scheduled for next Tuesday.', date: new Date().toISOString(), type: 'info' } ],
        grade: averageGrade,
        enrollmentDate: new Date().toISOString(),
        status: e.status
      };
    });

    const dashboardData = {
      student: { id: student.id, name: student.name, email: student.email, avatar: `https://ui-avatars.com/api/?name=${student.name}&background=random` },
      statistics: {
        totalCourses: enrollments.length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length,
        activeCourses: enrollments.filter(e => e.status === 'enrolled').length,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalStudyHours: 45,
        streak: 7
      },
      upcomingSessions: [
        { id: '1', courseName: 'Mathematics Grade 12', tutorName: 'Dr. Smith', date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), time: '10:00 AM', duration: '60 minutes', type: '1-on-1', location: 'Online' }
      ],
      recentActivities: [
        { id: '1', type: 'assignment_submitted', message: 'Submitted Mathematics assignment', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), courseName: 'Mathematics Grade 12' }
      ],
      courses,
      notifications: notifications.map(n => ({ id: n.id, message: n.message, read: n.read, timestamp: (n.createdAt as Date).toISOString() })),
      achievements: [ { id: '1', title: 'First Assignment', description: 'Completed your first assignment', icon: '🎯', unlocked: true, date: new Date().toISOString() } ]
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch student dashboard' });
  }
});

// Tutor Dashboard
app.get('/api/tutor/dashboard', async (req, res) => {
  try {
    const tutorId = (req.query.tutorId as string) || (req as any).user?.id;
    if (!tutorId) return res.status(400).json({ success: false, error: 'Tutor ID is required' });

    const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
    if (!tutor) return res.status(404).json({ success: false, error: 'Tutor not found' });

    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: { enrollments: { include: { course: true } } }
    });

    const courses = await prisma.course.findMany({
      include: {
        enrollments: { include: { user: true } },
        tests: { include: { submissions: true } }
      }
    });

    const notifications = await prisma.notification.findMany({ where: { userId: tutorId }, orderBy: { createdAt: 'desc' }, take: 10 });

    const dashboardData = {
      tutor: {
        id: tutor.id,
        name: tutor.name,
        subjects: (() => { try { return JSON.parse(tutor.subjects || '[]'); } catch { return []; } })(),
        contactEmail: tutor.contactEmail,
        contactPhone: tutor.contactPhone,
        description: tutor.description,
        image: tutor.image
      },
      statistics: {
        totalStudents: students.length,
        totalCourses: courses.length,
        activeStudents: students.filter(s => s.enrollments.some(e => e.status === 'enrolled')).length,
        completedSessions: 45,
        averageRating: 4.8,
        totalEarnings: 12500
      },
      upcomingSessions: [ { id: '1', courseName: 'Mathematics Grade 12', studentName: 'John Doe', studentEmail: 'john@example.com', date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), time: '10:00 AM', duration: 60, type: '1-on-1', status: 'scheduled', location: 'Online', notes: 'Focus on calculus problems', materials: [] } ],
      recentActivities: [ { id: '1', type: 'session_completed', message: 'Completed session with John Doe - Mathematics', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), studentName: 'John Doe' } ],
      students: students.map(s => ({ id: s.id, name: s.name, email: s.email, progress: Math.floor(Math.random() * 100), lastActivity: (s.updatedAt as Date).toISOString(), status: 'active', enrolledCourses: s.enrollments.map(e => e.course.title), avatar: `https://ui-avatars.com/api/?name=${s.name}&background=random`, grades: {}, totalSessions: 0, nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })),
      courses: courses.map(c => ({ id: c.id, name: c.title, description: c.description, students: c.enrollments.length, nextSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), progress: Math.floor(Math.random() * 100), materials: [], tests: c.tests.map(t => ({ id: t.id, title: t.title, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), submissions: t.submissions.length, totalPoints: 100 })), color: 'blue' })),
      notifications: notifications.map(n => ({ id: n.id, message: n.message, read: n.read, timestamp: (n.createdAt as Date).toISOString() }))
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching tutor dashboard:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tutor dashboard' });
  }
});

// Optimized statistics endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [
      tutorsCount,
      subjectsCount,
      testimonialsCount,
      activeAnnouncementsCount
    ] = await Promise.all([
      prisma.tutor.count({ where: { isActive: true } }),
      prisma.subject.count({ where: { isActive: true } }),
      prisma.testimonial.count({ where: { isActive: true } }),
      prisma.announcement.count({ where: { isActive: true } })
    ]);

    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.json({
      success: true,
      data: {
        tutors: tutorsCount,
        subjects: subjectsCount,
        testimonials: testimonialsCount,
        announcements: activeAnnouncementsCount,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics' 
    });
  }
});

// Database initialization (schema only, no seeding)
async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    const db = await getConnection();
    const schemaFiles = [
      path.join(baseDir, 'database', 'schema.sql'),
      path.join(baseDir, 'database', 'content-schema.sql')
    ];
    
    for (const file of schemaFiles) {
      try {
        const sql = await fs.readFile(file, 'utf8');
        const statements = sql
          .split(/;\s*\n/)
          .map(s => s.trim())
          .filter(Boolean);
        
        for (const stmt of statements) {
          try {
            await db.exec(stmt + ';');
          } catch (e) {
            // Ignore table exists errors in production
            if (!e.message.includes('already exists')) {
              console.warn(`Statement execution warning:`, e.message);
            }
          }
        }
        console.log(`✓ Executed ${file}`);
      } catch (e) {
        console.warn(`⚠️ File ${file} not found:`, e.message);
      }
    }
    await db.close();
    console.log('✓ Database schema initialization completed');
  } catch (e) {
    console.error('❌ Database initialization failed:', e);
    throw e;
  }
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await prisma.$disconnect();
    console.log('✓ Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Excellence Akademie API Server...');
    
    // Initialize database schema
    await initializeDatabase();
    
    // Start server
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${port}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Health check: http://localhost:${port}/api/health`);
      console.log(`✓ Tutors API: http://localhost:${port}/api/tutors`);
      console.log(`✓ Ready for connections!`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Prevent server timeout on Render
    server.keepAliveTimeout = 120000; // 2 minutes
    server.headersTimeout = 120000; // 2 minutes
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();