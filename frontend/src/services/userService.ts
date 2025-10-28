import axios, { AxiosError } from 'axios';
import { getAuthHeaders } from '../utils/authUtils';

// Match the same API_URL structure as in projectService.ts
const API_URL = 'http://localhost:3000';
const PROJECT_URL = `${API_URL}/api/project`;

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
}

export interface ProjectUser extends User {
  role: 'admin' | 'editor' | 'viewer';
  isCreator?: boolean;
}

/**
 * Search for users by email or name
 * @param query Search query (minimum 3 characters)
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  if (query.length < 3) {
    throw new Error('Search query must be at least 3 characters');
  }

  const authHeaders = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/users/search`, {
    params: { query },
    headers: authHeaders
  });
  
  return response.data.data;
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const authHeaders = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/api/auth/me`, { headers: authHeaders });
  
  return response.data.data;
};

/**
 * Get users in a project with their roles
 * @param projectId Project ID
 */
export const getProjectUsers = async (projectId: string): Promise<ProjectUser[]> => {
  try {
    console.log(`Getting users for project ${projectId}`);
    console.log(`API URL: ${PROJECT_URL}/${projectId}/users`);
    
    const authHeaders = await getAuthHeaders();
    console.log('Auth headers:', authHeaders);
    
    // Use the correct API endpoint structure
    const response = await axios.get(`${PROJECT_URL}/${projectId}/users`, { headers: authHeaders });
    
    console.log('API Response:', response);
    console.log('Project users data:', response.data);
    
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching project users:', error);
    // Return empty array instead of throwing to prevent component errors
    return [];
  }
};

/**
 * Add a user to a project with a specific role
 * @param projectId Project ID
 * @param userId User ID
 * @param role User role in the project
 */
/**
 * Add a user to a project
 * @param projectId Project ID
 * @param email User email
 * @param role User role in the project
 */
export const addUserToProject = async (
  projectId: string, 
  email: string, 
  role: 'admin' | 'editor' | 'viewer'
): Promise<void> => {
  const authHeaders = await getAuthHeaders();
  
  // API requires email and role
  await axios.post(
    `${PROJECT_URL}/${projectId}/users`, 
    { email, role },
    { headers: authHeaders }
  );
};

/**
 * Remove a user from a project
 * @param projectId Project ID
 * @param userId User ID
 */
export const removeUserFromProject = async (
  projectId: string, 
  userId: string
): Promise<void> => {
  const authHeaders = await getAuthHeaders();
  await axios.delete(
    `${PROJECT_URL}/${projectId}/users/${userId}`, 
    { headers: authHeaders }
  );
};

/**
 * Check if the current user has a specific permission in a project
 * @param projectId Project ID
 * @param permission Permission to check
 */
// Development mode flag - set to true to bypass permission checks during development
const DEV_MODE = false;

// Auto-add current user to project if they're not already in it
const AUTO_ADD_USER = false;

export const hasProjectPermission = async (
  projectId: string,
  permission: 'view' | 'edit' | 'manage'
): Promise<boolean> => {
  // In development mode, always grant permissions
  if (DEV_MODE) {
    console.log(`DEV MODE: Automatically granting ${permission} permission for project ${projectId}`);
    return true;
  }
  
  try {
    console.log(`Checking ${permission} permission for project ${projectId}`);
    
    // Get the current user first
    const currentUser = await getCurrentUser();
    console.log('Current user:', currentUser);
    console.log('Current user ID:', currentUser.id);
    
    // Check if the current user is the project creator by fetching project details
    // This requires making an API call to get project details
    try {
      const authHeaders = await getAuthHeaders();
      const projectResponse = await axios.get(`${PROJECT_URL}/${projectId}`, { headers: authHeaders });
      const project = projectResponse.data.data;
      
      // If the current user is the project creator, grant all permissions
      if (project && project.creatorId === currentUser.id) {
        console.log('User is the project creator, granting all permissions');
        return true;
      }
    } catch (projectError) {
      console.error('Error checking project creator:', projectError);
      // Continue with regular permission check if this fails
    }
    
    // Get project users
    const users = await getProjectUsers(projectId);
    console.log('Project users:', users);
    console.log('Project user IDs:', users.map(u => u.id));
    
    // Try to find user by ID with case-insensitive comparison
    let userInProject = users.find(user => 
      user.id && currentUser.id && 
      user.id.toLowerCase() === currentUser.id.toLowerCase()
    );
    
    // If not found by ID, try to find by email as a fallback
    if (!userInProject && currentUser.email) {
      userInProject = users.find(user => 
        user.email && currentUser.email && 
        user.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      console.log('User found by email match:', userInProject);
    }
    
    console.log('User in project:', userInProject);
    
    if (userInProject) {
      // Admin can do anything
      if (userInProject.role === 'admin' || userInProject.isCreator) {
        console.log('User is admin or creator, granting permission');
        return true;
      }
      
      // Editor can view and edit but not manage
      if (userInProject.role === 'editor') {
        const hasPermission = permission === 'view' || permission === 'edit';
        console.log(`User is editor, ${hasPermission ? 'granting' : 'denying'} ${permission} permission`);
        return hasPermission;
      }
      
      // Viewer can only view
      if (userInProject.role === 'viewer') {
        const hasPermission = permission === 'view';
        console.log(`User is viewer, ${hasPermission ? 'granting' : 'denying'} ${permission} permission`);
        return hasPermission;
      }
    } else {
      console.log('User not found in project');
      
      // Only try to add the user if AUTO_ADD_USER is true and it's not the project creator
      // We already checked if they're the creator above
      if (AUTO_ADD_USER && currentUser && currentUser.email) {
        try {
          console.log(`Auto-adding user ${currentUser.email} to project ${projectId} as editor`);
          await addUserToProject(projectId, currentUser.email, 'editor');
          console.log('User successfully added to project');
          
          // For edit and view permissions, return true since we just added them as editor
          if (permission === 'edit' || permission === 'view') {
            return true;
          }
          // For manage permission, still return false as editors can't manage
          return false;
        } catch (error) {
          console.error('Error auto-adding user to project:', error);
          // Type check for Axios error to safely access response data
          if (error instanceof AxiosError && error.response) {
            console.error('Error response:', error.response.data);
          }
          return false;
        }
      }
    }
    
    console.log('No matching role found, denying permission');
    return false;
  } catch (error) {
    console.error('Error checking project permission:', error);
    // In case of error, grant permission in development mode
    return DEV_MODE;
  }
};
