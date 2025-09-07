import express from 'express';
import cors from 'cors';
import { executeQuery } from '../lib/db';

const app = express();
const port = 3001;

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
    const user = await executeQuery('SELECT * FROM users WHERE id = $1', [req.params.id]);
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
    const db = await getDbConnection();
    const courses = await db.all('SELECT * FROM courses');
    await db.close();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const db = await getDbConnection();
    const course = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    await db.close();
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

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});