import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
