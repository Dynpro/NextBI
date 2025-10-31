import axios from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

// Backend API URL
const API_URL = 'http://localhost:3000';

// Define base URLs for API endpoints according to new structure
const PROJECT_URL = `${API_URL}/api/project`;
const PROJECTS_URL = `${API_URL}/api/projects`; // For listing all projects
const FOLDER_URL = `${API_URL}/api/folder`;
const DASHBOARD_URL = `${API_URL}/api/dashboard`;
const TILE_URL = `${API_URL}/api/tile`;

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt?: string;
  folders?: Folder[];
}

export interface Folder {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Dashboard {
  id: string;
  folderId: string;
  name: string;
  description: string;
  layout: any;
  createdAt: string;
  updatedAt?: string;
}

export interface TextRow {
  id: string;
  tileId: string;
  type: 'header' | 'subheader' | 'text';
  content: string;
  isQuery: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tile {
  id: string;
  dashboardId: string;
  dataModelId?: string;
  name: string;
  description?: string;
  connectionId?: string;
  type: 'Text & Query' | 'Pie Chart'; // Updated to use frontend types
  config: any;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  textRows?: TextRow[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectDto {
  name: string;
  description: string;
}

export interface CreateFolderDto {
  name: string;
  description: string;
  projectId: string;
}

export interface CreateDashboardDto {
  name: string;
  projectId: string;
  folderId: string;
  description?: string;
}

export interface CreateTileDto {
  // Required fields according to backend validation
  title: string; // Backend expects 'title' not 'name'
  dashboardId: string;
  type: 'Text & Query' | 'Pie Chart'; // Using frontend types as that's what the API validation expects
  connectionId: string; // Add connectionId as required field
  
  // Optional fields
  dataModelId?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'donut'; // Added at top level for backend validation
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: {
    chartType?: 'bar' | 'line' | 'pie' | 'donut';
    dimensions?: any[];
    measures?: any[];
    textRows?: Array<{ text: string }>;
    isQueryMode?: boolean;
    customQuery?: string;
    [key: string]: any;
  };
  // Add textRows field to support the new TextRow model
  textRows?: Array<{
    type: 'header' | 'subheader' | 'text';
    text?: string;
    content?: string;
    isQuery?: boolean;
  }>;
  description?: string;
}

export const projectService = {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    try {
      const headers = await getAuthHeaders();
      // Use the projects URL for listing all projects
      const response = await axios.get(`${PROJECTS_URL}/all`, { headers });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  async getProjectById(id: string): Promise<Project> {
    try {
      const headers = await getAuthHeaders();
      // Use the new PROJECT_URL format with projectId
      const response = await axios.get(`${PROJECT_URL}/${id}`, { headers });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },

  async createProject(projectData: CreateProjectDto): Promise<Project> {
    try {
      const headers = await getAuthHeaders();
      // Use PROJECT_URL for creating a project
      const response = await axios.post(PROJECT_URL, projectData, { headers });
      return response.data.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async updateProject(id: string, projectData: Partial<CreateProjectDto>): Promise<Project> {
    try {
      const headers = await getAuthHeaders();
      // Use PROJECT_URL with projectId for updating
      const response = await axios.put(`${PROJECT_URL}/${id}`, projectData, { headers });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      // Use PROJECT_URL with projectId for deleting
      await axios.delete(`${PROJECT_URL}/${id}`, { headers });
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  },

  // Folders
  async getFoldersByProjectId(projectId: string): Promise<Folder[]> {
    try {
      // First try API call
      try {
        const headers = await getAuthHeaders();
        // Using the by-project endpoint for compatibility
        const response = await axios.get(`${FOLDER_URL}/by-project/${projectId}`, { headers });
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      } catch (apiError) {
        console.error('API call for folders failed:', apiError);
      }
      
      // Fallback to localStorage
      console.log('Using localStorage fallback for folders');
      const projectFoldersKey = `project_folders_${projectId}`;
      const folderIds = JSON.parse(localStorage.getItem(projectFoldersKey) || '[]');
      
      // Get each folder from localStorage
      const folders: Folder[] = [];
      for (const folderId of folderIds) {
        const folderKey = `folder_${folderId}`;
        const folderData = localStorage.getItem(folderKey);
        if (folderData) {
          folders.push(JSON.parse(folderData));
        }
      }
      
      return folders;
    } catch (error) {
      console.error(`Error fetching folders for project ${projectId}:`, error);
      throw error;
    }
  },

  async getFolderById(id: string): Promise<Folder> {
    try {
      // First try API call
      try {
        const headers = await getAuthHeaders();
        // Use the new URL structure
        const response = await axios.get(`${FOLDER_URL}/${id}`, { headers });
        return response.data.data;
      } catch (apiError) {
        console.error('API call for folder failed:', apiError);
      }

      // Fallback to localStorage
      console.log('Using localStorage fallback for folder');
      const folderKey = `folder_${id}`;
      const folderData = localStorage.getItem(folderKey);
      if (!folderData) {
        throw new Error(`Folder ${id} not found in localStorage`);
      }
      
      return JSON.parse(folderData);
    } catch (error) {
      console.error(`Error fetching folder ${id}:`, error);
      throw error;
    }
  },

  async createFolder(folderData: CreateFolderDto): Promise<Folder> {
    try {
      // First try API call
      try {
        const headers = await getAuthHeaders();
        // Use the new URL structure
        const response = await axios.post(FOLDER_URL, folderData, { headers });
        return response.data.data;
      } catch (apiError) {
        console.error('API call for folder creation failed:', apiError);
      }

      // Fallback to localStorage
      console.log('Using localStorage fallback for folder creation');
      const folderId = `folder_${Date.now()}`;
      const newFolder: Folder = {
        id: folderId.replace('folder_', ''),
        name: folderData.name,
        description: folderData.description,
        projectId: folderData.projectId,
        createdAt: new Date().toISOString(),
      };
      
      // Save folder to localStorage
      localStorage.setItem(`folder_${newFolder.id}`, JSON.stringify(newFolder));
      
      // Update project's folder list
      const projectFoldersKey = `project_folders_${folderData.projectId}`;
      const folderIds = JSON.parse(localStorage.getItem(projectFoldersKey) || '[]');
      folderIds.push(newFolder.id);
      localStorage.setItem(projectFoldersKey, JSON.stringify(folderIds));
      
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  async updateFolder(id: string, folderData: Partial<CreateFolderDto>): Promise<Folder> {
    try {
      // First try API call
      // Try API update first
      try {
        const headers = await getAuthHeaders();
        // Use the new URL structure
        const response = await axios.put(
          `${FOLDER_URL}/${id}`,
          folderData,
          { headers }
        );
        return response.data.data;
      } catch (apiError) {
        console.error('API call for folder update failed:', apiError);
      }

      // Fallback to localStorage
      console.log('Using localStorage fallback for folder update');
      const folderKey = `folder_${id}`;
      const existingFolderData = localStorage.getItem(folderKey);
      if (!existingFolderData) {
        throw new Error(`Folder ${id} not found in localStorage`);
      }
      
      const existingFolder: Folder = JSON.parse(existingFolderData);
      const updatedFolder: Folder = {
        ...existingFolder,
        ...folderData,
        updatedAt: new Date().toISOString(),
      };
      
      // Save updated folder to localStorage
      localStorage.setItem(folderKey, JSON.stringify(updatedFolder));
      
      return updatedFolder;
    } catch (error) {
      console.error(`Error updating folder ${id}:`, error);
      throw error;
    }
  },

  async deleteFolder(id: string): Promise<void> {
    try {
      // First try API call
      try {
        const headers = await getAuthHeaders();
        // Use the new URL structure
        await axios.delete(`${FOLDER_URL}/${id}`, { headers });
        return;
      } catch (apiError) {
        console.error('API call for folder deletion failed:', apiError);
      }

      // Fallback to localStorage
      console.log('Using localStorage fallback for folder deletion');
      // Get folder data to extract projectId
      const folderKey = `folder_${id}`;
      const folderData = localStorage.getItem(folderKey);
      if (!folderData) {
        throw new Error(`Folder ${id} not found in localStorage`);
      }
      
      const folder: Folder = JSON.parse(folderData);
      const projectId = folder.projectId;
      
      // Remove folder from localStorage
      localStorage.removeItem(folderKey);
      
      // Update project's folder list
      const projectFoldersKey = `project_folders_${projectId}`;
      const folderIds = JSON.parse(localStorage.getItem(projectFoldersKey) || '[]');
      const updatedFolderIds = folderIds.filter((fId: string) => fId !== id);
      localStorage.setItem(projectFoldersKey, JSON.stringify(updatedFolderIds));
    } catch (error) {
      console.error(`Error deleting folder ${id}:`, error);
      throw error;
    }
  },

  // Dashboards
  async getDashboardsByFolderId(folderId: string): Promise<Dashboard[]> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure
      const response = await axios.get(
        `${DASHBOARD_URL}/by-folder/${folderId}`,
        { headers }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching dashboards for folder ${folderId}:`, error);
      throw error;
    }
  },

  async getDashboardById(id: string): Promise<Dashboard> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure
      const response = await axios.get(
        `${DASHBOARD_URL}/${id}`,
        { headers }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching dashboard ${id}:`, error);
      throw error;
    }
  },

  async createDashboard(dashboardData: CreateDashboardDto): Promise<Dashboard> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure
      const response = await axios.post(
        DASHBOARD_URL,
        dashboardData, 
        { headers }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }
  },

  async updateDashboard(id: string, dashboardData: Partial<CreateDashboardDto>): Promise<Dashboard> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure - no need to check for projectId and folderId
      const response = await axios.put(
        `${DASHBOARD_URL}/${id}`,
        dashboardData,
        { headers }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating dashboard ${id}:`, error);
      throw error;
    }
  },

  async deleteDashboard(id: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure
      await axios.delete(`${DASHBOARD_URL}/${id}`, { headers });
    } catch (error) {
      console.error(`Error deleting dashboard ${id}:`, error);
      throw error;
    }
  },

  // Tiles
  async getTilesByDashboardId(dashboardId: string): Promise<Tile[]> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure
      const response = await axios.get(
        `${TILE_URL}/by-dashboard/${dashboardId}`,
        { headers }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching tiles for dashboard ${dashboardId}:`, error);
      throw error;
    }
  },

  async createTile(tileData: CreateTileDto): Promise<Tile> {
    try {
      const headers = await getAuthHeaders();
      
      // Debug logging to see the exact payload
      console.log('Creating tile with payload:', JSON.stringify(tileData, null, 2));
      
      // Use the new URL structure
      const response = await axios.post(
        TILE_URL,
        tileData,
        { headers }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating tile:', error);
      // Log the error response data if available
      if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
      }
      throw error;
    }
  },

  async updateTile(id: string, tileData: Partial<CreateTileDto>): Promise<Tile> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure - no need to check for parent IDs
      const response = await axios.put(
        `${TILE_URL}/${id}`,
        tileData,
        { headers }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating tile ${id}:`, error);
      throw error;
    }
  },

  async deleteTile(id: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      // Use the new URL structure
      await axios.delete(
        `${TILE_URL}/${id}`,
        { headers }
      );
    } catch (error) {
      console.error(`Error deleting tile ${id}:`, error);
      throw error;
    }
  }
};
