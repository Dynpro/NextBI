import { Request, Response } from 'express';
import { DatabaseConnection } from '../models';
import logger from '../utils/logger';
import { Pool } from 'pg';

/**
 * Execute a direct SQL query against a database connection
 */
export const executeQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { connectionId } = req.params;
    const { query, params = [] } = req.body;
    
    if (!query) {
      res.status(400).json({
        success: false,
        message: 'SQL query is required'
      });
      return;
    }
    
    // Find the connection in the database
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
        connectionTimeoutMillis: 30000, // Longer timeout for queries
      });
      
      try {
        // Connect to the database
        const client = await pool.connect();
        try {
          // Execute the query
          const result = await client.query(query, params);
          
          res.status(200).json({
            success: true,
            data: {
              rows: result.rows,
              rowCount: result.rowCount,
              fields: result.fields.map(field => ({
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
      // For other database types (to be implemented)
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
