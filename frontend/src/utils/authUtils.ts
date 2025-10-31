/**
 * Auth utilities for working with tokens
 */
import { getToken } from '../services/authService';

/**
 * Get access token for API calls
 * This should be called from components that need to make API calls
 */
export const getAccessToken = async (): Promise<string> => {
  // Get the backend token from localStorage via authService
  const token = getToken();
  
  if (!token) {
    console.error('No backend token available');
    // Don't redirect automatically as it can cause infinite loops
    // Let the component handle the error
    throw new Error('No backend token available. Please login again.');
  }
  
  return token;
};

/**
 * Create auth headers for API requests
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    // First try to get token directly from localStorage for faster access
    let token = getToken();
    
    if (!token) {
      // If no token in localStorage, try to get it from the access token function
      try {
        token = await getAccessToken();
      } catch (tokenError) {
        console.error('Failed to get access token:', tokenError);
        // Return empty headers instead of throwing
        return {};
      }
    }
    
    console.log('Auth headers token status:', token ? 'Available' : 'Missing');
    
    // Return headers in the correct format for Axios
    return token ? {
      Authorization: `Bearer ${token}`
    } : {};
  } catch (error) {
    console.error('Error getting auth headers:', error);
    // Return empty headers instead of throwing to prevent API call failures
    return {};
  }
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};
