import { Router, Request, Response } from 'express';
import { search } from '../rag';
import { env } from '../env';

const router = Router();

/**
 * Search for relevant document chunks
 * GET /api/search?q=<query>&k=<number>
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const k = req.query.k ? parseInt(req.query.k as string, 10) : env.TOP_K;
    
    if (!query) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    
    if (isNaN(k) || k < 1) {
      res.status(400).json({ error: 'Invalid value for parameter "k"' });
      return;
    }
    
    console.log(`🔍 Searching for: "${query}" (top ${k})`);
    
    const results = await search(query, k);
    
    res.json({
      query,
      k,
      count: results.length,
      matches: results.map((result, idx) => ({
        rank: idx + 1,
        source: result.source,
        page: result.page,
        title: result.title,
        text: result.text,
      })),
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


