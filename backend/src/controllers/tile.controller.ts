import { Request, Response } from 'express';
import { Tile, Dashboard, Folder, ProjectUser, TextRow, sequelize } from '../models';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all tiles in a dashboard
 */
export const getDashboardTiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.params;
    
    // Find dashboard
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
    
    // Get tiles with their text rows
    const tiles = await Tile.findAll({
      where: {
        dashboardId
      },
      include: [{
        model: TextRow,
        as: 'textRows',
        required: false
      }]
    });
    
    res.status(200).json({
      success: true,
      data: tiles
    });
    
  } catch (error) {
    logger.error('Get dashboard tiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard tiles'
    });
  }
};

/**
 * Create a new tile on a dashboard
 */
export const createTile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dashboardId } = req.body;
    const { 
      title, 
      type, 
      content, 
      position, 
      styling, 
      connectionId,
      textRows 
    } = req.body;
    
    if (!title || !type || !dashboardId || !connectionId) {
      res.status(400).json({
        success: false,
        message: 'Title, type, dashboardId, and connectionId are required'
      });
      return;
    }
    
    // Validate tile type
    if (!['Text & Query', 'Pie Chart'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Tile type must be Text & Query or Pie Chart'
      });
      return;
    }
    
    // Tile type validation passed
    
    // Find dashboard
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
        message: 'You don\'t have permission to add tiles to this dashboard'
      });
      return;
    }
    
    // Start a transaction
    const t = await sequelize.transaction();
    
    try {
      // Create tile
      const tileId = uuidv4();
      const tile = await Tile.create({
        id: tileId,
        title,
        type,
        connectionId,
        content: content || {},
        position: position || { x: 0, y: 0, w: 6, h: 6 },
        styling: styling || { 
          backgroundColor: '#ffffff', 
          textColor: '#333333'
        },
        dashboardId
      }, { transaction: t });
      
      // Create text rows if applicable
      if (type === 'Text & Query' && Array.isArray(textRows)) {
        for (const rowData of textRows) {
          await TextRow.create({
            id: uuidv4(),
            tileId: tileId,
            type: rowData.type || 'text',
            content: rowData.text || rowData.content || '',
            isQuery: rowData.isQuery || false
          }, { transaction: t });
        }
      }
      
      // Commit transaction
      await t.commit();
      
      // Fetch the created tile with its text rows
      const createdTile = await Tile.findByPk(tileId, {
        include: [{
          model: TextRow,
          as: 'textRows'
        }]
      });
      
      res.status(201).json({
        success: true,
        data: createdTile
      });
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
    
  } catch (error) {
    logger.error('Create tile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tile'
    });
  }
};

/**
 * Get a tile by ID
 */
export const getTileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    
    // Find tile with associated text rows
    const tile = await Tile.findByPk(tileId, {
      include: [{
        model: TextRow,
        as: 'textRows'
      }]
    });
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
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
        message: 'You don\'t have access to this tile'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: tile
    });
    
  } catch (error) {
    logger.error('Get tile by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tile'
    });
  }
};

/**
 * Update tile
 */
export const updateTile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    const { 
      title, 
      type, 
      content, 
      position, 
      styling,
      connectionId,
      textRows 
    } = req.body;
    
    const tile = await Tile.findByPk(tileId);
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
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
        message: 'You don\'t have permission to update this tile'
      });
      return;
    }
    
    // Start a transaction to ensure all database operations succeed or fail together
    const t = await sequelize.transaction();
    
    try {
      // Update tile basic properties
      if (title !== undefined) tile.title = title;
      if (type !== undefined) tile.type = type;
      if (content !== undefined) tile.content = content;
      if (position !== undefined) tile.position = position;
      if (styling !== undefined) tile.styling = styling;
      if (connectionId !== undefined) tile.connectionId = connectionId;
      
      // Save changes to tile
      await tile.save({ transaction: t });
      
      // Handle text rows for Text & Query tiles
      if (tile.type === 'Text & Query' && textRows) {
        // First, delete all existing text rows for this tile
        await TextRow.destroy({
          where: { tileId: tile.id },
          transaction: t
        });
        
        // Then create new text rows from the provided data
        if (Array.isArray(textRows)) {
          for (const rowData of textRows) {
            await TextRow.create({
              id: uuidv4(),
              tileId: tile.id,
              type: rowData.type || 'text',
              content: rowData.text || rowData.content || '',
              isQuery: rowData.isQuery || false
            }, { transaction: t });
          }
        }
      }
      
      // Commit the transaction
      await t.commit();
      
      // Fetch the updated tile with its text rows
      const updatedTile = await Tile.findByPk(tileId, {
        include: [{
          model: TextRow,
          as: 'textRows'
        }]
      });
      
      res.status(200).json({
        success: true,
        data: updatedTile
      });
      
    } catch (error) {
      // Rollback transaction if any operation fails
      await t.rollback();
      throw error;
    }
    
  } catch (error) {
    logger.error('Update tile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tile'
    });
  }
};

/**
 * Update tile position
 */
export const updateTilePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    const { position } = req.body;
    
    if (!position) {
      res.status(400).json({
        success: false,
        message: 'Position data is required'
      });
      return;
    }
    
    const tile = await Tile.findByPk(tileId);
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
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
        message: 'You don\'t have permission to update this tile'
      });
      return;
    }
    
    // Update tile position
    tile.position = position;
    
    // Save changes
    await tile.save();
    
    res.status(200).json({
      success: true,
      message: 'Tile position updated successfully'
    });
    
  } catch (error) {
    logger.error('Update tile position error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tile position'
    });
  }
};

/**
 * Delete tile
 */
export const deleteTile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tileId } = req.params;
    
    const tile = await Tile.findByPk(tileId);
    
    if (!tile) {
      res.status(404).json({
        success: false,
        message: 'Tile not found'
      });
      return;
    }
    
    // Find dashboard
    const dashboard = await Dashboard.findByPk(tile.dashboardId);
    
    if (!dashboard) {
      res.status(404).json({
        success: false,
        message: 'Parent dashboard not found'
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
        message: 'You don\'t have permission to delete this tile'
      });
      return;
    }
    
    // Delete tile
    await tile.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Tile deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete tile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tile'
    });
  }
};
