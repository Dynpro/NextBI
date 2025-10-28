import jwt from 'jsonwebtoken';
import env from '../utils/env';
import logger from './logger';

interface JwtPayload {
  id: string;
  email: string;
  role?: string;
}

/**
 * Generate a JWT token for a user
 * @param payload User payload containing id, email, and role
 * @returns Generated JWT token
 */
export const generateToken = (payload: object): string => {
  if (!env.JWT_SECRET || typeof env.JWT_SECRET !== 'string') {
    throw new Error('JWT_SECRET is not set or is not a string');
  }
  const secret: string = env.JWT_SECRET;
  try {
    // @ts-expect-error: jsonwebtoken type definitions are buggy with some versions
    return jwt.sign(payload, secret, {
      expiresIn: env.JWT_EXPIRES_IN || '1d'
    });
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify a JWT token and return the decoded payload
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    logger.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Extract token from request headers
 * @param authHeader Authorization header value
 * @returns Bearer token or null
 */
export const extractToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
};
