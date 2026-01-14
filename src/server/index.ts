import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getConnection } from '../lib/db';
import prisma from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { sendEmail, renderBrandedEmail, renderInvitationEmail, renderBrandedEmailPreview, renderStudentCredentialsEmail } from '../lib/email';
import crypto from 'crypto';
import multer from 'multer';

// Resolve base path in both ESM and CJS
const resolvedDir = (typeof __dirname !== 'undefined')
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(resolvedDir, '..');
const uploadsDir = path.resolve(baseDir, '..', 'public', 'uploads');

// Ensure uploads directory exists
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Store active live sessions in memory (courseId -> sessionData)
const activeSessions = new Map<string, any>();

// Scheduled session checker
let scheduledSessionChecker: NodeJS.Timeout;

const startScheduledSessionChecker = () => {
  console.log('✓ Starting scheduled session checker...');

  scheduledSessionChecker = setInterval(async () => {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // Check sessions starting in next 5 minutes

      const scheduledSessions = await prisma.scheduledSession.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: {
            gte: now,
            lte: fiveMinutesFromNow
          }
        },
        include: {
          course: true,
          tutor: true
        }
      });

      for (const session of scheduledSessions) {
        console.log(`Auto-starting scheduled session: ${session.title} for course ${session.course.name}`);

        // Generate session ID
        const sessionId = `${session.courseId}-${Date.now()}`;

        // Update session status and set sessionId
        await prisma.scheduledSession.update({
          where: { id: session.id },
          data: {
            status: 'active',
            sessionId: sessionId
          }
        });

        // Start the session (same logic as session-started handler)
        activeSessions.set(String(session.courseId), {
          sessionId,
          courseId: session.courseId,
          tutorName: session.tutor.name,
          message: `${session.tutor.name} started a scheduled live session!`
        });

        // Broadcast to all students enrolled in the course
        io.to(`course:${session.courseId}`).emit('session-live', {
          sessionId,
          courseId: session.courseId,
          tutorName: session.tutor.name,
          message: `${session.tutor.name} started a scheduled live session!`
        });

        // Send emails to enrolled students
        try {
          const course = await prisma.course.findUnique({
            where: { id: session.courseId },
            include: {
              courseEnrollments: {
                include: { user: true }
              }
            }
          });

          if (course && course.courseEnrollments.length > 0) {
            const frontendBase = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
            const sessionLink = `${frontendBase}/student/dashboard?joinSession=${sessionId}&courseId=${session.courseId}&tutorName=${encodeURIComponent(session.tutor.name)}`;

            console.log(`Sending scheduled session emails to ${course.courseEnrollments.length} students...`);

            await Promise.all(course.courseEnrollments.map(async (enrollment) => {
              const student = enrollment.user;
              if (student.email) {
                const content = `
                  <div style="font-family: sans-serif; color: #333;">
                    <h2>Scheduled Live Session Started!</h2>
                    <p>Hi ${student.name},</p>
                    <p>The scheduled live session "<strong>${session.title}</strong>" for <strong>${course.name}</strong> has started.</p>
                    <p><strong>Tutor:</strong> ${session.tutor.name}</p>
                    <p><strong>Duration:</strong> ${session.duration} minutes</p>
                    <br/>
                    <a href="${sessionLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Live Session</a>
                    <br/><br/>
                    <p>See you there!</p>
                  </div>
                `;
                try {
                  await sendEmail({
                    to: student.email,
                    subject: `🔴 Scheduled Session Live: ${session.title}`,
                    content
                  });
                } catch (e) {
                  console.error(`Failed to send email to ${student.email}`, e);
                }
              }
            }));
          }
        } catch (error) {
          console.error('Error sending scheduled session emails:', error);
        }

        console.log(`Scheduled session ${session.title} started successfully`);
      }
    } catch (error) {
      console.error('Error checking scheduled sessions:', error);
    }
  }, 60000); // Check every minute
};

const stopScheduledSessionChecker = () => {
  if (scheduledSessionChecker) {
    clearInterval(scheduledSessionChecker);
    console.log('✓ Stopped scheduled session checker');
  }
};

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// Enhanced CORS configuration
const isProd = process.env.NODE_ENV === 'production';
const corsOptions = {
  origin: isProd
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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
    : true, // in development, allow all origins so Vite LAN hosts work
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS']
};

app.use(cors(corsOptions as any));
app.use(express.json());

// Timetable API
const timetableFile = path.resolve(resolvedDir, 'data', 'timetable.json');

// Ensure data directory exists
fs.mkdir(path.dirname(timetableFile), { recursive: true }).catch(console.error);

app.get('/api/timetable', async (req, res) => {
    try {
        const data = await fs.readFile(timetableFile, 'utf-8');
        res.json({ data: JSON.parse(data) });
    } catch (error) {
        // If file doesn't exist, return empty array
        res.json({ data: [] });
    }
});

app.post('/api/timetable', async (req, res) => {
    try {
        const { timetable } = req.body;
        
        // Read existing for diffing
        let existing: any[] = [];
        try {
            const fileData = await fs.readFile(timetableFile, 'utf-8');
            existing = JSON.parse(fileData);
        } catch (e) {
            // ignore
        }

        // Find new entries
        const existingIds = new Set(existing.map((e: any) => e.id));
        const newEntries = Array.isArray(timetable) ? timetable.filter((e: any) => !existingIds.has(e.id)) : [];

        // Save updated timetable
        await fs.writeFile(timetableFile, JSON.stringify(timetable, null, 2));
        res.json({ success: true });

        // Send emails for new entries asynchronously
        if (newEntries.length > 0) {
            console.log(`Found ${newEntries.length} new timetable entries. Sending emails...`);
            (async () => {
                for (const entry of newEntries) {
                    try {
                        // Find course by name (fuzzy match)
                        if (!entry.courseName) continue;
                        
                        const course = await prisma.course.findFirst({
                            where: { name: { contains: entry.courseName } },
                            include: {
                                courseEnrollments: {
                                    include: { user: true }
                                }
                            }
                        });

                        if (course && course.courseEnrollments.length > 0) {
                             const frontendBase = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
                             
                             await Promise.all(course.courseEnrollments.map(async (enrollment) => {
                                const student = enrollment.user;
                                if (student.email) {
                                    const content = `
                                        <div style="font-family: sans-serif; color: #333;">
                                            <h2>New Class Scheduled</h2>
                                            <p>Hi ${student.name},</p>
                                            <p>A new class has been scheduled for <strong>${course.name}</strong>.</p>
                                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                                <p><strong>Topic:</strong> ${entry.type} - ${entry.courseName}</p>
                                                <p><strong>Time:</strong> ${entry.day}, ${entry.time}</p>
                                                <p><strong>Tutor:</strong> ${entry.tutorName}</p>
                                            </div>
                                            <a href="${frontendBase}/student/dashboard?tab=timetable" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Timetable</a>
                                        </div>
                                    `;
                                    await sendEmail({
                                        to: student.email,
                                        subject: `📅 New Class: ${entry.courseName}`,
                                        content
                                    });
                                }
                             }));
                        }
                    } catch (err) {
                        console.error('Error processing timetable email:', err);
                    }
                }
            })();
        }

    } catch (error) {
        console.error('Error saving timetable:', error);
        res.status(500).json({ error: 'Failed to save timetable' });
    }
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to avoid collisions and invalid characters
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // Limit file size to 500MB
    }
});

// Upload endpoint for course materials
app.post('/api/upload/material', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { courseId, type, name, description } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!courseId) {
            // Clean up file if no courseId
            await fs.unlink(file.path).catch(console.error);
            return res.status(400).json({ error: 'Course ID is required' });
        }

        // Create URL (relative path)
        const fileUrl = `/uploads/${file.filename}`;

        console.log(`File uploaded: ${file.filename} for course ${courseId}`);

        // Save to database
        const material = await prisma.courseMaterial.create({
            data: {
                courseId: parseInt(courseId),
                name: name || file.originalname,
                type: type || 'video',
                url: fileUrl,
                description: description || 'Live session recording'
            }
        });

        res.json({ success: true, material });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload material' });
    }
});

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: isProd ? undefined : "*", // Allow all in dev
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  socket.on('join-course-room', async (courseIds) => {
    if (Array.isArray(courseIds)) {
        // Optional: verify enrollment if possible
        // For now, we trust the client's enrollment list
        courseIds.forEach(id => socket.join(`course:${id}`));
        console.log(`Socket ${socket.id} joined course rooms: ${courseIds.join(', ')}`);
    }
  });

  socket.on('join-session', ({ sessionId, userId, userRole, userName, courseId, courseName, category, isVideoOn, isAudioOn }) => {
    socket.join(sessionId);
    console.log(`User ${userId} (${userRole}) joined session ${sessionId}`);
    
    // Notify others in the session
    socket.to(sessionId).emit('user-joined', { userId, userRole, socketId: socket.id, userName, isVideoOn, isAudioOn });
  });

  socket.on('stream-state-change', ({ sessionId, isVideoOn, isAudioOn }) => {
      socket.to(sessionId).emit('stream-state-changed', { socketId: socket.id, isVideoOn, isAudioOn });
  });

  // Explicit session start handler with student list verification
  socket.on('session-started', async ({ sessionId, courseId, tutorName, students }) => {
     console.log(`Session started for course ${courseId} by ${tutorName}`);
     
     // Track active session
     if (courseId) {
         activeSessions.set(String(courseId), {
             sessionId,
             courseId,
             tutorName,
             message: `${tutorName} started a live session!`
         });
         
         // Broadcast to all students enrolled in the course
         io.to(`course:${courseId}`).emit('session-live', {
           sessionId,
           courseId,
           tutorName,
           message: `${tutorName} started a live session!`
         });
         console.log(`Broadcasted live session to all students in course:${courseId}`);
     }

     // Send emails to enrolled students in the course
     try {
        const cId = parseInt(String(courseId));
        if (!isNaN(cId)) {
            const course = await prisma.course.findUnique({
                where: { id: cId },
                include: {
                    courseEnrollments: {
                        include: { user: true }
                    }
                }
            });

            if (course && course.courseEnrollments.length > 0) {
                const frontendBase = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
                const sessionLink = `${frontendBase}/student/dashboard?joinSession=${sessionId}&courseId=${courseId}&tutorName=${encodeURIComponent(tutorName)}`;
                
                console.log(`Sending live session emails to ${course.courseEnrollments.length} students...`);
                
                // Send emails in parallel
                await Promise.all(course.courseEnrollments.map(async (enrollment) => {
                    const student = enrollment.user;
                    if (student.email) {
                        const content = `
                            <div style="font-family: sans-serif; color: #333;">
                                <h2>Live Session Started!</h2>
                                <p>Hi ${student.name},</p>
                                <p><strong>${tutorName}</strong> has started a live session for <strong>${course.title || 'your course'}</strong>.</p>
                                <br/>
                                <a href="${sessionLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Live Session</a>
                                <br/><br/>
                                <p>See you there!</p>
                            </div>
                        `;
                        try {
                            await sendEmail({
                                to: student.email,
                                subject: `🔴 Live Now: ${course.title || 'Class'}`,
                                content
                            });
                        } catch (e) {
                            console.error(`Failed to send email to ${student.email}`, e);
                        }
                    }
                }));
                console.log(`Sent emails to ${course.courseEnrollments.length} students`);
            }
        }
     } catch (error) {
         console.error('Error sending live session emails:', error);
     }
  });

  socket.on('end-session', ({ courseId, sessionId }) => {
      console.log(`Session ended for course ${courseId}`);
      if (courseId) {
          activeSessions.delete(String(courseId));
      }
      // Optionally notify students that session ended
      io.to(`course:${courseId}`).emit('session-ended', { courseId, sessionId });
  });

  socket.on('signal', ({ to, signal, from, userRole, isVideoOn, isAudioOn }) => {
    io.to(to).emit('signal', { signal, from, userRole, isVideoOn, isAudioOn });
  });

  socket.on('whiteboard-draw', ({ sessionId, data }) => {
    socket.to(sessionId).emit('whiteboard-draw', data);
  });

  socket.on('whiteboard-clear', ({ sessionId }) => {
    socket.to(sessionId).emit('whiteboard-clear');
  });
  
  socket.on('whiteboard-image', ({ sessionId, imageUrl }) => {
    socket.to(sessionId).emit('whiteboard-image', imageUrl);
  });

  socket.on('chat-message', ({ sessionId, message }) => {
    socket.to(sessionId).emit('chat-message', message);
  });

  socket.on('shared-notes-update', ({ sessionId, notes }) => {
      socket.to(sessionId).emit('shared-notes-update', notes);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// Preflight handler to avoid framework default errors
app.options('*', cors({
  origin: isProd
    ? undefined
    : true,
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
      const userEmail = String(email).toLowerCase();
      let row = await db.get('SELECT * FROM user_credentials WHERE email = ?', [userEmail]);

      // Auto-register if no credentials exist (Dev/Test convenience)
      if (!row) {
        console.log(`[Auth] Auto-registering new user: ${userEmail}`);
        const role = req.body.role || 'student';
        
        // Ensure Prisma user exists
        let user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!user) {
          user = await prisma.user.create({ 
            data: { email: userEmail, name: userEmail.split('@')[0], role } 
          });
        }

        // Create credentials
        const hash = await hashPassword(String(password));
        const now = new Date().toISOString();
        await db.run(
          'INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [userEmail, user.id, hash, now, now]
        );
        
        // Set row for subsequent verification
        row = { 
          email: userEmail, 
          user_id: user.id, 
          password_hash: hash,
          created_at: now,
          updated_at: now
        };
      }

      if (!row || !row.password_hash) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      const [scheme, salt, stored] = String(row.password_hash).split(':');
      if (scheme !== 'scrypt' || !salt || !stored) return res.status(500).json({ success: false, error: 'Invalid credential record' });
      const derived = await new Promise<string>((resolve, reject) => {
        crypto.scrypt(String(password), salt, 64, (err, dk) => err ? reject(err) : resolve(dk.toString('hex')));
      });
      if (derived !== stored) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      // load or create user
      let user = await prisma.user.findUnique({ where: { email: userEmail } });
      
      // Allow role to be passed in body, default to student
      const role = req.body.role || 'student';
      
      if (!user) user = await prisma.user.create({ data: { email: userEmail, name: userEmail.split('@')[0], role } });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
      res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax;${secure}`);
      return res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
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

// List students for a specific tutor
app.get('/api/tutor/:tutorId/students', async (req, res) => {
  try {
    const tutorId = parseInt(req.params.tutorId);
    if (isNaN(tutorId)) {
      return res.status(400).json({ success: false, error: 'Invalid tutor ID' });
    }

    // Find courses taught by this tutor
    const courses = await prisma.course.findMany({
      where: { tutorId },
      include: {
        courseEnrollments: {
          include: { user: true }
        }
      }
    });

    // Extract unique students
    const studentMap = new Map();
    courses.forEach(course => {
      course.courseEnrollments.forEach(enrollment => {
        const student = enrollment.user;
        if (student && student.role === 'student') {
          if (!studentMap.has(student.id)) {
            // Initialize student entry
            studentMap.set(student.id, {
              ...student,
              enrolledCourses: [course] 
            });
          } else {
            // Add course to existing student entry if not already there
            const existing = studentMap.get(student.id);
            if (!existing.enrolledCourses.find(c => c.id === course.id)) {
              existing.enrolledCourses.push(course);
            }
          }
        }
      });
    });

    const students = Array.from(studentMap.values());
    return res.json({ success: true, data: students });
  } catch (error) {
    console.error('List tutor students error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list tutor students' });
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

// Invite students (admin only) - Generates Student ID and sends credentials
app.post('/api/admin/students/invite', authenticateJWT, authorizeRoles('admin', 'tutor'), async (req, res) => {
  try {
    const { emails, courseName, tutorName, department } = req.body || {};
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'emails[] is required' });
    }
    const frontendBase = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
    const results: any[] = [];
    const year = new Date().getFullYear();

    // Look up course if provided
    let courseId: string | null = null;
    if (courseName) {
      const course = await prisma.course.findFirst({ where: { title: courseName } });
      if (course) courseId = course.id;
    }

    for (const email of emails) {
      const clean = String(email || '').trim().toLowerCase();
      if (!clean || !clean.includes('@')) continue;

      let user = await prisma.user.findUnique({ where: { email: clean } });
      let studentNumber = '';
      let studentEmail = clean; // Use personal email if user exists, or create new student email? 
      // The previous logic forced creating a new student email.
      // User requirement: "get users personal emails"
      // If user exists with personal email, we use that.
      // If not, do we create a new one with student number email?
      // The previous logic was creating student number email.
      // Let's stick to the previous logic for NEW users, but handle existing users gracefully.
      
      let isNewUser = false;
      let tempPassword = '';

      if (!user) {
        isNewUser = true;
        // 1. Generate unique Student Number and Email
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
          studentNumber = `${year}${randomSuffix}`;
          studentEmail = `${studentNumber}@excellenceakademie.co.za`; // Official email
          
          const existing = await prisma.user.findUnique({ where: { email: studentEmail } });
          if (!existing) isUnique = true;
          attempts++;
        }

        if (!isUnique) {
            results.push({ email: clean, error: 'Failed to generate unique Student ID' });
            continue;
        }

        // 2. Generate Temporary Password
        tempPassword = crypto.randomBytes(4).toString('hex') + Math.floor(Math.random() * 100);

        // 3. Create User
        const name = clean.split('@')[0];
        
        // We store the official email in the User table?
        // Or do we store the personal email?
        // The schema has `email` unique.
        // If we store official email, we lose the link to personal email unless we store it elsewhere.
        // But we are sending credentials TO the personal email (`clean`).
        
        user = await prisma.user.create({ 
          data: { 
            email: studentEmail, // Official email
            name: name, 
            role: 'student',
            department_id: department || null 
          } 
        });

        // 4. Save Credentials
        const hash = await hashPassword(tempPassword);
        const db = await getConnection();
        try {
          const now = new Date().toISOString();
          await db.run(
            `INSERT INTO user_credentials (email, user_id, password_hash, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, user_id=excluded.user_id, updated_at=excluded.updated_at`,
            [studentEmail, user.id, hash, now, now]
          );
        } finally {
          await db.close();
        }
      } else {
        // User exists
        studentEmail = user.email;
        // If user exists, we don't generate new credentials?
        // Or should we?
        // Maybe just notify them they are enrolled.
      }

      // Enrollment
      if (courseId && user) {
        const enrollment = await prisma.courseEnrollment.findFirst({
            where: { userId: user.id, courseId: courseId }
        });
        if (!enrollment) {
            await prisma.courseEnrollment.create({
                data: { userId: user.id, courseId: courseId, status: 'enrolled' }
            });
        }
      }

      // 5. Send Email
      if (isNewUser) {
          const link = `${frontendBase.replace(/\/$/, '')}/login`;
          const content = renderStudentCredentialsEmail({ 
            recipientName: user.name, 
            studentNumber, 
            studentEmail, 
            tempPassword, 
            loginUrl: link, 
            courseName 
          });
          
          const send = await sendEmail({ to: clean, subject: 'Your Student Login Credentials - Excellence Academia', content });
          results.push({ email: clean, studentNumber, studentEmail, sent: !!send.success });
      } else {
          // Send enrollment notification?
          // For now, only if invited to course
          if (courseName) {
              const content = renderBrandedEmail({
                  title: 'Course Enrollment',
                  message: `<p>You have been enrolled in <strong>${courseName}</strong>.</p>`
              });
              const send = await sendEmail({ to: clean, subject: 'Course Enrollment - Excellence Academia', content });
              results.push({ email: clean, enrolled: true, sent: !!send.success });
          } else {
              results.push({ email: clean, error: 'User already exists' });
          }
      }
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

async function ensureNotificationsTable() {
  const db = await getConnection();
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT,
        status TEXT,
        created_at TEXT NOT NULL,
        read INTEGER DEFAULT 0
      );
    `);
  } finally {
    await db.close();
  }
}

app.post('/api/notifications', async (req, res) => {
  try {
    const { title, message, type = 'system', recipients } = req.body || {};
    if (!title || !message) return res.status(400).json({ success: false, error: 'title and message are required' });
    await ensureNotificationsTable();
    const db = await getConnection();
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.run('INSERT INTO notifications (id, title, message, type, status, created_at, read) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        id, String(title), String(message), String(type), 'sent', now, 0
      ]);
      const toSpecific = Array.isArray(recipients?.specific) ? recipients.specific.filter((e: any) => typeof e === 'string') : [];
      const sendList: string[] = [];
      if (recipients?.tutors) {
        const tutors = await db.all(`SELECT email FROM users WHERE role = 'tutor' AND email IS NOT NULL AND TRIM(email) <> ''`);
        sendList.push(...tutors.map((r: any) => String(r.email)));
      }
      if (recipients?.students) {
        const students = await db.all(`SELECT email FROM users WHERE role = 'student' AND email IS NOT NULL AND TRIM(email) <> ''`);
        sendList.push(...students.map((r: any) => String(r.email)));
      }
      sendList.push(...toSpecific.map((e: string) => e.toLowerCase()));
      const uniqueList = Array.from(new Set(sendList)).slice(0, 200);
      for (const to of uniqueList) {
        const html = renderBrandedEmail({ title: String(title), message: `<p>${String(message)}</p>` });
        await sendEmail({ to, subject: String(title), content: html });
      }
      return res.status(201).json({ success: true, id });
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});



app.post('/api/admin/tutors/invite', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { emails, tutorName, department } = req.body || {};
    const list = Array.isArray(emails) ? emails.filter((e: any) => typeof e === 'string').map((e: string) => e.trim()).filter(Boolean) : [];
    if (list.length === 0) return res.status(400).json({ success: false, error: 'emails array required' });
    const base = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
    const results: any[] = [];
    for (const email of list.slice(0, 200)) {
      const actionUrl = `${base}/welcome?email=${encodeURIComponent(email)}`;
      const html = renderInvitationEmail({ recipientName: tutorName || email.split('@')[0], actionUrl, tutorName, department });
      const r = await sendEmail({ to: email, subject: 'Invitation to Excellence Academia (Tutor)', content: html });
      results.push({ email, sent: !!r?.success });
    }
    return res.json({ success: true, invited: results });
  } catch (error) {
    console.error('Tutor invite error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send invitations' });
  }
});

app.post('/api/admin/email/send', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { subject, message, recipients, department } = req.body || {};
    if (!subject || !message) return res.status(400).json({ success: false, error: 'subject and message are required' });
    const db = await getConnection();
    try {
      const sendList: string[] = [];
      const deptClause = department ? ` AND department = ?` : '';
      const params: any[] = department ? [department] : [];
      if (recipients?.tutors) {
        const tutors = await db.all(`SELECT email FROM users WHERE role = 'tutor' AND email IS NOT NULL AND TRIM(email) <> ''${deptClause}`, params);
        sendList.push(...tutors.map((r: any) => String(r.email)));
      }
      if (recipients?.students) {
        const students = await db.all(`SELECT email FROM users WHERE role = 'student' AND email IS NOT NULL AND TRIM(email) <> ''${deptClause}`, params);
        sendList.push(...students.map((r: any) => String(r.email)));
      }
      const toSpecific = Array.isArray(recipients?.specific) ? recipients.specific.filter((e: any) => typeof e === 'string') : [];
      sendList.push(...toSpecific.map((e: string) => e.toLowerCase()));
      const uniqueList = Array.from(new Set(sendList)).slice(0, 500);
      const html = renderBrandedEmail({ title: String(subject), message: `<p>${String(message)}</p>` });
      const results: any[] = [];
      for (const to of uniqueList) {
        const r = await sendEmail({ to, subject: String(subject), content: html });
        results.push({ email: to, sent: !!r?.success });
      }
      return res.json({ success: true, sent: results });
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('Admin email send error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send emails' });
  }
});

app.post('/api/admin/email/preview', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { template, title, intro, actionText, actionUrl, highlights, courseName, tutorName, department } = req.body || {};
    if (!template || !title || !intro) return res.status(400).json({ success: false, error: 'template, title, intro required' });
    const html = renderBrandedEmailPreview({
      template,
      title: String(title),
      intro: String(intro),
      actionText: actionText ? String(actionText) : undefined,
      actionUrl: actionUrl ? String(actionUrl) : undefined,
      highlights: Array.isArray(highlights) ? highlights.map((x: any) => String(x)) : undefined,
      courseName: courseName ? String(courseName) : undefined,
      tutorName: tutorName ? String(tutorName) : undefined,
      department: department ? String(department) : undefined
    });
    return res.json({ success: true, html });
  } catch (error) {
    console.error('Email preview error:', error);
    return res.status(500).json({ success: false, error: 'Failed to render preview' });
  }
});

// Tutor invite endpoint - restrict recipients to tutor's own students or new emails
app.post('/api/tutor/students/invite', authenticateJWT, authorizeRoles('tutor'), async (req, res) => {
  try {
    const { emails, courseName } = req.body || {};
    const tutorId = req.user?.id;
    
    // Basic validation
    if (!courseName) return res.status(400).json({ success: false, error: 'courseName is required' });
    
    const list = Array.isArray(emails) ? emails.filter((e: any) => typeof e === 'string').map((e: string) => e.trim()).filter(Boolean) : [];
    if (list.length === 0) return res.status(400).json({ success: false, error: 'emails array required' });
    
    // Verify course belongs to tutor
    const db = await getConnection();
    const course = await db.get('SELECT * FROM courses WHERE name = ? AND tutor_id = ?', [courseName, tutorId]);
    await db.close();
    
    if (!course) {
        return res.status(403).json({ success: false, error: 'Course not found or access denied' });
    }

    const base = process.env.FRONTEND_URL || 'https://www.excellenceakademie.co.za';
    const results: any[] = [];
    const tutorName = req.user?.username || 'Tutor';
    const department = course.department || 'General';

    for (const email of list.slice(0, 200)) {
      const actionUrl = `${base}/welcome?email=${encodeURIComponent(email)}`;
      const html = renderInvitationEmail({ recipientName: email.split('@')[0], actionUrl, courseName, tutorName, department });
      const r = await sendEmail({ to: email, subject: 'Invitation to Excellence Academia', content: html });
      results.push({ email, sent: !!r?.success });
    }
    return res.json({ success: true, invited: results });
  } catch (error) {
    console.error('Tutor student invite error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send invitations' });
  }
});

// Tutor email endpoint - restrict recipients to tutor's own students
app.post('/api/tutor/email/send', authenticateJWT, authorizeRoles('tutor'), async (req, res) => {
  try {
    const { subject, message, courseId } = req.body || {};
    if (!message) return res.status(400).json({ success: false, error: 'message is required' });
    const tutorId = String(req.user?.id || '').trim();
    if (!tutorId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const db = await getConnection();
    try {
      const emails: string[] = [];
      if (courseId && String(courseId).trim().length > 0) {
        const owns = await db.get('SELECT 1 FROM courses WHERE id = ? AND tutor_id = ?', [courseId, tutorId]);
        if (!owns) return res.status(403).json({ success: false, error: 'Forbidden: course does not belong to tutor' });
        const rows = await db.all(
          `SELECT DISTINCT u.email 
           FROM users u 
           JOIN enrollments e ON e.student_id = u.id 
           WHERE e.course_id = ? 
             AND u.email IS NOT NULL AND TRIM(u.email) <> ''`,
          [courseId]
        );
        emails.push(...rows.map((r: any) => String(r.email)));
      } else {
        const rows = await db.all(
          `SELECT DISTINCT u.email 
           FROM users u 
           JOIN enrollments e ON e.student_id = u.id 
           JOIN courses c ON c.id = e.course_id 
           WHERE c.tutor_id = ? 
             AND u.email IS NOT NULL AND TRIM(u.email) <> ''`,
          [tutorId]
        );
        emails.push(...rows.map((r: any) => String(r.email)));
      }
      const unique = Array.from(new Set(emails)).slice(0, 500);
      const html = renderBrandedEmail({
        title: String(subject || 'Message from your tutor'),
        message: `<p>${String(message)}</p>`,
        footerNote: 'You received this email because you are enrolled with this tutor.'
      });
      const results: any[] = [];
      for (const to of unique) {
        const r = await sendEmail({ to, subject: String(subject || 'Tutor Notification'), content: html });
        results.push({ email: to, sent: !!r?.success });
      }
      return res.json({ success: true, count: results.length, sent: results });
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('Tutor email send error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send tutor emails' });
  }
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
      'INSERT INTO courses (title, description, department, tutor_id, start_date, end_date, category, section, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, department, tutorId, startDate, endDate, category || department, req.body.section || null, new Date().toISOString()]
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
      section: req.body.section || null,
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
    const { id, createdAt, updatedAt, averageRating, totalReviews, ...rest } = req.body || {};
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
    const rawStudentId = (req.query.studentId as string) || (req as any).user?.id;
    if (!rawStudentId) return res.status(400).json({ success: false, error: 'Student ID is required' });

    const studentId = parseInt(String(rawStudentId), 10);
    if (isNaN(studentId)) {
       return res.status(400).json({ success: false, error: 'Invalid Student ID format' });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            tutor: true,
            materials: true,
            announcements: {
              orderBy: { createdAt: 'desc' },
              take: 5
            },
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

    // Read timetable for real schedule
    let timetable: any[] = [];
    try {
        const timetableData = await fs.readFile(timetableFile, 'utf-8');
        timetable = JSON.parse(timetableData);
    } catch (e) {
        // ignore
    }

    // Helper to find next session for a course
    const getNextSession = (courseName: string) => {
        if (!courseName || timetable.length === 0) return null;
        
        const courseEntries = timetable.filter((t: any) => t.courseName === courseName);
        if (courseEntries.length === 0) return null;

        const daysMap: {[key: string]: number} = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6
        };

        const now = new Date();
        
        const upcomingSessions = courseEntries.map((entry: any) => {
            const dayIndex = daysMap[entry.day.toLowerCase().trim()];
            if (dayIndex === undefined) return null;

            // Parse time (assuming HH:MM or HH:MM AM/PM)
            let [time, modifier] = entry.time.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            
            if (modifier) {
                if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
                if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
            }

            const sessionDate = new Date(now);
            sessionDate.setHours(hours, minutes, 0, 0);

            // Calculate day difference
            let dayDiff = dayIndex - now.getDay();
            if (dayDiff < 0) dayDiff += 7;
            
            // If today but passed, move to next week
            if (dayDiff === 0 && now > sessionDate) {
                dayDiff = 7;
            }
            
            sessionDate.setDate(now.getDate() + dayDiff);
            return { date: sessionDate, ...entry };
        }).filter(Boolean).sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

        if (upcomingSessions.length === 0) return null;

        const next = upcomingSessions[0];
        // Format: "Mon, 14 Oct at 10:00"
        const formatted = next.date.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        }).replace(',', '') + (next.type ? ` (${next.type})` : '');
        
        return { formatted, date: next.date };
    };

    const courses = enrollments.map(e => {
      const course = e.course as any;
      const courseTests = (course.tests || []) as any[];
      const completedTests = courseTests.filter(t => t.submissions && t.submissions.length > 0);
      
      // Check for active live session
      const activeSession = activeSessions.get(String(course.id));
      
      const nextSessionData = getNextSession(course.name);

      return {
        id: course.id,
        name: course.name || course.title,
        description: course.description,
        tutor: course.tutor?.name || 'Tutor',
        tutorEmail: course.tutor?.email || '',
        nextSession: nextSessionData?.formatted || 'TBA', 
        nextSessionDate: nextSessionData?.date || null,
        progress: courseTests.length > 0 ? (completedTests.length / courseTests.length) * 100 : 0,
        isLive: !!activeSession,
        liveSessionId: activeSession?.sessionId,
        category: activeSession?.department,
        materials: (course.materials || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            url: m.url,
            dateAdded: m.createdAt,
            completed: false // Todo: Track completion
        })),
        tests: courseTests.map(t => ({ id: t.id, title: t.title, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), questions: 10, totalPoints: 100, status: (t.submissions && t.submissions.length > 0) ? 'completed' : 'upcoming', score: (t.submissions && t.submissions.length > 0) ? t.submissions[0].score : null })),
        color: 'blue',
        announcements: (course.announcements || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            date: a.createdAt,
            type: 'info'
        })),
        grade: averageGrade,
        enrollmentDate: e.createdAt,
        status: e.status
      };
    });

    const assignments = enrollments.flatMap(e => {
        const course = e.course as any;
        return (course.tests || [])
            .filter((t: any) => !t.submissions || t.submissions.length === 0)
            .map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description || 'Test/Assignment',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Todo: Real due date
                courseId: course.id,
                status: 'pending'
            }));
    });

    const recentActivities = testSubmissions.map(s => ({
        id: s.id,
        type: 'assignment_submitted',
        message: `Submitted ${s.test?.title || 'Test'}`,
        timestamp: s.createdAt,
        courseName: s.test?.course?.name || 'Course'
    }));

    // Generate upcoming sessions from timetable
    const upcomingSessions = timetable
        .filter((t: any) => enrollments.some(e => e.course.name === t.courseName))
        .map((t: any, index: number) => ({
            id: String(index),
            courseName: t.courseName,
            tutorName: t.tutorName || 'Tutor',
            date: new Date().toISOString(), // Placeholder as we don't have exact date calc yet
            time: `${t.day} ${t.time}`,
            duration: '60 minutes',
            type: t.type || 'Class',
            location: 'Online'
        }));

    const dashboardData = {
      student: { id: student.id, name: student.name, email: student.email, avatar: `https://ui-avatars.com/api/?name=${student.name}&background=random` },
      statistics: {
        totalCourses: enrollments.length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length,
        activeCourses: enrollments.filter(e => e.status === 'enrolled').length,
        averageGrade: Math.round(averageGrade * 100) / 100,
        totalStudyHours: 0, 
        streak: 0
      },
      upcomingSessions: upcomingSessions,
      recentActivities: recentActivities.length > 0 ? recentActivities : [],
      courses,
      assignments,
      notifications: notifications.map(n => ({ 
        id: n.id, 
        message: n.message, 
        read: n.read, 
        date: (n.createdAt as Date).toISOString(),
        type: n.type || 'course'
      })),
      achievements: []
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

    const courses = await prisma.course.findMany({
      where: { tutorId: Number(tutorId) },
      include: {
        courseEnrollments: { include: { user: true } },
        tests: { include: { submissions: true } }
      }
    });

    const studentMap = new Map();
    courses.forEach(course => {
      course.courseEnrollments.forEach(enrollment => {
        const student = enrollment.user;
        if (student && student.role === 'student') {
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              ...student,
              enrolledCourses: [course]
            });
          } else {
            const existing = studentMap.get(student.id);
            if (!existing.enrolledCourses.find((c: any) => c.id === course.id)) {
              existing.enrolledCourses.push(course);
            }
          }
        }
      });
    });
    
    const students = Array.from(studentMap.values());

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
    
    // Start scheduled session checker
    startScheduledSessionChecker();
    
    // Start server
    const server = httpServer.listen(Number(port), '0.0.0.0', () => {
      console.log(`✓ Server running on port ${port}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Socket.IO: Enabled`);
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
