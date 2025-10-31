import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

export interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl?: boolean;
  status: 'active' | 'inactive';
  lastTestedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DatabaseTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
  }>;
}

export interface CreateConnectionDto {
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  options?: Record<string, any>;
}

// Make sure this matches the same port as your auth service
const API_URL = 'http://localhost:3000/api/connections';

// Use the getAuthHeaders function from authUtils

export const databaseConnectionService = {
  // Get all connections
  async getAllConnections(): Promise<DatabaseConnection[]> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(API_URL, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  },

  // Get connection by ID
  async getConnectionById(id: string): Promise<DatabaseConnection> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/${id}`, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching connection ${id}:`, error);
      throw error;
    }
  },

  // Create new connection
  async createConnection(connectionData: CreateConnectionDto): Promise<DatabaseConnection> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(API_URL, connectionData, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  },

  // Update connection
  async updateConnection(id: string, connectionData: Partial<CreateConnectionDto>): Promise<DatabaseConnection> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(`${API_URL}/${id}`, connectionData, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating connection ${id}:`, error);
      throw error;
    }
  },

  // Delete connection
  async deleteConnection(id: string): Promise<void> {
    try {
      const authHeaders = await getAuthHeaders();
      await axios.delete(`${API_URL}/${id}`, { headers: authHeaders });
    } catch (error) {
      console.error(`Error deleting connection ${id}:`, error);
      throw error;
    }
  },

  // Test connection
  async testConnection(id: string): Promise<{ status: 'active' | 'inactive', lastTestedAt: string }> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/${id}/test`, {}, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error testing connection ${id}:`, error);
      throw error;
    }
  },
  
  // Get database schema
  async getDatabaseSchema(connectionId: string): Promise<{ tables: DatabaseTable[] }> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/${connectionId}/schema`, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching schema for connection ${connectionId}:`, error);
      throw error;
    }
  },
  
  // Get connections by project ID
  async getConnectionsByProjectId(projectId: string): Promise<DatabaseConnection[]> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/by-project/${projectId}`, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching connections for project ${projectId}:`, error);
      throw error;
    }
  },

  // Execute SQL query
  async executeQuery(connectionId: string, query: string): Promise<any[]> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/${connectionId}/query`, { query }, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error executing query on connection ${connectionId}:`, error);
      throw error;
    }
  }
};
