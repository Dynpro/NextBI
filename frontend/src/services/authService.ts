import axios from 'axios';

// Backend API URL
const API_URL = 'http://localhost:3000';

// Token storage key
const TOKEN_KEY = 'nextbi_auth_token';
const USER_KEY = 'nextbi_user_data';

/**
 * Exchange Azure AD user info for backend JWT token
 */
export const exchangeAzureToken = async (userInfo: {
  id: string;
  displayName: string;
  email: string;
  photoUrl?: string | null;
}): Promise<string> => {
  try {
    console.log('Exchanging Azure token for backend JWT token:', userInfo);
    
    const response = await axios.post(`${API_URL}/api/auth/azure`, {
      azureId: userInfo.id,
      displayName: userInfo.displayName,
      email: userInfo.email,
      photoUrl: userInfo.photoUrl
    });

    console.log('Backend auth response:', response.data);

    if (response.data.success && response.data.data.token) {
      // Store the backend token and user data
      const token = response.data.data.token;
      const userData = response.data.data.user || {
        id: userInfo.id,
        displayName: userInfo.displayName,
        email: userInfo.email
      };
      
      setToken(token);
      setUser(userData);
      
      console.log('Backend token stored successfully');
      return token;
    } else {
      console.error('Backend did not return a token:', response.data);
      throw new Error('Failed to get backend token');
    }
  } catch (error: any) {
    console.error('Error exchanging Azure token:', error);
    console.error('Error details:', error.response?.data || 'No response data');
    throw error;
  }
};

/**
 * Get the backend JWT token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set the backend JWT token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get the current user from localStorage
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

/**
 * Set user data in localStorage
 */
export const setUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Check if user is authenticated based on token presence
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Get auth headers for API requests
 * @returns Headers for API requests
 */
export const getAuthHeaders = () => {
  const token = getToken();
  // Return plain headers, not wrapped in a 'headers' property
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Clear all auth data (on logout)
 */
export const clearAuthData = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Development login for local testing
 * Sends an email/displayName to backend /api/auth/dev to obtain a JWT and user object.
 */
export const devLogin = async (opts?: { email?: string; displayName?: string; avatar?: string; }): Promise<{ success: boolean; token?: string; user?: any; error?: any }> => {
  try {
    // Safe environment accessor for browser/runtime
    const getClientEnv = (key: string, fallback?: string): string | undefined => {
      try {
        if (typeof process !== "undefined" && (process as any).env && (process as any).env[key] !== undefined) {
          return (process as any).env[key];
        }
      } catch (e) {
        // ignore
      }

      if (typeof window !== "undefined") {
        const w = window as any;
        if (w.__env && w.__env[key] !== undefined) return w.__env[key];
        if (w[key] !== undefined) return w[key];
      }

      return fallback;
    };

    const payload = {
      email: opts?.email || getClientEnv('REACT_APP_DEV_TEST_EMAIL', 'dev@local.test'),
      displayName: opts?.displayName || getClientEnv('REACT_APP_DEV_DISPLAYNAME', 'Developer'),
      avatar: opts?.avatar || null
    };

    console.log('Performing dev login with payload:', payload);

    const response = await axios.post(`${API_URL}/api/auth/dev`, payload);

    console.log('Dev login response:', response.data);

    if (response.data.success && response.data.data?.token) {
      const token = response.data.data.token;
      const user = response.data.data.user;

      setToken(token);
      setUser(user);

      // Notify application that auth state changed (dev login)
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('nextbi:auth-changed', { detail: { method: 'dev', user } }));
        }
      } catch (e) {
        console.warn('Failed to dispatch auth event:', e);
      }
      
      return { success: true, token, user };
    }

    return { success: false, error: response.data };
  } catch (error: any) {
    console.error('Dev login error:', error);
    return { success: false, error: error.response?.data || error.message || error };
  }
};
