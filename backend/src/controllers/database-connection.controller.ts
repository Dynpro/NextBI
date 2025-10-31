import { Request, Response } from 'express';
import { DatabaseConnection } from '../models';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

/**
 * Create a new database connection
 */
export const createDatabaseConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, host, port, database, username, password, ssl, options } = req.body;
    
    // Validate required fields
    if (!name || !host || !database || !username || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
      return;
    }
    
    // Create database connection
    const connection = await DatabaseConnection.create({
      id: uuidv4(),
      name,
      type: type || 'postgresql',
      host,
      port: port || 5432,
      database,
      username,
      password,
      ssl: ssl || false,
      options: options || {},
      status: 'inactive',
      createdById: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        ssl: connection.ssl,
        status: connection.status,
        lastTestedAt: connection.lastTestedAt,
        createdAt: connection.createdAt
      }
    });
    
  } catch (error) {
    logger.error('Create connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create database connection'
    });
  }
};

/**
 * Get all database connections
 */
export const getAllDatabaseConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const connections = await DatabaseConnection.findAll({
      attributes: ['id', 'name', 'type', 'host', 'port', 'database', 'username', 'ssl', 'status', 'lastTestedAt', 'createdAt']
    });
    
    res.status(200).json({
      success: true,
      data: connections
    });
    
  } catch (error) {
    logger.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database connections'
    });
  }
};

/**
 * Get database connection by ID
 */
export const getDatabaseConnectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const connection = await DatabaseConnection.findByPk(id, {
      attributes: ['id', 'name', 'type', 'host', 'port', 'database', 'username', 'ssl', 'options', 'status', 'lastTestedAt', 'createdAt']
    });
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: connection
    });
    
  } catch (error) {
    logger.error('Get connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database connection'
    });
  }
};

/**
 * Update database connection
 */
export const updateDatabaseConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, host, port, database, username, password, ssl, options } = req.body;
    
    const connection = await DatabaseConnection.findByPk(id);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
      return;
    }
    
    // Update fields
    if (name !== undefined) connection.name = name;
    if (host !== undefined) connection.host = host;
    if (port !== undefined) connection.port = port;
    if (database !== undefined) connection.database = database;
    if (username !== undefined) connection.username = username;
    if (password !== undefined) connection.password = password;
    if (ssl !== undefined) connection.ssl = ssl;
    if (options !== undefined) connection.options = options;
    
    // Save changes
    await connection.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        ssl: connection.ssl,
        status: connection.status,
        lastTestedAt: connection.lastTestedAt,
        updatedAt: connection.updatedAt
      }
    });
    
  } catch (error) {
    logger.error('Update connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update database connection'
    });
  }
};

/**
 * Delete database connection
 */
export const deleteDatabaseConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const connection = await DatabaseConnection.findByPk(id);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
      return;
    }
    
    // Delete connection
    await connection.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Database connection deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete database connection'
    });
  }
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find the connection in the database
    const connection = await DatabaseConnection.findByPk(id);
    
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
        // Try to connect with a short timeout
        connectionTimeoutMillis: 5000,
      });
      
      try {
        // Attempt to connect and run a simple query
        const client = await pool.connect();
        try {
          await client.query('SELECT NOW()');
          
          // Update connection status and last tested date
          connection.status = 'active';
          connection.lastTestedAt = new Date();
          await connection.save();
          
          res.status(200).json({
            success: true,
            message: 'Connection successful',
            data: {
              status: 'active',
              lastTestedAt: connection.lastTestedAt
            }
          });
        } finally {
          client.release();
          await pool.end();
        }
      } catch (error) {
        // Set connection as inactive
        connection.status = 'inactive';
        await connection.save();
        
        res.status(400).json({
          success: false,
          message: `Connection failed: ${(error as Error).message}`
        });
      }
    } else {
      // For other database types (to be implemented)
      res.status(400).json({
        success: false,
        message: `Database type ${connection.type} not supported yet`
      });
    }
    
  } catch (error) {
    logger.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test database connection'
    });
  }
};

/**
 * Get database schema information
 */
/**
 * Get table columns information
 */
export const getTableColumns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, schema, table } = req.params;
    
    // Find the connection in the database
    const connection = await DatabaseConnection.findByPk(id);
    
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
        // Connect to the database
        const client = await pool.connect();
        try {
          // Get all columns for the specified table and schema
          const columnsResult = await client.query(
            `SELECT 
              column_name, 
              data_type, 
              is_nullable,
              column_default,
              character_maximum_length
            FROM information_schema.columns 
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position`,
            [schema, table]
          );
          
          res.status(200).json({
            success: true,
            data: columnsResult.rows
          });
        } finally {
          client.release();
          await pool.end();
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          message: `Failed to fetch table columns: ${(error as Error).message}`
        });
      }
    } else {
      // For other database types (to be implemented)
      res.status(400).json({
        success: false,
        message: `Database type ${connection.type} not supported yet`
      });
    }
    
  } catch (error) {
    logger.error('Get table columns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve table columns'
    });
  }
};

/**
 * Get database schema information
 */
export const getDatabaseSchema = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find the connection in the database
    const connection = await DatabaseConnection.findByPk(id);
    
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
        // Connect to the database
        const client = await pool.connect();
        try {
          // Get all schemas
          const schemasResult = await client.query(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')"
          );
          const schemas = schemasResult.rows.map(row => row.schema_name);
          
          // Get all tables for each schema
          const tables: Record<string, string[]> = {};
          
          for (const schema of schemas) {
            const tablesResult = await client.query(
              "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE'",
              [schema]
            );
            tables[schema] = tablesResult.rows.map(row => row.table_name);
          }
          
          res.status(200).json({
            success: true,
            data: {
              schemas,
              tables
            }
          });
        } finally {
          client.release();
          await pool.end();
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          message: `Failed to fetch schema: ${(error as Error).message}`
        });
      }
    } else {
      // For other database types (to be implemented)
      res.status(400).json({
        success: false,
        message: `Database type ${connection.type} not supported yet`
      });
    }
    
  } catch (error) {
    logger.error('Get schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database schema'
    });
  }
};

/**
 * Execute SQL query on database connection
 */
export const executeQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { query } = req.body;
    
    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Query is required'
      });
      return;
    }
    
    // Get database connection
    const connection = await DatabaseConnection.findByPk(id);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
      return;
    }
    
    // Create connection pool
    const pool = new Pool({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: connection.password,
      ssl: connection.ssl ? { rejectUnauthorized: false } : false
    });
    
    try {
      // Execute query
      const result = await pool.query(query);
      
      // Close the pool
      await pool.end();
      
      res.status(200).json({
        success: true,
        data: result.rows
      });
      
    } catch (queryError: any) {
      // Close the pool on error
      await pool.end();
      
      logger.error('Query execution error:', queryError);
      res.status(400).json({
        success: false,
        message: 'Query execution failed',
        error: queryError.message
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
