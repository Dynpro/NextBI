import { Request, Response } from 'express';
import { DataModel, DatabaseConnection, ProjectUser } from '../models';
import { Pool, QueryResult } from 'pg';
import type { FieldDef } from 'pg';
import logger from '../utils/logger';

/**
 * Execute analytics query for dashboard visualization
 */
export const executeAnalyticsQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataModelId } = req.params;
    const { query, parameters } = req.body;
    
    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Query is required'
      });
      return;
    }
    
    // Find data model 
    const dataModel = await DataModel.findByPk(dataModelId, {
      include: [{ model: DatabaseConnection, as: 'connection' }]
    });
    
    if (!dataModel) {
      res.status(404).json({
        success: false,
        message: 'Data model not found'
      });
      return;
    }
    
    // Check if user has access to this data model via project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: dataModel.createdById, // Using createdById as a fallback until proper model association is defined
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false, 
        message: 'You do not have access to this data model'
      });
      return;
    }
    
    // For now, we only support PostgreSQL
    const connection = await DatabaseConnection.findByPk(dataModel.connectionId);
    if (!connection) {
      res.status(404).json({ success: false, message: 'Database connection not found' });
      return;
    }
    
    if (connection.type !== 'postgres') {
      res.status(400).json({
        success: false,
        message: 'Only PostgreSQL is supported at this time'
      });
      return;
    }
    
    // Create database connection pool
    const pool = new Pool({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      ssl: connection.ssl ? { rejectUnauthorized: false } : false
    });
    
    try {
      // Execute query with parameters if provided
      const queryResult = parameters 
        ? await pool.query(query, parameters) 
        : await pool.query(query);
      
      // Close pool
      await pool.end();
      
      res.status(200).json({
        success: true,
        data: {
          rows: queryResult.rows,
          rowCount: queryResult.rowCount,
          fields: queryResult.fields.map((field: FieldDef) => ({
            name: field.name,
            dataTypeID: field.dataTypeID
          }))
        }
      });
      
    } catch (queryError: unknown) {
      logger.error('Query execution error:', queryError);
      
      // Close pool on error
      await pool.end();
      
      res.status(400).json({
        success: false,
        message: `Query execution error: ${queryError instanceof Error ? queryError.message : String(queryError)}`
      });
    }
    
  } catch (error) {
    logger.error('Execute analytics query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute analytics query'
    });
  }
};

/**
 * Calculate aggregate statistics for KPI tiles
 */
export const calculateKpiMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataModelId } = req.params;
    const { 
      metricType, 
      tableName, 
      columnName, 
      filterCondition,
      parameters 
    } = req.body;
    
    if (!metricType || !tableName || !columnName) {
      res.status(400).json({
        success: false,
        message: 'Metric type, table name, and column name are required'
      });
      return;
    }
    
    // Validate metric type
    const validMetrics = ['count', 'sum', 'average', 'min', 'max'];
    if (!validMetrics.includes(metricType)) {
      res.status(400).json({
        success: false,
        message: `Invalid metric type. Must be one of: ${validMetrics.join(', ')}`
      });
      return;
    }
    
    // Find data model 
    const dataModel = await DataModel.findByPk(dataModelId, {
      include: [{ model: DatabaseConnection, as: 'connection' }]
    });
    
    if (!dataModel) {
      res.status(404).json({
        success: false,
        message: 'Data model not found'
      });
      return;
    }
    
    // Check if user has access to this data model via project
    const projectUser = await ProjectUser.findOne({
      where: {
        projectId: dataModel.createdById, // Using createdById as a fallback until proper model association is defined
        userId: req.user.id
      }
    });
    
    if (!projectUser) {
      res.status(403).json({
        success: false, 
        message: 'You do not have access to this data model'
      });
      return;
    }
    
    // For now, we only support PostgreSQL
    const connection = await DatabaseConnection.findByPk(dataModel.connectionId);
    if (!connection) {
      res.status(404).json({ success: false, message: 'Database connection not found' });
      return;
    }
    
    if (connection.type !== 'postgres') {
      res.status(400).json({
        success: false,
        message: 'Only PostgreSQL is supported at this time'
      });
      return;
    }
    
    // Build the query based on metric type
    let query: string;
    let aggregateFunction: string;
    
    switch (metricType) {
      case 'count':
        aggregateFunction = 'COUNT';
        break;
      case 'sum':
        aggregateFunction = 'SUM';
        break;
      case 'average':
        aggregateFunction = 'AVG';
        break;
      case 'min':
        aggregateFunction = 'MIN';
        break;
      case 'max':
        aggregateFunction = 'MAX';
        break;
      default:
        aggregateFunction = 'COUNT';
    }
    
    if (metricType === 'count' && columnName === '*') {
      query = `SELECT ${aggregateFunction}(*) AS value FROM "${tableName}"`;
    } else {
      query = `SELECT ${aggregateFunction}("${columnName}") AS value FROM "${tableName}"`;
    }
    
    // Add filter condition if provided
    if (filterCondition) {
      query += ` WHERE ${filterCondition}`;
    }
    
    // Create database connection pool
    const pool = new Pool({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      ssl: connection.ssl ? { rejectUnauthorized: false } : false
    });
    
    try {
      // Execute query with parameters if provided
      const queryResult = parameters 
        ? await pool.query(query, parameters) 
        : await pool.query(query);
      
      // Close pool
      await pool.end();
      
      if (queryResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No data found for the specified metric'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: {
          metricType,
          value: queryResult.rows[0].value
        }
      });
      
    } catch (queryError: unknown) {
      logger.error('KPI calculation error:', queryError);
      
      // Close pool on error
      await pool.end();
      
      res.status(400).json({
        success: false,
        message: `KPI calculation error: ${queryError instanceof Error ? queryError.message : String(queryError)}`
      });
    }
    
  } catch (error) {
    logger.error('Calculate KPI metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate KPI metrics'
    });
  }
};
