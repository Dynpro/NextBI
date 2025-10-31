import { Request, Response } from 'express';
import { User } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';

/**
 * Search for users by email or name
 * Used for inviting users to projects
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string' || query.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters'
      });
      return;
    }
    
    // Search for users by email or display name
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: `%${query}%` } },
          { displayName: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'email', 'displayName', 'avatar'],
      limit: 10
    });
    
    res.status(200).json({
      success: true,
      data: users
    });
    
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'displayName', 'avatar']
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

/**
 * Update current user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { displayName, avatar } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Update user profile fields
    if (displayName !== undefined) user.displayName = displayName;
    if (avatar !== undefined) user.avatar = avatar;
    
    await user.save();
    
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
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};
