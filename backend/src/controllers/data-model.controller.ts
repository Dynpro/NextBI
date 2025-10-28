import { Request, Response } from 'express';
import { DataModel, DatabaseConnection } from '../models';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

/**
 * Create a new data model
 */
export const createDataModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      description, 
      connectionId, 
      schema, 
      query, 
      refreshSchedule 
    } = req.body;
    
    if (!name || !connectionId) {
      res.status(400).json({
        success: false,
        message: 'Name and connection ID are required'
      });
      return;
    }
    
    // Check if database connection exists
    const connection = await DatabaseConnection.findByPk(connectionId);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
      return;
    }
    
    // Create data model
    const dataModel = await DataModel.create({
      id: uuidv4(),
      name,
      description: description || null,
      connectionId,
      schema: schema || {},
      query: query || null,
      refreshSchedule: refreshSchedule || null,
      createdById: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: dataModel
    });
    
  } catch (error) {
    logger.error('Create data model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data model'
    });
  }
};

/**
 * Get all data models
 */
export const getAllDataModels = async (req: Request, res: Response): Promise<void> => {
  try {
    const dataModels = await DataModel.findAll({
      include: [
        {
          model: DatabaseConnection,
          as: 'connection',
          attributes: ['id', 'name', 'type']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: dataModels
    });
    
  } catch (error) {
    logger.error('Get data models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data models'
    });
  }
};

/**
 * Get data model by ID
 */
export const getDataModelById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const dataModel = await DataModel.findByPk(id, {
      include: [
        {
          model: DatabaseConnection,
          as: 'connection',
          attributes: ['id', 'name', 'type', 'host', 'database']
        }
      ]
    });
    
    if (!dataModel) {
      res.status(404).json({
        success: false,
        message: 'Data model not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: dataModel
    });
    
  } catch (error) {
    logger.error('Get data model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data model'
    });
  }
};

/**
 * Update data model
 */
export const updateDataModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      schema, 
      query, 
      refreshSchedule 
    } = req.body;
    
    const dataModel = await DataModel.findByPk(id);
    
    if (!dataModel) {
      res.status(404).json({
        success: false,
        message: 'Data model not found'
      });
      return;
    }
    
    // Update data model fields
    if (name !== undefined) dataModel.name = name;
    if (description !== undefined) dataModel.description = description;
    if (schema !== undefined) dataModel.schema = schema;
    if (query !== undefined) dataModel.query = query;
    if (refreshSchedule !== undefined) dataModel.refreshSchedule = refreshSchedule;
    
    // Save changes
    await dataModel.save();
    
    res.status(200).json({
      success: true,
      data: dataModel
    });
    
  } catch (error) {
    logger.error('Update data model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data model'
    });
  }
};

/**
 * Delete data model
 */
export const deleteDataModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const dataModel = await DataModel.findByPk(id);
    
    if (!dataModel) {
      res.status(404).json({
        success: false,
        message: 'Data model not found'
      });
      return;
    }
    
    // Delete data model
    await dataModel.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Data model deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete data model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete data model'
    });
  }
};

/**
 * Get database schema for a connection
 */
export const getDatabaseSchema = async (req: Request, res: Response): Promise<void> => {
  try {
    const { connectionId } = req.params;
    
    // Find the connection
    const connection = await DatabaseConnection.findByPk(connectionId);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
      return;
    }
    
    // For PostgreSQL connections
    if (connection.type === 'postgresql') {
      const pool = new Pool({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        ssl: connection.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
      });
      
      try {
        const client = await pool.connect();
        try {
          // Query to get tables
          const tablesQuery = `
            SELECT 
              table_schema,
              table_name
            FROM 
              information_schema.tables
            WHERE 
              table_schema NOT IN ('pg_catalog', 'information_schema')
              AND table_type = 'BASE TABLE'
            ORDER BY 
              table_schema, table_name;
          `;
          
          const tablesResult = await client.query(tablesQuery);
          const tables = tablesResult.rows;
          
          // For each table, get columns
          const schema: Record<string, any> = {};
          
          for (const table of tables) {
            const tableName = table.table_name;
            const schemaName = table.table_schema;
            const fullTableName = `${schemaName}.${tableName}`;
            
            // Query to get columns for this table
            const columnsQuery = `
              SELECT 
                column_name, 
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
              FROM 
                information_schema.columns
              WHERE 
                table_schema = $1
                AND table_name = $2
              ORDER BY 
                ordinal_position;
            `;
            
            const columnsResult = await client.query(columnsQuery, [schemaName, tableName]);
            
            // Store table schema
            schema[fullTableName] = {
              columns: columnsResult.rows.map((col: any) => ({
                name: col.column_name,
                dataType: col.data_type,
                nullable: col.is_nullable === 'YES',
                defaultValue: col.column_default,
                maxLength: col.character_maximum_length
              }))
            };
            
            // Get primary key
            const primaryKeyQuery = `
              SELECT
                kcu.column_name
              FROM
                information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
              WHERE
                tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = $1
                AND tc.table_name = $2;
            `;
            
            const primaryKeyResult = await client.query(primaryKeyQuery, [schemaName, tableName]);
            
            if (primaryKeyResult.rows.length > 0) {
              schema[fullTableName].primaryKey = primaryKeyResult.rows.map((row: any) => row.column_name);
            }
            
            // Get foreign keys
            const foreignKeysQuery = `
              SELECT
                kcu.column_name,
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
              FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
              WHERE
                tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = $1
                AND tc.table_name = $2;
            `;
            
            const foreignKeysResult = await client.query(foreignKeysQuery, [schemaName, tableName]);
            
            if (foreignKeysResult.rows.length > 0) {
              schema[fullTableName].foreignKeys = foreignKeysResult.rows.map((row: any) => ({
                column: row.column_name,
                referenceTable: `${row.foreign_table_schema}.${row.foreign_table_name}`,
                referenceColumn: row.foreign_column_name
              }));
            }
          }
          
          // Return schema
          res.status(200).json({
            success: true,
            data: {
              tables: Object.keys(schema).map(tableName => ({
                name: tableName,
                ...schema[tableName]
              }))
            }
          });
          
        } finally {
          client.release();
          await pool.end();
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: `Failed to get database schema: ${(error as Error).message}`
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: `Database type ${connection.type} not supported yet`
      });
    }
    
  } catch (error) {
    logger.error('Get database schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database schema'
    });
  }
};

/**
 * Execute a query on a data model
 */
export const executeQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { query, parameters } = req.body;
    
    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Query is required'
      });
      return;
    }
    
    // Get data model
    const dataModel = await DataModel.findByPk(id, {
      include: [
        {
          model: DatabaseConnection,
          as: 'connection'
        }
      ]
    });
    
    if (!dataModel) {
      res.status(404).json({
        success: false,
        message: 'Data model not found'
      });
      return;
    }
    
    // Get connection using proper association
    const connection = await DatabaseConnection.findByPk(dataModel.connectionId);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
      return;
    }
    
    // For PostgreSQL connections
    if (connection.type === 'postgresql') {
      const pool = new Pool({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        ssl: connection.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 30000, // 30 seconds timeout for queries
      });
      
      try {
        const client = await pool.connect();
        try {
          // Execute query with parameters if provided
          const result = parameters 
            ? await client.query(query, parameters)
            : await client.query(query);
          
          // Update last refreshed time
          dataModel.lastRefreshedAt = new Date();
          await dataModel.save();
          
          res.status(200).json({
            success: true,
            data: {
              rows: result.rows,
              rowCount: result.rowCount,
              fields: result.fields.map((field: any) => ({
                name: field.name,
                dataTypeID: field.dataTypeID
              }))
            }
          });
          
        } finally {
          client.release();
          await pool.end();
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          message: `Query execution failed: ${(error as Error).message}`
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: `Database type ${connection.type} not supported yet`
      });
    }
    
  } catch (error) {
    logger.error('Execute query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute query'
    });
  }
};
