import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../services/auth.service';
import { User, Role } from '../models/user.model';
import * as bcrypt from 'bcryptjs'

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // Use environment variables in production
const JWT_EXPIRATION = '1h';

const signToken = (user: User) => {
  return jwt.sign({ id: user.id, username: user.username, role: user.role, instrument: user.instrument, secret_key: user.secret_key }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

router.post('/signup', async (req: Request, res: Response) => {
  const { username, password, instrument } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = await createUser({ username, password, instrument }, Role.User); // Always assign USER role

    const token = signToken(newUser);

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role, instrument: newUser.instrument });

  } catch (error) {
    res.status(500).json({ message: 'Server error during signup' });
  }
});

router.post('/admin/signup', async (req: Request, res: Response) => {
  const { username, password, instrument, secretKey } = req.body;

  if (!username || !password || !secretKey) {
    return res.status(400).json({ message: 'Username, password, and secretKey are required' });
  }

  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = await createUser({ username, password, instrument, secret_key: secretKey }, Role.Admin);

    const token = signToken(newUser);

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role, instrument: newUser.instrument, secret_key: newUser.secret_key });

  } catch (error) {
    res.status(500).json({ message: 'Server error during admin signup' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password, secretKey } = req.body; // Accept secretKey from login form

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await findUserByUsername(username);

    if (!user || !user.password_hash || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If user is admin, verify secretKey
    if (user.role === Role.Admin) {
      if (!secretKey || user.secret_key !== secretKey) {
        return res.status(401).json({ message: 'Invalid admin secret key' });
      }
    }

    const token = signToken(user);

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.status(200).json({ id: user.id, username: user.username, instrument: user.instrument, role: user.role, secret_key: user.secret_key });

  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Logged out successfully' });
});

router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    res.json({ id: decoded.id, username: decoded.username, instrument: decoded.instrument, role: decoded.role, secret_key: decoded.secret_key });
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

export default router;