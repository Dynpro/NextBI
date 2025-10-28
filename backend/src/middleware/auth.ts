import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../utils/env';
import logger from '../utils/logger';

interface JwtPayload {
  id: string;
  email: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Add user info to request object
    (req as any).user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    logger.error('JWT verification error:', error);
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};
