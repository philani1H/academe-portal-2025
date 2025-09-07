import express from 'express';
import cors from 'cors';
import { executeQuery } from '../lib/db';
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

// Start server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Trying port ${port + 1}`);
    server.listen(port + 1);
  } else {
    console.error('Server error:', error);
  }
});