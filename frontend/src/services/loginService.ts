import { AccountInfo } from '@azure/msal-browser';
import { exchangeAzureToken, getToken, setToken, clearAuthData } from './authService';

/**
 * Login with Azure AD account info
 * This will exchange the Azure AD token for a backend JWT token
 */
export const loginWithAzure = async (account: AccountInfo): Promise<any> => {
  try {
    console.log('Processing Azure login for account:', account);
    
    // Extract user info from the account
    const userInfo = {
      id: account.localAccountId,
      displayName: account.name || '',
      email: account.username,
      photoUrl: null
    };
    
    console.log('Extracted user info:', userInfo);
    
    // Exchange Azure token for backend JWT token
    console.log('Exchanging Azure token for backend JWT token...');
    const token = await exchangeAzureToken(userInfo);
    console.log('Token received from backend:', token ? 'Token received' : 'No token received');
    
    if (!token) {
      console.error('No token received from backend');
      return {
        success: false,
        error: 'Failed to get token from backend'
      };
    }
    
    // Store the token
    setToken(token);
    
    // Set auth method in localStorage
    localStorage.setItem('nextbi_auth_method', 'msal');
    console.log('Auth method set in localStorage');
    
    return {
      success: true,
      token,
      user: userInfo
    };
  } catch (error) {
    console.error('Azure login error:', error);
    return {
      success: false,
      error: 'Failed to authenticate with Azure'
    };
  }
};

/**
 * Get stored token and user info
 */
export const getStoredSession = () => {
  const token = getToken();
  if (!token) return null;
  
  return {
    token,
    authMethod: localStorage.getItem('nextbi_auth_method') || 'msal'
  };
};

/**
 * Logout user
 */
export const logout = (): void => {
  clearAuthData();
  localStorage.removeItem('nextbi_auth_method');
};

/**
 * Get the stored token
 */
export const getStoredToken = (): string | null => {
  return getToken();
};
