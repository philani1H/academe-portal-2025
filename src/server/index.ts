import express from 'express';
import cors from 'cors';
import { executeQuery, getConnection } from '../lib/db';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Generic query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    const result = await executeQuery(query, params);
    res.json(result);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// User routes
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await executeQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Course routes
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await executeQuery('SELECT * FROM courses');
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await executeQuery('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Content routes
app.get('/api/admin/content/:type', async (req, res) => {
  try {
    const contentType = req.params.type;
    let content;
    
    switch (contentType) {
      case 'tutors':
        content = await executeQuery('SELECT * FROM tutors');
        break;
      case 'team-members':
        content = await executeQuery('SELECT * FROM team_members WHERE is_active = 1 ORDER BY [order] ASC, created_at DESC');
        break;
      case 'about-us':
        content = await executeQuery('SELECT * FROM about_us_content WHERE is_active = 1 ORDER BY updated_at DESC');
        break;
      case 'hero':
        content = await executeQuery('SELECT * FROM hero_content LIMIT 1');
        break;
      case 'features':
        content = await executeQuery('SELECT * FROM features');
        break;
      case 'announcements':
        content = await executeQuery('SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC');
        break;
      case 'testimonials':
        content = await executeQuery('SELECT * FROM testimonials');
        break;
      case 'pricing':
        content = await executeQuery('SELECT * FROM pricing_plans');
        break;
      case 'events':
        content = await executeQuery('SELECT * FROM events ORDER BY date ASC');
        break;
      case 'footer':
        content = await executeQuery('SELECT * FROM footer_content LIMIT 1');
        break;
      case 'subjects':
        content = await executeQuery('SELECT * FROM subjects');
        break;
      case 'navigation':
        content = await executeQuery("SELECT path, label, type FROM navigation_items WHERE is_active = 1 ORDER BY [order] ASC, created_at ASC");
        break;
      case 'exam-rewrite':
        content = await executeQuery('SELECT * FROM exam_rewrite_content WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1');
        break;
      case 'university-application':
        content = await executeQuery('SELECT * FROM university_application_content WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1');
        break;
      default:
        return res.status(404).json({ error: 'Content type not found' });
    }

    if (content) {
      // For list-like types, return the full array; for singleton types, return the first row
      const listTypes = ['tutors', 'team-members', 'features', 'testimonials', 'pricing', 'subjects', 'announcements', 'events'];
      res.json(listTypes.includes(contentType) ? content : content[0]);
    } else {
      res.status(404).json({ error: `${contentType} content not found` });
    }
  } catch (error) {
    console.error(`Error fetching ${req.params.type} content:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.type} content` });
  }
});

async function initializeDatabase() {
  try {
    const db = await getConnection();
    const baseDir = path.resolve(__dirname, '..');
    const files = [
      path.join(baseDir, 'database', 'schema.sql'),
      path.join(baseDir, 'database', 'content-schema.sql')
    ];
    for (const file of files) {
      try {
        const sql = await fs.readFile(file, 'utf8');
        // Split on semicolons to run sequentially (sqlite "all" can't run multi statements reliably here)
        const statements = sql
          .split(/;\s*\n/)
          .map(s => s.trim())
          .filter(Boolean);
        for (const stmt of statements) {
          try {
            await db.exec(stmt + ';');
          } catch (e) {
            // Ignore individual statement errors to be idempotent
          }
        }
      } catch (e) {
        // File may not exist; continue
      }
    }
    await db.close();
  } catch (e) {
    console.error('DB initialization failed:', e);
  }
}

async function seedDatabaseIfEmpty() {
  try {
    const db = await getConnection();
    const singletons = [
      {
        table: 'hero_content',
        insert: `INSERT INTO hero_content (id, title, subtitle, description, buttonText, secondaryButtonText, trustIndicatorText, universities, features, backgroundGradient, isActive, createdAt, updatedAt)
                 VALUES (lower(hex(randomblob(16))), 'Welcome to Excellence Akademie', '25 Years of Academic Excellence', 'Empowering students with world-class education', 'Choose a Plan', 'Become a Tutor', 'Trusted by students across South Africa', json('["UCT","Wits","UP"]'), json('[{"title":"Expert Instruction","description":"Proven teaching methods","icon":"award"}]'), 'bg-gradient-to-br from-[#0B1340] via-[#1B264F] to-[#3A5199]', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      },
      {
        table: 'footer_content',
        insert: `INSERT INTO footer_content (id, companyName, tagline, contactPhone, contactEmail, contactPerson, whatsappLink, socialLinks, quickLinks, resourceLinks, copyrightText, isActive, createdAt, updatedAt)
                 VALUES (lower(hex(randomblob(16))), 'EXCELLENCE Akademie 25', 'Empowering Minds, One Click at a Time!', '+27 79 386 7427', 'ExcellenceAcademia2025@gmail.com', 'Roshan Singh', 'https://wa.me/27793867427', json('{"facebook":"https://facebook.com","instagram":"https://www.instagram.com/excellence.academia25"}'), json('[{"path":"/about-us","label":"About Us"}]'), json('[{"path":"/student-login","label":"Student Portal"}]'), '© 2025 Excellence Academia. All rights reserved.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      },
      {
        table: 'exam_rewrite_content',
        insert: `INSERT INTO exam_rewrite_content (id, title, description, heroTitle, heroDescription, benefits, process, subjects, applicationFormUrl, pricingInfo, is_active, created_at, updated_at)
                 VALUES (lower(hex(randomblob(16))), 'Exam Rewrite Program', 'Improve your marks', 'Second Chances, First-Class Results', 'Expert tutors to help you excel', json('["Expert tutoring","Personalized plans"]'), json('[{"title":"Assessment","description":"Evaluate current knowledge"}]'), json('["Mathematics","Physical Sciences","English"]'), 'https://docs.google.com/forms/d/e/1FAIpQLScZUhGQsFhbgqLRdZ3PrZwr64pBIBgxKyY8EyQSE4REUxwWeA/viewform', json('{"basic":{"price":"R 150","period":"Monthly"}}'), 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      },
      {
        table: 'university_application_content',
        insert: `INSERT INTO university_application_content (id, title, description, services, process, requirements, pricing, formUrl, is_active, created_at, updated_at)
                 VALUES (lower(hex(randomblob(16))), 'University Application', 'Apply to top universities', json('["University of Cape Town","University of Pretoria"]'), json('["Bachelor of Commerce","Bachelor of Science"]'), json('["ID Document","Academic Results"]'), json('{"application":"R 300"}'), 'https://forms.gle/ebjp3aUsutZni8jd9', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      }
    ];
    for (const s of singletons) {
      try {
        const row: any = await db.get(`SELECT COUNT(*) as c FROM ${s.table}`);
        if ((row?.c ?? 0) === 0) {
          await db.exec(s.insert);
        }
      } catch {}
    }
    const collections = [
      { table: 'features', insert: `INSERT INTO features (id, title, description, icon, benefits, isActive, [order], createdAt, updatedAt) VALUES (lower(hex(randomblob(16))), 'Comprehensive Curriculum', 'Structured learning paths', 'curriculum', json('["Aligned with standards"]'), 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` },
      { table: 'pricing_plans', insert: `INSERT INTO pricing_plans (id, name, price, period, features, notIncluded, color, icon, popular, isActive, [order], createdAt, updatedAt) VALUES (lower(hex(randomblob(16))), 'STANDARD', 'R 250', 'Monthly', json('["All subjects tutoring"]'), json('["Advanced exam techniques"]'), 'indigo', 'star', 1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` },
      { table: 'testimonials', insert: `INSERT INTO testimonials (id, content, author, role, subject, improvement, image, rating, isActive, [order], createdAt, updatedAt) VALUES (lower(hex(randomblob(16))), 'Great support and results!', 'Student A', 'Mathematics Student', 'Mathematics', 'C to A', '/placeholder.svg?height=100&width=100', 5, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` },
      { table: 'subjects', insert: `INSERT INTO subjects (id, name, description, icon, created_at) VALUES (lower(hex(randomblob(16))), 'Mathematics', 'Algebra to Calculus', 'calculator', CURRENT_TIMESTAMP)` },
      { table: 'navigation_items', insert: `INSERT INTO navigation_items (id, path, label, type, [order], is_active, created_at, updated_at) VALUES (lower(hex(randomblob(16))), '/', 'Home', 'main', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)` }
    ];
    for (const c of collections) {
      try {
        const row: any = await db.get(`SELECT COUNT(*) as c FROM ${c.table}`);
        if ((row?.c ?? 0) === 0) {
          await db.exec(c.insert);
        }
      } catch {}
    }
    await db.close();
  } catch (e) {
    console.error('DB seed failed:', e);
  }
}

initializeDatabase().then(() => seedDatabaseIfEmpty()).then(() => {
  // Start server after ensuring tables exist
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const fallback = port + 1;
      console.error(`Port ${port} is in use. Trying port ${fallback}`);
      app.listen(fallback, '0.0.0.0', () =>
        console.log(`Server running at http://localhost:${fallback}`)
      );
    } else {
      console.error('Server error:', error);
    }
  });
});