import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError, EventType } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/auth.config';
import { loginWithAzure, getStoredSession } from '../services/loginService';
import { getUser, clearAuthData } from '../services/authService';
import { setAuthLogoutFunction, setupAxiosInterceptors } from '../utils/axiosInterceptors';

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
  // Initialize axios interceptors
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [msalInitialized, setMsalInitialized] = useState<boolean>(false);

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
      console.log('Calling loginWithAzure with account:', account.username);
      const loginResult = await loginWithAzure(account);
      console.log('Login result from backend:', loginResult);
      
      if (loginResult.success) {
        // Update user state with the user info
        console.log('Setting authenticated state with user:', loginResult.user);
        setUserData(loginResult.user);
        setIsAuthenticated(true);
        localStorage.setItem('nextbi_auth_method', 'msal');
        setError(null);
        console.log('Authentication state updated - isAuthenticated:', true);
        
        // Force navigation to home page after successful login
        console.log('Redirecting to home page');
        window.location.href = '/';
        
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

  // Initialize MSAL and check for existing sessions
  const initializeMsal = useCallback(async () => {
    try {
      console.log('Initializing MSAL with config:', msalConfig);
      // Create the MSAL instance
      const msalApp = new PublicClientApplication(msalConfig);
      
      // CRITICAL: Initialize MSAL before calling any other methods
      console.log('Calling MSAL initialize method');
      await msalApp.initialize();
      console.log('MSAL initialization completed successfully');
      setMsalInitialized(true);
      
      // Register event callbacks after initialization
      msalApp.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
          console.log('MSAL login success event:', event);
          // The payload for LOGIN_SUCCESS contains the account
          const payload = event.payload as { account: AccountInfo };
          if (payload && payload.account) {
            exchangeTokenForJWT(payload.account);
          }
        } else if (event.eventType === EventType.LOGIN_FAILURE) {
          console.error('MSAL login failure event:', event);
          setError('Login failed');
          setLoading(false);
        }
      });
      
      // Set the instance in state for later use
      setMsalInstance(msalApp);
      
      // Handle any redirect response that might be present
      try {
        console.log('Checking for MSAL redirect response');
        const response = await msalApp.handleRedirectPromise();
        
        if (response) {
          console.log('Redirect response detected:', response);
          if (response.account) {
            console.log('Account found in redirect response, exchanging token');
            await exchangeTokenForJWT(response.account);
            return; // Exit early as we've handled authentication
          }
        } else {
          console.log('No redirect response detected');
        }
      } catch (redirectErr) {
        console.error('Error handling redirect response:', redirectErr);
        // Continue with normal flow even if redirect handling fails
      }
      
      // Check for existing session
      const storedSession = getStoredSession();
      const storedUser = getUser();
      
      if (storedSession && storedUser) {
        // If we have a stored token and user, restore the session
        setUserData(storedUser);
        setIsAuthenticated(true);
        console.log('Restored user session from localStorage');
        setError(null);
      } else {
        // Check if user is already signed in with MSAL
        const accounts = msalApp.getAllAccounts();
        if (accounts.length > 0) {
          console.log('MSAL account found:', accounts[0]);
          // Exchange the Azure AD token for a backend JWT token
          await exchangeTokenForJWT(accounts[0]);
        } else {
          console.log('No accounts found in MSAL cache');
        }
      }
    } catch (err) {
      console.error('Error initializing MSAL:', err);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  }, [exchangeTokenForJWT]);
  
  // Effect to initialize MSAL when component mounts
  useEffect(() => {
    initializeMsal();
  }, [initializeMsal]);

  // Helper function to clear any stuck MSAL interactions
  const clearMsalState = () => {
    try {
      // Clear MSAL-specific session storage items
      const msalKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.indexOf('msal.') !== -1 || key.indexOf('msal.interaction') !== -1)) {
          msalKeys.push(key);
        }
      }
      
      // Remove the collected keys
      msalKeys.forEach(key => {
        console.log('Clearing MSAL session storage item:', key);
        sessionStorage.removeItem(key);
      });
      
      // Clear our own tracking flag
      sessionStorage.removeItem('loginInProgress');
      console.log('Cleared MSAL interaction state');
    } catch (e) {
      console.error('Error while clearing MSAL state:', e);
    }
  };

  // Login function
  const login = async () => {
    try {
      if (!msalInstance) {
        throw new Error('Authentication not initialized');
      }

      // Clear any stuck MSAL interactions first
      clearMsalState();
      console.log('Cleared previous MSAL state before login attempt');
      
      // Set a flag to indicate login is in progress
      sessionStorage.setItem('loginInProgress', 'true');

      setLoading(true);
      setError(null);

      // Set flag to indicate login was attempted
      localStorage.setItem('loginAttempted', 'true');
      localStorage.setItem('nextbi_auth_method', 'msal');

      // Ensure MSAL is properly initialized before proceeding
      if (!msalInitialized) {
        console.log('MSAL not fully initialized yet, initializing now');
        try {
          // Re-initialize MSAL
          await msalInstance.initialize();
          setMsalInitialized(true);
          console.log('MSAL initialization successful');
        } catch (initError) {
          console.error('MSAL initialization failed:', initError);
          throw new Error('Failed to initialize authentication system');
        }
      }

      try {
        // Check if there are any accounts already in the cache
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          console.log('Account already exists in cache, using it:', accounts[0]);
          // We already have an account, use it
          await exchangeTokenForJWT(accounts[0]);
          // Clear the in-progress flag
          sessionStorage.removeItem('loginInProgress');
          return;
        }

        console.log('Starting MSAL login popup with request:', loginRequest);
        const result = await msalInstance.loginPopup({
          ...loginRequest,
          prompt: 'select_account' // Force account selection
        });
        
        console.log('MSAL login popup completed:', result);
        
        // Process the account from the result
        if (result && result.account) {
          console.log('Login successful, exchanging token for account:', result.account);
          await exchangeTokenForJWT(result.account);
        } else {
          console.error('No account in login result');
          setError('Failed to get account information');
        }
      } catch (popupError) {
        console.error('MSAL popup error:', popupError);
        if (popupError instanceof Error) {
          if (popupError.message.includes('interaction_in_progress')) {
            setError('Another login attempt is already in progress. Please wait a moment and try again.');
          } else {
            setError(`Login failed: ${popupError.message}`);
          }
        } else {
          setError('Login failed');
        }
      } finally {
        // Always clear the in-progress flag when done
        sessionStorage.removeItem('loginInProgress');
        if (!isAuthenticated) {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed');
      setLoading(false);
      // Make sure to clear the flag in case of outer errors
      sessionStorage.removeItem('loginInProgress');
    }
  };

  // Logout function
  // isAutoLogout flag indicates if this logout was triggered automatically by token expiration
  const logout = async (isAutoLogout?: boolean) => {
    try {
      const currentAuthMethod = localStorage.getItem('nextbi_auth_method');
      console.log(`Logging out with auth method: ${currentAuthMethod || 'unknown'}`);
      
      // Clean up MSAL state first to prevent stuck interactions
      clearMsalState();
      
      // Clear all authentication data
      localStorage.removeItem('loginAttempted');
      clearAuthData();
      localStorage.removeItem('nextbi_auth_method');
      
      // Reset state
      setIsAuthenticated(false);
      setUserData(null);
      
      // If using MSAL auth and instance exists, also log out from Microsoft
      if (currentAuthMethod === 'msal' && msalInstance) {
        try {
          console.log(`Starting MSAL logout (auto: ${isAutoLogout ? 'yes' : 'no'})`);
          
          if (isAutoLogout) {
            // For automatic logouts, use logoutRedirect with main window redirect
            // This closes the popup and redirects the main window
            msalInstance.logoutRedirect({
              onRedirectNavigate: () => {
                // Return false to prevent MSAL from redirecting within the popup
                // We'll handle the redirect ourselves
                window.location.href = '/login';
                return false;
              }
            });
          } else {
            // For manual logouts, use logoutPopup as before
            await msalInstance.logoutPopup({
              postLogoutRedirectUri: window.location.origin,
            });
            console.log('MSAL logout completed');
          }
        } catch (msalError) {
          console.error('MSAL logout error:', msalError);
          // Fall back to manual navigation
          window.location.href = '/login';
          return;
        }
      }
      
      // Navigate to login page after logout is complete
      window.location.href = '/login';
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

  // Add an effect to monitor authentication state changes
  // Register the logout function with the axios interceptor
  useEffect(() => {
    setAuthLogoutFunction(logout);
  }, [logout]);
  
  useEffect(() => {
    console.log('AuthProvider - Authentication state changed:', { isAuthenticated, userData });
    
    // Check if we're not on the home page and we're authenticated
    const isOnLoginPage = window.location.pathname === '/login';
    if (isAuthenticated && userData && isOnLoginPage) {
      console.log('Authenticated on login page, redirecting to home');
      
      // Check if we have a stored redirect URL from before login
      const redirectUrl = sessionStorage.getItem('loginRedirectUrl');
      if (redirectUrl && redirectUrl !== '/login') {
        console.log('Redirecting to stored URL:', redirectUrl);
        sessionStorage.removeItem('loginRedirectUrl');
        window.location.href = redirectUrl;
      } else {
        console.log('Redirecting to home page');
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, userData]);

  const contextValue: AuthContextType = {
    isAuthenticated,
    userData,
    login,
    logout,
    error,
    loading,
    getAccessToken,
  };

  console.log('AuthProvider rendering with context:', contextValue);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
