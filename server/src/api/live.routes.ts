import { Router, Request, Response } from 'express';
import { getLiveSessionData } from '../services/live.service';

const router = Router();

router.get('/:sessionId', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;

  try {
    const liveData = await getLiveSessionData(sessionId);
    if (!liveData) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    res.json(liveData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching live session data.' });
  }
});

export default router;