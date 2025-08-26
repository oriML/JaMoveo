
import { Router, Request, Response } from 'express';
import { createSession, getAllSessions, findSessionById, endSession, updateSessionSong } from '../services/session.service';
import { JamSession } from '../models/session.model';

const router = Router();

// GET /api/sessions/list
router.get('/list', async (req: Request, res: Response) => {
    try {
        const sessions = await getAllSessions();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sessions' });
    }
});

// POST /api/sessions/create
router.post('/create', async (req: Request, res: Response) => {
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admins can create sessions.' });
    }

    const { name, description, max_participants, genre, song_title, song_artist } = req.body;
    if (!name || !max_participants || !genre) {
        return res.status(400).json({ message: 'Please provide all required session details.' });
    }

    try {
        const newSessionData: Omit<JamSession, 'id' | 'created_at' | 'created_by' | 'participants' | 'is_active'> = {
            name,
            description,
            max_participants,
            genre,
            song_title: song_title || null,
            song_artist: song_artist || null,
        };
        const io = req.app.get('io');
        const session = await createSession(newSessionData, currentUser.id, { id: currentUser.id, username: currentUser.username, instrument: 'Host', role: currentUser.role }, io);
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Error creating session' });
    }
});

// GET /api/sessions/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const session = await findSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session details' });
    }
});

// POST /api/sessions/:id/end
router.post('/:id/end', async (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admins can end sessions.' });
    }

    try {
        const io = req.app.get('io');
        await endSession(sessionId, io);
        res.status(200).json({ message: 'Session ended successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error ending session.' });
    }
});

// POST /api/sessions/:id/song
router.post('/:id/song', async (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const { song_title, song_artist } = req.body;
    const currentUser = req.user;

    if (!currentUser || currentUser.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Only admins can change the song.' });
    }
    try {
        const io = req.app.get('io');
        const updatedSession = await updateSessionSong(sessionId, song_title, song_artist, io);
        if (!updatedSession) {
            return res.status(404).json({ message: 'Session not found.' });
        }
        res.json(updatedSession);
    } catch (error) {
        res.status(500).json({ message: 'Error updating session song.' });
    }
});

export default router;
