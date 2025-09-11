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