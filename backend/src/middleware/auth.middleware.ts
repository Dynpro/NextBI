import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken } from '../utils/jwt';
import { User } from '../models';
import logger from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
      return;
    }
    
    // Find user by ID
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

/**
 * Middleware to check if user's Azure authentication is valid
 * Can be used after 'authenticate' middleware
 */
export const requireAzureAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.azureId) {
    res.status(403).json({
      success: false,
      message: 'Azure authentication required'
    });
    return;
  }
  
  next();
};
