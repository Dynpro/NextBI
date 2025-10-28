import axios from 'axios';
import { CreateTileDto, TileData } from '../components/Tiles';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create a new tile
const createTile = async (tileData: CreateTileDto): Promise<TileData> => {
  const response = await axios.post(`${API_URL}/tiles`, tileData);
  return response.data;
};

// Get a tile by ID
const getTileById = async (id: string): Promise<TileData> => {
  const response = await axios.get(`${API_URL}/tiles/${id}`);
  return response.data;
};

// Get all tiles for a dashboard
const getTilesByDashboard = async (dashboardId: string): Promise<TileData[]> => {
  const response = await axios.get(`${API_URL}/tiles`, {
    params: { dashboardId }
  });
  return response.data;
};

// Update an existing tile
const updateTile = async (id: string, tileData: Partial<TileData>): Promise<TileData> => {
  const response = await axios.put(`${API_URL}/tiles/${id}`, tileData);
  return response.data;
};

// Delete a tile
const deleteTile = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/tiles/${id}`);
};

// Execute a tile query and get results
const executeTileQuery = async (tileId: string, query: string): Promise<any> => {
  const response = await axios.post(`${API_URL}/tiles/${tileId}/query`, { query });
  return response.data;
};

export const tileService = {
  createTile,
  getTileById,
  getTilesByDashboard,
  updateTile,
  deleteTile,
  executeTileQuery
};
