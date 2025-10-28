import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle Microsoft Azure authentication
 * Creates or updates user based on Azure ID and profile
 */
export const azureAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { azureId, displayName, email, photoUrl } = req.body;
    
    if (!azureId || !email) {
      res.status(400).json({
        success: false,
        message: 'Azure ID and email are required'
      });
      return;
    }
    
    // Find existing user by Azure ID or email
    let user = await User.findOne({
      where: {
        azureId
      }
    });
    
    if (!user) {
      // Try to find by email as fallback
      user = await User.findOne({
        where: {
          email
        }
      });
      
      if (user) {
        // Update existing user with Azure ID
        user.azureId = azureId;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          id: uuidv4(),
          azureId,
          email,
          displayName: displayName || email.split('@')[0],
          avatar: photoUrl,
          lastLogin: new Date()
        });
      }
    } else {
      // Update user's last login time
      user.lastLogin = new Date();
      
      // Update profile info if provided
      if (displayName) user.displayName = displayName;
      if (photoUrl) user.avatar = photoUrl;
      
      await user.save();
    }
    
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email
    });
    
    // Return user data and token
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar
        },
        token
      }
    });
    
  } catch (error) {
    logger.error('Azure auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Development login - creates/fetches a user by email and issues a JWT
 * Intended for local testing only. Protect or disable in production.
 */
export const devAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, displayName, avatar } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required for dev login'
      });
      return;
    }

    // Find existing user by email
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new test user
      user = await User.create({
        id: uuidv4(),
        azureId: undefined,
        email,
        displayName: displayName || email.split('@')[0],
        avatar: avatar || null,
        lastLogin: new Date()
      });
    } else {
      user.lastLogin = new Date();
      if (displayName) user.displayName = displayName;
      if (avatar) user.avatar = avatar;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    logger.error('Dev auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Dev authentication failed'
    });
  }
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
    
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};
