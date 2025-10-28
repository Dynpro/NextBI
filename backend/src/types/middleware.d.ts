import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
}

// No module declaration to avoid conflict with the actual implementation
