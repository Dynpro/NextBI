import { Request, Response } from 'express';
import { Project, Folder, Dashboard, Tile, DataModel, DatabaseConnection, ProjectUser } from '../models';
import { Op } from 'sequelize';
import { Model } from 'sequelize';
import logger from '../utils/logger';

/**
 * Get project dashboard overview with summary metrics
 */
export const getProjectOverview = async (req: Request, res: Response): Promise<void> => {
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
        message: 'You do not have access to this project'
      });
      return;
    }
    
    // Get project details
    const project = await Project.findByPk(projectId);
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }
    
    // Get count of folders
    const folderCount = await Folder.count({
      where: { projectId }
    });
    
    // Get folders for dashboard counting
    const folders = await Folder.findAll({
      where: { projectId },
      attributes: ['id']
    });
    
    const folderIds = folders.map((folder: any) => folder.id);
    
    // Get count of dashboards
    const dashboardCount = folderIds.length > 0 ? 
      await Dashboard.count({
        where: {
          folderId: {
            [Op.in]: folderIds
          }
        }
      }) : 0;
    
    // Get dashboards for tile counting
    const dashboards = folderIds.length > 0 ?
      await Dashboard.findAll({
        where: {
          folderId: {
            [Op.in]: folderIds
          }
        },
        attributes: ['id']
      }) : [];
    
    const dashboardIds = dashboards.map((dashboard: any) => dashboard.id);
    
    // Get count of tiles
    const tileCount = dashboardIds.length > 0 ?
      await Tile.count({
        where: {
          dashboardId: {
            [Op.in]: dashboardIds
          }
        }
      }) : 0;
    
    // Count data models in project
    const dataModelCount = await DataModel.count({
      include: [{
        model: Project,
        where: { id: projectId }
      }]
    });
    
    // Count connections in project
    const connectionCount = await DatabaseConnection.count({
      include: [{
        model: Project,
        where: { id: projectId }
      }]
    });
    
    // Get count of users with access to project
    const userCount = await ProjectUser.count({
      where: { projectId }
    });
    
    // Get latest updated dashboards
    const latestDashboards = dashboardIds.length > 0 ?
      await Dashboard.findAll({
        where: {
          id: {
            [Op.in]: dashboardIds
          }
        },
        order: [['updatedAt', 'DESC']],
        limit: 5,
        include: [{
          model: Folder,
          as: 'folder',
          attributes: ['id', 'name']
        }]
      }) : [];
    
    res.status(200).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        metrics: {
          folderCount,
          dashboardCount,
          tileCount,
          dataModelCount,
          connectionCount,
          userCount
        },
        latestDashboards: latestDashboards.map((dashboard: any) => ({
          id: dashboard.id,
          name: dashboard.name,
          folderName: dashboard.folder.name,
          folderId: dashboard.folder.id,
          updatedAt: dashboard.updatedAt
        }))
      }
    });
    
  } catch (error) {
    logger.error('Get project overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project overview'
    });
  }
};

/**
 * Get dashboard analytics including metrics about tiles and data models
 */
export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.params;
    
    // Get dashboard
    const dashboard = await Dashboard.findByPk(dashboardId, {
      include: [{
        model: Folder,
        as: 'folder'
      }]
    });
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
      return;
    }
    
    // Check if user has access to project through the folder's project
    // The folder should have a projectId property
    const folder = await Folder.findByPk(dashboard.folderId);
    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Folder not found for this dashboard'
      });
      return;
    }
    
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: folder.projectId,
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this dashboard'
      });
      return;
    }
    
    // Get tiles for the dashboard
    const tiles = await Tile.findAll({
      where: { dashboardId },
      include: [{
        model: DataModel,
        as: 'dataModel',
        attributes: ['id', 'name']
      }]
    });
    
    // Calculate dashboard analytics
    const tileCount = tiles.length;
    
    // Count tiles by type
    const tilesByType = tiles.reduce((acc: Record<string, number>, tile: any) => {
      acc[tile.type] = (acc[tile.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count tiles by chart type (for chart tiles)
    const chartTiles = tiles.filter((tile: any) => tile.type === 'chart');
    const chartsByType = chartTiles.reduce((acc: Record<string, number>, tile: any) => {
      if (tile.chartType) {
        acc[tile.chartType] = (acc[tile.chartType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Count tiles by data model
    const tilesByDataModel = tiles.reduce((acc: Record<string, number>, tile: any) => {
      if (tile.dataModelId && tile.dataModel) {
        const key = `${tile.dataModel.id}:${tile.dataModel.name}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Format data model usage for output
    const dataModelUsage = Object.entries(tilesByDataModel).map(([key, count]: [string, number]) => {
      const [id, name] = key.split(':');
      return { id, name, tileCount: count };
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: dashboard.id,
        name: dashboard.name,
        folderId: dashboard.folderId,
        folderName: folder ? folder.name : 'Unknown',
        projectId: folder ? folder.projectId : 'Unknown', // Access through the folder
        createdAt: dashboard.createdAt,
        updatedAt: dashboard.updatedAt,
        metrics: {
          tileCount,
          tilesByType,
          chartsByType,
          dataModelUsage
        }
      }
    });
    
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics'
    });
  }
};
