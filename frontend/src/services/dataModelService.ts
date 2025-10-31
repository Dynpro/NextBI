import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

export interface DataModel {
  id: string;
  name: string;
  description: string;
  connectionId: string;
  schema: string;
  tables: string[];
  query: string;
  status: 'active' | 'draft' | 'error';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDataModelDto {
  name: string;
  description: string;
  connectionId: string;
  schema?: string;
  tables?: string[];
  query?: string;
}

export interface DatabaseColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  primaryKey?: string[];
  foreignKeys?: Array<{
    column: string;
    referenceTable: string;
    referenceColumn: string;
  }>;
}

export interface DatabaseSchemaResponse {
  schemas?: string[];
  tables: DatabaseTable[] | Record<string, string[]>;
}

export interface TableColumnsResponse {
  columns: DatabaseColumn[];
}

// Make sure this matches the same port as your auth service
const API_URL = 'http://localhost:3000/api/data-models';

export const dataModelService = {
  // Get all data models
  async getAllDataModels(): Promise<DataModel[]> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(API_URL, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching data models:', error);
      throw error;
    }
  },

  // Get data model by ID
  async getDataModelById(id: string): Promise<DataModel> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/${id}`, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching data model ${id}:`, error);
      throw error;
    }
  },

  // Create new data model
  async createDataModel(dataModelData: CreateDataModelDto): Promise<DataModel> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(API_URL, dataModelData, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error('Error creating data model:', error);
      throw error;
    }
  },

  // Update data model
  async updateDataModel(id: string, dataModelData: Partial<CreateDataModelDto>): Promise<DataModel> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(`${API_URL}/${id}`, dataModelData, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating data model ${id}:`, error);
      throw error;
    }
  },

  // Delete data model
  async deleteDataModel(id: string): Promise<void> {
    try {
      const authHeaders = await getAuthHeaders();
      await axios.delete(`${API_URL}/${id}`, { headers: authHeaders });
    } catch (error) {
      console.error(`Error deleting data model ${id}:`, error);
      throw error;
    }
  },

  // Get database schema for a connection
  async getDatabaseSchema(connectionId: string): Promise<DatabaseSchemaResponse> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`http://localhost:3001/api/connections/${connectionId}/schema`, { headers: authHeaders });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching schema for connection ${connectionId}:`, error);
      throw error;
    }
  },
  
  // Get columns for a specific table
  async getTableColumns(connectionId: string, schema: string, tableName: string): Promise<TableColumnsResponse> {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(
        `http://localhost:3001/api/connections/${connectionId}/schema/${schema}/tables/${tableName}/columns`, 
        { headers: authHeaders }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching columns for table ${schema}.${tableName}:`, error);
      throw error;
    }
  }
};
