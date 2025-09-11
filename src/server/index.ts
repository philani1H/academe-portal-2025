import express from 'express';
import cors from 'cors';
import { getConnection } from '../lib/db';
import prisma from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../lib/email';

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
          process.env.FRONTEND_URL
        ].filter(Boolean);
        
        if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '')))) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      }
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Security and performance middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static uploads (images)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
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
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username, role: 'admin', exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) }, JWT_SECRET);
    const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict;${secure}`);
    return res.status(200).json({ success: true, message: 'Login successful', user: { username, role: 'admin' } });
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
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch ${req.params.type} content`,
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const adminHtml = `
      <div>
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${(message || '').replace(/\n/g, '<br/>')}</p>
      </div>
    `;
    const adminSend = await sendEmail({ to, subject: subject || 'New Contact Message', content: adminHtml });

    // Optional: send acknowledgement to user (best UX)
    if (email) {
      const ackHtml = `
        <div>
          <p>Hi ${name},</p>
          <p>We received your message and will get back to you shortly.</p>
          <p>Best regards,<br/>Excellence Academia</p>
        </div>
      `;
      try { await sendEmail({ to: email, subject: 'We received your message', content: ackHtml }); } catch {}
    }

    if (!adminSend.success) throw new Error('Email send failed');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact email error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send message' });
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