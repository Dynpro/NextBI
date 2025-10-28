import { Request, Response } from 'express';
import { Project, ProjectUser, User, Folder } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
      return;
    }
    
    const projectId = uuidv4();
    
    // Create project
    const project = await Project.create({
      id: projectId,
      name,
      description,
      creatorId: req.user.id
    });
    
    // Add creator as admin
    await ProjectUser.create({
      id: uuidv4(),
      projectId: project.id,
      userId: req.user.id,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: project
    });
    
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
};

/**
 * Get all projects the user has access to
 */
export const getUserProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find all project IDs the user has access to via ProjectUser
    const projectUsers = await ProjectUser.findAll({
      where: { userId: req.user.id }
    });
    
    const projectIds = projectUsers.map(pu => pu.projectId);
    
    // Get projects with their creators and user roles
    const projects = await Project.findAll({
      where: {
        id: {
          [Op.in]: projectIds
        }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'displayName', 'email', 'avatar']
        }
      ]
    });
    
    // Add role information for current user
    const projectsWithRoles = projects.map(project => {
      const projectUser = projectUsers.find(pu => pu.projectId === project.id);
      
      return {
        ...project.toJSON(),
        role: projectUser ? projectUser.role : null
      };
    });
    
    res.status(200).json({
      success: true,
      data: projectsWithRoles
    });
    
  } catch (error) {
    logger.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects'
    });
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Check if user has access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you don\'t have access'
      });
      return;
    }
    
    // Get project with creator info
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'displayName', 'email', 'avatar']
        },
        {
          model: Folder,
          as: 'folders'
        }
      ]
    });
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Add role information
    const projectWithRole = {
      ...project.toJSON(),
      role: projectUser.role
    };
    
    res.status(200).json({
      success: true,
      data: projectWithRole
    });
    
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project'
    });
  }
};

/**
 * Update project details
 */
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to update this project'
      });
      return;
    }
    
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Update fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    
    // Save changes
    await project.save();
    
    res.status(200).json({
      success: true,
      data: project
    });
    
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
};

/**
 * Delete project
 */
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Check if user has admin access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id,
        role: 'admin'
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to delete this project'
      });
      return;
    }
    
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Delete project
    await project.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
};

/**
 * Add a user to project with specified role
 */
export const addUserToProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;
    
    if (!email || !role) {
      res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
      return;
    }
    
    // Validate role
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Role must be admin, editor, or viewer'
      });
      return;
    }
    
    // Check if user has admin access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id,
        role: 'admin'
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to add users to this project'
      });
      return;
    }
    
    // Find user by email
    const user = await User.findOne({
      where: { email }
    });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    // Check if user is already in project
    const existingProjectUser = await ProjectUser.findOne({
      where: {
        projectId: projectId,
        userId: user.id
      }
    });
    
    if (existingProjectUser) {
      // Update role if user already exists
      existingProjectUser.role = role as 'admin' | 'editor' | 'viewer';
      await existingProjectUser.save();
      
      res.status(200).json({
        success: true,
        message: 'User role updated successfully'
      });
      return;
    }
    
    // Add user to project
    await ProjectUser.create({
      id: uuidv4(),
      projectId: projectId,
      userId: user.id,
      role: role as 'admin' | 'editor' | 'viewer',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'User added to project successfully'
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
 * Remove a user from project
 */
export const removeUserFromProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, userId } = req.params;
    
    // Check if user has admin access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id,
        role: 'admin'
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to remove users from this project'
      });
      return;
    }
    
    // Prevent removing yourself
    if (userId === req.user.id) {
      res.status(400).json({
        success: false,
        message: 'You cannot remove yourself from the project'
      });
      return;
    }
    
    // Find user in project
    const userToRemove = await ProjectUser.findOne({
      where: {
        projectId: projectId,
        userId
      }
    });
    
    if (!userToRemove) {
      res.status(404).json({
        success: false,
        message: 'User not found in project'
      });
      return;
    }
    
    // Remove user from project
    await userToRemove.destroy();
    
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
 * Get all users in project with their roles
 */
export const getProjectUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Check if user has access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have access to this project'
      });
      return;
    }
    
    // Get all users in project with their roles
    const projectUsers = await ProjectUser.findAll({
      where: {
        projectId: projectId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'displayName', 'email', 'avatar']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: projectUsers
    });
    
  } catch (error) {
    logger.error('Get project users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project users'
    });
  }
};
