/**
 * @file Defines search-related routes for the Express server.
 */

import { Router, Request, Response } from 'express';
import { searchSongs } from '../services/search.service';

const router = Router();

/**
 * @route   GET /api/search?q=keyword
 * @desc    Search for songs by title or artist
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ message: 'Search query (q) is required.' });
  }

  try {
    const results = await searchSongs(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error during search.' });
  }
});

export default router;
