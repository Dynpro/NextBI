import { Request, Response } from 'express';
import { Project, ProjectUser, User } from '../models';
import logger from '../utils/logger';

/**
 * Add a user to a project with a specific role
 */
export const addUserToProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      res.status(400).json({
        success: false,
        message: 'User ID and role are required'
      });
      return;
    }
    
    // Validate role
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be one of: admin, editor, viewer'
      });
      return;
    }
    
    // Check if project exists
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Check if the requesting user has admin access to the project
    const requesterRole = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id
      }
    });
    
    if (
      !requesterRole || 
      (requesterRole.role !== 'admin' && project.creatorId !== req.user.id)
    ) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to add users to this project'
      });
      return;
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Check if user is already in project
    const existingRole = await ProjectUser.findOne({
      where: {
        projectId,
        userId
      }
    });
    
    if (existingRole) {
      // Update role if user is already in project
      existingRole.role = role;
      await existingRole.save();
      
      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: {
          projectId,
          userId,
          role
        }
      });
      return;
    }
    
    // Add user to project with required fields for ProjectUserAttributes
    await ProjectUser.create({
      id: require('uuid').v4(), // Add missing id field
      projectId,
      userId,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'User added to project successfully',
      data: {
        projectId,
        userId,
        role
      }
    });
    
  } catch (error) {
    logger.error('Add user to project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add user to project'
    });
  }
};

/**
 * Remove a user from a project
 */
export const removeUserFromProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, userId } = req.params;
    
    // Check if project exists
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Check if the requesting user has admin access to the project
    const requesterRole = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id
      }
    });
    
    if (
      !requesterRole || 
      (requesterRole.role !== 'admin' && project.creatorId !== req.user.id)
    ) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to remove users from this project'
      });
      return;
    }
    
    // Prevent removing the project creator
    if (project.creatorId === userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot remove the project creator'
      });
      return;
    }
    
    // Remove user from project
    const deleted = await ProjectUser.destroy({
      where: {
        projectId,
        userId
      }
    });
    
    if (deleted === 0) {
      res.status(404).json({
        success: false,
        message: 'User is not a member of this project'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'User removed from project successfully'
    });
    
  } catch (error) {
    logger.error('Remove user from project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from project'
    });
  }
};

/**
 * Get all users in a project
 */
export const getProjectUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Check if user has access to the project
    const userAccess = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id
      }
    });
    
    if (!userAccess && project.creatorId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
      return;
    }
    
    // Get all users in the project with explicit typing
    const projectUsers = await ProjectUser.findAll({
      where: {
        projectId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'azureId', 'displayName', 'email', 'avatar']
        }
      ]
    });
    
    // Add project creator if not already included
    const creatorIncluded = projectUsers.some(
      projectUser => projectUser.userId === project.creatorId
    );
    
    // Extract user data with type safety
    let formattedUsers = await Promise.all(projectUsers.map(async projectUser => {
      // Get the user through a separate query
      const user = await User.findByPk(projectUser.userId);
      if (!user) return null;
        
      return {
        id: user.id,
        azureId: user.azureId,
        displayName: user.email.split('@')[0], // Use email prefix as display name
        email: user.email,
        avatar: user.avatar, // Using avatar field from User model
        role: projectUser.role,
        isCreator: projectUser.userId === project.creatorId
      };
    }));
    
    // Filter out any null entries from users who couldn't be found
    formattedUsers = formattedUsers.filter(user => user !== null);
    
    if (!creatorIncluded) {
      const creator = await User.findByPk(project.creatorId, {
        attributes: ['id', 'azureId', 'displayName', 'email', 'avatar']
      });
      
      if (creator) {
        formattedUsers.push({
          id: creator.id,
          azureId: creator.azureId,
          displayName: creator.displayName,
          email: creator.email,
          avatar: creator.avatar,
          role: 'admin', // Creator is always admin
          isCreator: true
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: formattedUsers
    });
    
  } catch (error) {
    logger.error('Get project users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project users'
    });
  }
};
