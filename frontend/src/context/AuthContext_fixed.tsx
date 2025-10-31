import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/auth.config';
import { loginWithAzure, getStoredSession } from '../services/loginService';
import { getUser, clearAuthData } from '../services/authService';

// Define the shape of our auth context
export interface AuthContextType {
  isAuthenticated: boolean;
  userData: any | null;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
  loading: boolean;
  getAccessToken: () => Promise<string | null>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userData: null,
  login: async () => {},
  logout: () => {},
  error: null,
  loading: false,
  getAccessToken: async () => null,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  // Get access token for API calls
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!msalInstance) return null;
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;
    
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      return tokenResponse.accessToken;
    } catch (error) {
      // If silent token acquisition fails, fallback to interactive method
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
          return tokenResponse.accessToken;
        } catch (err) {
          console.error('Error acquiring token interactively:', err);
          return null;
        }
      }
      console.error('Error acquiring token silently:', error);
      return null;
    }
  }, [msalInstance]);

  // Exchange MSAL token for JWT token
  const exchangeTokenForJWT = useCallback(async (account: AccountInfo) => {
    try {
      console.log('Exchanging MSAL token for JWT token, account:', account);
      
      if (!account || !account.username) {
        console.error('No username found in account');
        setError('Failed to get user email from Microsoft account');
        return null;
      }
      
      // Exchange Azure token for backend JWT token
      const loginResult = await loginWithAzure(account);
      
      if (loginResult.success) {
        // Update user state with the user info
        setUserData(loginResult.user);
        setIsAuthenticated(true);
        localStorage.setItem('nextbi_auth_method', 'msal');
        setError(null);
        console.log('Token exchange successful', loginResult.user);
        return loginResult.user;
      } else {
        console.error('Token exchange failed:', loginResult.error);
        setError('Failed to authenticate with backend');
        return null;
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      setError('Failed to authenticate with backend');
      return null;
    }
  }, []);

  // Initialize MSAL instance
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        console.log('Initializing MSAL with config:', msalConfig);
        const msalApp = new PublicClientApplication(msalConfig);
        setMsalInstance(msalApp);

        // First check if we have a valid JWT token in localStorage
        const storedSession = getStoredSession();
        const storedUser = getUser();
        
        if (storedSession && storedUser) {
          // If we have a stored token and user, restore the session
          setUserData(storedUser);
          setIsAuthenticated(true);
          console.log('Restored user session from localStorage');
          setLoading(false);
          setError(null);
        } else {
          // Handle redirect response if no stored session
          const result = await msalApp.handleRedirectPromise();
          console.log('MSAL redirect response:', result);

          // Check if user is already signed in with MSAL
          const accounts = msalApp.getAllAccounts();
          if (accounts.length > 0) {
            console.log('MSAL account found:', accounts[0]);
            
            // Exchange the Azure AD token for a backend JWT token
            await exchangeTokenForJWT(accounts[0]);
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing MSAL:', err);
        setError('Failed to initialize authentication');
        setLoading(false);
      }
    };

    initializeMsal();
  }, [exchangeTokenForJWT]);

  // Login function
  const login = async () => {
    try {
      if (!msalInstance) {
        throw new Error('Authentication not initialized');
      }

      setLoading(true);
      setError(null);

      // Set flag to indicate login was attempted
      localStorage.setItem('loginAttempted', 'true');
      localStorage.setItem('nextbi_auth_method', 'msal');

      // Use loginRedirect for better compatibility with SPAs
      console.log('Starting MSAL login redirect with request:', loginRequest);
      await msalInstance.loginRedirect(loginRequest);
      
      // The page will reload after redirect completes
      // The useEffect above will handle the redirect response
      console.log('MSAL login redirect initiated');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed');
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      const currentAuthMethod = localStorage.getItem('nextbi_auth_method');
      console.log(`Logging out with auth method: ${currentAuthMethod || 'unknown'}`);
      
      // Clear all authentication data
      localStorage.removeItem('loginAttempted');
      clearAuthData();
      localStorage.removeItem('nextbi_auth_method');
      
      // Reset state
      setIsAuthenticated(false);
      setUserData(null);
      
      // If using MSAL auth and instance exists, also log out from Microsoft
      if (currentAuthMethod === 'msal' && msalInstance) {
        console.log('Starting MSAL logout redirect');
        msalInstance.logoutRedirect({
          postLogoutRedirectUri: window.location.origin,
        });
      } else {
        // For other auth methods or if MSAL instance is not available
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, ensure localStorage and state are cleared
      clearAuthData();
      localStorage.removeItem('nextbi_auth_method');
      localStorage.removeItem('loginAttempted');
      setIsAuthenticated(false);
      setUserData(null);
      // Redirect to login page as fallback
      window.location.href = '/login';
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    userData,
    login,
    logout,
    error,
    loading,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
