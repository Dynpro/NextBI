import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

// API URL for direct query execution
const API_URL = 'http://localhost:3000/api/query';

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: {
    name: string;
    dataTypeID: number;
  }[];
}

export const queryService = {
  /**
   * Execute a direct SQL query against a database connection
   * @param connectionId The ID of the database connection
   * @param query The SQL query to execute
   * @param params Optional parameters for the query
   */
  async executeQuery(connectionId: string, query: string, params: any[] = []): Promise<QueryResult> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/connections/${connectionId}/execute`, 
        { query, params }, 
        { headers: authHeaders }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
};
