import { Request, Response } from 'express';
import { Folder, ProjectUser, Dashboard } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new folder within a project
 */
export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, projectId } = req.body;
    
    if (!projectId) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
      return;
    }
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
      return;
    }
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to create folders in this project'
      });
      return;
    }
    
    // Create folder
    const folder = await Folder.create({
      id: uuidv4(),
      name,
      description: description || null,
      projectId
    });
    
    res.status(201).json({
      success: true,
      data: folder
    });
    
  } catch (error) {
    logger.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder'
    });
  }
};

/**
 * Get all folders in a project
 */
export const getProjectFolders = async (req: Request, res: Response): Promise<void> => {
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
    
    // Get folders with dashboard count
    const folders = await Folder.findAll({
      where: {
        projectId
      },
      include: [
        {
          model: Dashboard,
          as: 'dashboards',
          attributes: ['id']
        }
      ]
    });
    
    // Map folders to include dashboard count
    const foldersWithCount = folders.map(folder => {
      const folderData = folder.toJSON();
      return {
        ...folderData,
        dashboardCount: 0, // Count dashboards separately with a query instead
        dashboards: undefined // Remove dashboards array
      };
    });
    
    res.status(200).json({
      success: true,
      data: foldersWithCount
    });
    
  } catch (error) {
    logger.error('Get project folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project folders'
    });
  }
};

/**
 * Get folder by ID
 */
export const getFolderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    
    const folder = await Folder.findByPk(folderId, {
      include: [
        {
          model: Dashboard,
          as: 'dashboards'
        }
      ]
    });
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
      return;
    }
    
    // Check if user has access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have access to this folder'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: folder
    });
    
  } catch (error) {
    logger.error('Get folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get folder'
    });
  }
};

/**
 * Update folder
 */
export const updateFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    const { name, description } = req.body;
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
      return;
    }
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to update this folder'
      });
      return;
    }
    
    // Update folder fields
    if (name !== undefined) folder.name = name;
    if (description !== undefined) folder.description = description;
    
    // Save changes
    await folder.save();
    
    res.status(200).json({
      success: true,
      data: folder
    });
    
  } catch (error) {
    logger.error('Update folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update folder'
    });
  }
};

/**
 * Delete folder
 */
export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    
    const folder = await Folder.findByPk(folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
      return;
    }
    
    // Check if user has admin/editor access to project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id,
        role: {
          [Op.in]: ['admin', 'editor']
        }
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You don\'t have permission to delete this folder'
      });
      return;
    }
    
    // Check if folder has dashboards
    const dashboardCount = await Dashboard.count({ 
      where: { folderId: folderId } 
    });
    
    if (dashboardCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete folder with dashboards. Please delete dashboards first.'
      });
      return;
    }
    
    // Delete folder
    await folder.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Folder deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder'
    });
  }
};
