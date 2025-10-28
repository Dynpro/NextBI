import { Request, Response } from 'express';
import { Dashboard, Folder, ProjectUser, Tile } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new dashboard
 */
export const createDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, layout, folderId } = req.body;
    
    if (!folderId) {
      res.status(400).json({
        success: false,
        message: 'Folder ID is required'
      });
      return;
    }
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Dashboard name is required'
      });
      return;
    }
    
    // Find folder to get its project ID
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
        message: 'You don\'t have permission to create dashboards in this folder'
      });
      return;
    }
    
    // Create dashboard
    const dashboard = await Dashboard.create({
      id: uuidv4(),
      name,
      description: description || null,
      folderId,
      layout: layout || null
    });
    
    res.status(201).json({
      success: true,
      data: dashboard
    });
    
  } catch (error) {
    logger.error('Create dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dashboard'
    });
  }
};

/**
 * Get all dashboards in a folder
 */
export const getFolderDashboards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folderId } = req.params;
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(folderId);
    
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
    
    // Get dashboards with tile count
    const dashboards = await Dashboard.findAll({
      where: {
        folderId
      },
      include: [
        {
          model: Tile,
          as: 'tiles',
          attributes: ['id']
        }
      ]
    });
    
    // Map dashboards to include tile count
    const dashboardsWithCount = dashboards.map(dashboard => {
      const dashboardData = dashboard.toJSON();
      return {
        ...dashboardData,
        tileCount: 0, // Get tiles count from a separate query if needed
        tiles: undefined // Remove tiles array
      };
    });
    
    res.status(200).json({
      success: true,
      data: dashboardsWithCount
    });
    
  } catch (error) {
    logger.error('Get folder dashboards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get folder dashboards'
    });
  }
};

/**
 * Get dashboard by ID
 */
export const getDashboardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.params;
    
    const dashboard = await Dashboard.findByPk(dashboardId, {
      include: [
        {
          model: Tile,
          as: 'tiles'
        }
      ]
    });
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
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
        message: 'You don\'t have access to this dashboard'
      });
      return;
    }
    
    // Include user role in response
    const dashboardData = {
      ...dashboard.toJSON(),
      userRole: projectUser.role
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard'
    });
  }
};

/**
 * Update dashboard
 */
export const updateDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.params;
    const { name, description, layout } = req.body;
    
    const dashboard = await Dashboard.findByPk(dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
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
        message: 'You don\'t have permission to update this dashboard'
      });
      return;
    }
    
    // Update dashboard fields
    if (name !== undefined) dashboard.name = name;
    if (description !== undefined) dashboard.description = description;
    if (layout !== undefined) dashboard.layout = layout;
    
    // Save changes
    await dashboard.save();
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
    
  } catch (error) {
    logger.error('Update dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard'
    });
  }
};

/**
 * Save dashboard layout
 */
export const saveDashboardLayout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.params;
    const { layout } = req.body;
    
    if (!layout) {
      res.status(400).json({
        success: false,
        message: 'Layout data is required'
      });
      return;
    }
    
    const dashboard = await Dashboard.findByPk(dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
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
        message: 'You don\'t have permission to update this dashboard'
      });
      return;
    }
    
    // Update dashboard layout
    dashboard.layout = layout;
    
    // Save changes
    await dashboard.save();
    
    res.status(200).json({
      success: true,
      message: 'Dashboard layout saved successfully'
    });
    
  } catch (error) {
    logger.error('Save dashboard layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save dashboard layout'
    });
  }
};

/**
 * Delete dashboard
 */
export const deleteDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.params;
    
    const dashboard = await Dashboard.findByPk(dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
      return;
    }
    
    // Find folder to get its project ID
    const folder = await Folder.findByPk(dashboard.folderId);
    
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Parent folder not found'
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
        message: 'You don\'t have permission to delete this dashboard'
      });
      return;
    }
    
    // Delete dashboard (tiles will be cascade deleted via database constraints)
    await dashboard.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dashboard'
    });
  }
};
