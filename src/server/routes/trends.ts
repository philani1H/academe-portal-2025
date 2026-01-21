
import express from 'express';
import { TrendService } from '../services/TrendService.js';

const router = express.Router();

// GET /api/trends
router.get('/', (req, res) => {
  try {
    const trendService = TrendService.getInstance();
    const trends = trendService.getCurrentTrends();
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;
