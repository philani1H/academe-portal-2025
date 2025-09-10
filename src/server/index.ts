import express from 'express';
import cors from 'cors';
import { getConnection } from '../lib/db';
import prisma from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve base path in both ESM and CJS
const resolvedDir = (typeof __dirname !== 'undefined')
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(resolvedDir, '..');

const app = express();
const port = 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://excellence-akademie.com', 'https://www.excellence-akademie.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`Error in ${req.method} ${req.path}:`, err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Enhanced generic query endpoint with better error handling
app.post('/api/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const db = await getConnection();
    const result = await db.all(query, params);
    await db.close();
    
    res.json({ 
      success: true,
      data: result,
      count: Array.isArray(result) ? result.length : 1
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database query failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhanced User routes
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim() === '') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = await getConnection();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    await db.close();
    
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Enhanced Course routes
app.get('/api/courses', async (req, res) => {
  try {
    const { limit, offset, category } = req.query;
    
    const db = await getConnection();
    let query = 'SELECT * FROM courses';
    const params: any[] = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    }
    
    if (offset) {
      query += ' OFFSET ?';
      params.push(parseInt(offset as string));
    }
    
    const courses = await db.all(query, params);
    await db.close();
    
    res.json({ 
      success: true,
      data: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim() === '') {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const db = await getConnection();
    const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    await db.close();
    
    if (course) {
      res.json({ success: true, data: course });
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Enhanced Tutors API with advanced features
app.get('/api/tutors', async (req, res) => {
  try {
    const { subject, rating, limit, offset, search } = req.query;
    
    let whereConditions = ['isActive = true'];
    let orderBy = 'ORDER BY [order] ASC, createdAt DESC';
    
    // Filter by subject
    if (subject) {
      whereConditions.push(`subjects LIKE '%${subject}%'`);
    }
    
    // Filter by minimum rating
    if (rating) {
      // This would require calculating average rating from JSON ratings
      whereConditions.push('1=1'); // Placeholder - implement rating calculation
    }
    
    // Search functionality
    if (search) {
      whereConditions.push(`(name LIKE '%${search}%' OR description LIKE '%${search}%')`);
    }
    
    const tutors = await prisma.tutor.findMany({
      where: { 
        isActive: true,
        ...(subject && { subjects: { contains: subject as string } }),
        ...(search && { 
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      ...(limit && { take: parseInt(limit as string) }),
      ...(offset && { skip: parseInt(offset as string) })
    });

    // Calculate average ratings for each tutor
    const tutorsWithAvgRating = tutors.map(tutor => {
      const ratings = typeof tutor.ratings === 'string' 
        ? JSON.parse(tutor.ratings) 
        : tutor.ratings || [];
      
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
        : 0;
      
      return {
        ...tutor,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: ratings.length,
        subjectsList: typeof tutor.subjects === 'string' 
          ? JSON.parse(tutor.subjects) 
          : tutor.subjects || []
      };
    });

    res.json({
      success: true,
      data: tutorsWithAvgRating,
      count: tutorsWithAvgRating.length,
      pagination: {
        limit: limit ? parseInt(limit as string) : null,
        offset: offset ? parseInt(offset as string) : 0,
        hasMore: limit ? tutorsWithAvgRating.length === parseInt(limit as string) : false
      }
    });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).json({ error: 'Failed to fetch tutors' });
  }
});

app.get('/api/tutors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tutor = await prisma.tutor.findUnique({
      where: { id }
    });
    
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }
    
    // Parse and enhance tutor data
    const ratings = typeof tutor.ratings === 'string' 
      ? JSON.parse(tutor.ratings) 
      : tutor.ratings || [];
    
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      : 0;
    
    const enhancedTutor = {
      ...tutor,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: ratings.length,
      subjectsList: typeof tutor.subjects === 'string' 
        ? JSON.parse(tutor.subjects) 
        : tutor.subjects || [],
      ratingsList: ratings
    };

    res.json({ success: true, data: enhancedTutor });
  } catch (error) {
    console.error('Error fetching tutor:', error);
    res.status(500).json({ error: 'Failed to fetch tutor' });
  }
});

// Enhanced Content routes with better error handling and caching
app.get('/api/admin/content/:type', async (req, res) => {
  try {
    const contentType = req.params.type;
    let content;
    
    switch (contentType) {
      case 'tutors':
        content = await prisma.tutor.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] 
        });
        // Enhance tutors with calculated ratings
        content = content.map(tutor => {
          const ratings = typeof tutor.ratings === 'string' 
            ? JSON.parse(tutor.ratings) 
            : tutor.ratings || [];
          const avgRating = ratings.length > 0 
            ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
            : 0;
          return {
            ...tutor,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: ratings.length
          };
        });
        break;
      case 'team-members':
        content = await prisma.teamMember.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] 
        });
        break;
      case 'about-us':
        content = await prisma.aboutUsContent.findFirst({ 
          where: { isActive: true }, 
          orderBy: { updatedAt: 'desc' } 
        });
        break;
      case 'hero':
        content = await prisma.heroContent.findFirst({ 
          orderBy: { updatedAt: 'desc' } 
        });
        break;
      case 'features':
        content = await prisma.feature.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
        });
        break;
      case 'announcements':
        content = await prisma.announcement.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] 
        });
        break;
      case 'testimonials':
        content = await prisma.testimonial.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] 
        });
        break;
      case 'pricing':
        content = await prisma.pricingPlan.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
        });
        break;
      case 'events':
        content = await prisma.$queryRawUnsafe('SELECT * FROM events ORDER BY date ASC');
        break;
      case 'footer':
        content = await prisma.footerContent.findFirst({ 
          where: { isActive: true }, 
          orderBy: { updatedAt: 'desc' } 
        });
        break;
      case 'subjects':
        content = await prisma.subject.findMany({ 
          where: { isActive: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
        });
        break;
      case 'navigation':
        content = await prisma.navigationItem.findMany({ 
          where: { isActive: true }, 
          select: { path: true, label: true, type: true }, 
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] 
        });
        break;
      case 'exam-rewrite':
        content = await prisma.examRewriteContent.findFirst({ 
          where: { isActive: true }, 
          orderBy: { updatedAt: 'desc' } 
        });
        break;
      case 'university-application':
        content = await prisma.universityApplicationContent.findFirst({ 
          where: { isActive: true }, 
          orderBy: { updatedAt: 'desc' } 
        });
        break;
      case 'contact-us':
        content = await prisma.contactUsContent.findFirst({ 
          where: { isActive: true }, 
          orderBy: { updatedAt: 'desc' } 
        });
        break;
      case 'become-tutor':
        content = await prisma.becomeTutorContent.findFirst({ 
          where: { isActive: true }, 
          orderBy: { updatedAt: 'desc' } 
        });
        break;
      default:
        return res.status(404).json({ 
          success: false,
          error: 'Content type not found',
          availableTypes: [
            'tutors', 'team-members', 'about-us', 'hero', 'features',
            'announcements', 'testimonials', 'pricing', 'events', 'footer',
            'subjects', 'navigation', 'exam-rewrite', 'university-application',
            'contact-us', 'become-tutor'
          ]
        });
    }

    if (content) {
      const listTypes = [
        'tutors', 'team-members', 'features', 'testimonials', 
        'pricing', 'subjects', 'announcements', 'events', 'navigation'
      ];
      
      res.json({ 
        success: true,
        data: content,
        type: contentType,
        isArray: listTypes.includes(contentType),
        count: Array.isArray(content) ? content.length : 1
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Statistics endpoint for admin dashboard
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
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    const db = await getConnection();
    const files = [
      path.join(baseDir, 'database', 'schema.sql'),
      path.join(baseDir, 'database', 'content-schema.sql')
    ];
    
    for (const file of files) {
      try {
        console.log(`Executing SQL file: ${file}`);
        const sql = await fs.readFile(file, 'utf8');
        // Split on semicolons to run sequentially
        const statements = sql
          .split(/;\s*\n/)
          .map(s => s.trim())
          .filter(Boolean);
        
        for (const stmt of statements) {
          try {
            await db.exec(stmt + ';');
          } catch (e) {
            console.warn(`Statement execution warning:`, e);
          }
        }
      } catch (e) {
        console.warn(`File ${file} not found or error reading:`, e);
      }
    }
    await db.close();
    console.log('Database initialization completed');
  } catch (e) {
    console.error('DB initialization failed:', e);
    throw e;
  }
}

async function seedDatabaseIfEmpty() {
  try {
    console.log('Checking if database seeding is needed...');
    const db = await getConnection();
    
    const singletons = [
      {
        table: 'hero_content',
        insert: `INSERT INTO hero_content (id, title, subtitle, buttonText, buttonLink, imageUrl, updated_at)
             VALUES (lower(hex(randomblob(16))), 'Welcome to Excellence Akademie', '25 Years of Academic Excellence - Empowering Minds, One Click at a Time!', 'Choose a Plan', '/pricing', '/placeholder.svg', CURRENT_TIMESTAMP)`
      },
      {
        table: 'footer_content',
        insert: `INSERT INTO footer_content (id, companyInfo, socialLinks, quickLinks, contactInfo, updated_at)
                 VALUES (lower(hex(randomblob(16))), json('{"companyName":"EXCELLENCE Akademie 25","tagline":"Empowering Minds, One Click at a Time!","copyright":"© 2025 Excellence Academia. All rights reserved."}'), json('{"facebook":"https://facebook.com","instagram":"https://www.instagram.com/excellence.academia25","tiktok":"https://www.tiktok.com/@excellence.academia25"}'), json('[{"path":"/about-us","label":"About Us"},{"path":"/subjects","label":"Subjects"},{"path":"/university-application","label":"University Application"}]'), json('{"phone":"+27 79 386 7427","email":"ExcellenceAcademia2025@gmail.com","contactPerson":"Roshan Singh","whatsapp":"https://wa.me/27793867427"}'), CURRENT_TIMESTAMP)`
      },
      {
        table: 'exam_rewrite_content',
        insert: `INSERT INTO exam_rewrite_content (id, title, description, heroTitle, heroDescription, benefits, process, subjects, applicationFormUrl, pricingInfo, is_active, created_at, updated_at)
                 VALUES (lower(hex(randomblob(16))), 'Exam Rewrite Program', 'Transform your academic future with our comprehensive exam rewrite program', 'Second Chances, First-Class Results', 'Don''t let one exam define your future. Our expert tutors will help you achieve the grades you deserve.', json('["Expert tutoring in all subjects","Personalized study plans","Practice exams and mock tests","Flexible scheduling","Proven success rate"]'), json('[{"title":"Assessment","description":"We evaluate your current knowledge and identify areas for improvement"},{"title":"Planning","description":"Create a personalized study plan tailored to your needs"},{"title":"Learning","description":"Work with expert tutors to master the content"},{"title":"Practice","description":"Take practice exams to build confidence"},{"title":"Success","description":"Achieve the grades you need for your future"}]'), json('["Mathematics","Physical Sciences","Life Sciences","English","Afrikaans","Accounting","Economics","Business Studies","Geography","History"]'), 'https://docs.google.com/forms/d/e/1FAIpQLScZUhGQsFhbgqLRdZ3PrZwr64pBIBgxKyY8EyQSE4REUxwWeA/viewform', json('{"basic":{"price":"R 150","period":"Monthly","subjects":3},"standard":{"price":"R 250","period":"Monthly","subjects":5},"premium":{"price":"R 350","period":"Monthly","subjects":"Unlimited"}}'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      },
      {
        table: 'university_application_content',
        insert: `INSERT INTO university_application_content (id, title, description, services, process, requirements, pricing, formUrl, is_active, created_at, updated_at)
                 VALUES (lower(hex(randomblob(16))), 'University Application Assistance', 'Get expert help with your university applications', json('["University of Cape Town","University of Pretoria","University of the Witwatersrand","Stellenbosch University","Rhodes University"]'), json('["Initial Consultation","Document Preparation","Application Submission","Follow-up Support"]'), json('["Certified ID Document","Academic Transcripts","Proof of Registration","Personal Statement"]'), json('{"consultation":"R 200","full_service":"R 500"}'), 'https://forms.gle/ebjp3aUsutZni8jd9', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      }
    ];
    
    for (const s of singletons) {
      try {
        const row = await db.get<{ c: number }>(`SELECT COUNT(*) as c FROM ${s.table}`);
        if ((row?.c ?? 0) === 0) {
          await db.exec(s.insert);
          console.log(`Seeded ${s.table}`);
        }
      } catch (e) { 
        console.warn(`Failed to seed ${s.table}:`, e); 
      }
    }
    
    const collections = [
      { 
        table: 'features', 
        insert: `INSERT INTO features (id, title, description, icon, benefits, created_at, updated_at) VALUES (lower(hex(randomblob(16))), 'Comprehensive Curriculum', 'Structured learning paths aligned with South African curriculum standards', 'curriculum', json('["CAPS Aligned","Grade 10-12 Coverage","Expert Tutors","Interactive Learning"]'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` 
      },
      { 
        table: 'pricing_plans', 
        insert: `INSERT INTO pricing_plans (id, name, price, interval, features, isPopular, created_at) VALUES (lower(hex(randomblob(16))), 'STANDARD', '250.00', 'Monthly', json('["All subjects tutoring","Flexible scheduling","Progress tracking","24/7 support"]'), 1, CURRENT_TIMESTAMP)` 
      },
      { 
        table: 'testimonials', 
        insert: `INSERT INTO testimonials (id, name, role, content, image, rating, created_at) VALUES (lower(hex(randomblob(16))), 'Sarah Johnson', 'Grade 12 Mathematics Student', 'Excellence Akademie helped me improve my maths from 45% to 78%! The tutors are amazing and really care about your success.', '/placeholder.svg?height=100&width=100', 5, CURRENT_TIMESTAMP)` 
      },
      { 
        table: 'subjects', 
        insert: `INSERT INTO subjects (id, name, description, icon, created_at) VALUES (lower(hex(randomblob(16))), 'Mathematics', 'From algebra to calculus, master any math topic with our expert tutors', 'calculator', CURRENT_TIMESTAMP)` 
      },
      { 
        table: 'navigation_items', 
        insert: `INSERT INTO navigation_items (id, path, label, type, [order], is_active, created_at, updated_at) VALUES (lower(hex(randomblob(16))), '/', 'Home', 'main', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` 
      }
    ];
    
    for (const c of collections) {
      try {
        const row = await db.get<{ c: number }>(`SELECT COUNT(*) as c FROM ${c.table}`);
        if ((row?.c ?? 0) === 0) {
          await db.exec(c.insert);
          console.log(`Seeded ${c.table}`);
        }
      } catch (e) { 
        console.warn(`Failed to seed ${c.table}:`, e); 
      }
    }
    
    await db.close();
    console.log('Database seeding completed');
  } catch (e) {
    console.error('DB seed failed:', e);
    throw e;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

// Initialize and start server
initializeDatabase()
  .then(() => seedDatabaseIfEmpty())
  .then(() => {
    console.log('Starting server...');
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/api/health`);
      console.log(`👨‍🏫 Tutors API: http://localhost:${port}/api/tutors`);
    });
    
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        const fallback = port + 1;
        console.error(`❌ Port ${port} is in use. Trying port ${fallback}...`);
        app.listen(fallback, '0.0.0.0', () =>
          console.log(`🚀 Server running at http://localhost:${fallback}`)
        );
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });