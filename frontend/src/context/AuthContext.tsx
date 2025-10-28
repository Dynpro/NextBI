import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  PublicClientApplication,
  AccountInfo,
  InteractionRequiredAuthError,
  EventType,
} from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../config/auth.config";
import { loginWithAzure, getStoredSession } from "../services/loginService";
import { getUser, clearAuthData, devLogin, getToken } from "../services/authService";
import {
  setAuthLogoutFunction,
  setupAxiosInterceptors,
} from "../utils/axiosInterceptors";

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

// Determine whether dev auth should be used at runtime.
const isDevAuthEnabled = (): boolean => {
  try {
    const envFlag = getClientEnv("REACT_APP_DEV_AUTH", "false");
    if (envFlag === "true") return true;
  } catch (e) {
    // ignore
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
  }
  return false;
};

export interface AuthContextType {
  isAuthenticated: boolean;
  userData: any | null;
  login: () => Promise<void>;
  logout: () => void;
  error: string | null;
  loading: boolean;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userData: null,
  login: async () => {},
  logout: () => {},
  error: null,
  loading: true,
  getAccessToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [msalInitialized, setMsalInitialized] = useState(false);

  // Setup Axios interceptors
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);
 /** Exchange Azure token for backend JWT **/
  const exchangeTokenForJWT = useCallback(async (account: AccountInfo) => {
    try {
      const result = await loginWithAzure(account);
      if (result?.success) {
        setUserData(result.user);
        setIsAuthenticated(true);
        localStorage.setItem("nextbi_auth_method", "msal");
        setError(null);
        window.location.href = "/";
      } else {
        setError("Failed to authenticate with backend.");
      }
    } catch (err) {
      console.error("JWT exchange error:", err);
      setError("Failed to authenticate with backend.");
    }
  }, []);
  /** Initialize MSAL safely once **/
  const initializeMsal = useCallback(async () => {
    try {
      // If dev mode, skip MSAL and try to restore or create dev session
      if (isDevAuthEnabled()) {
        console.log('DEV_AUTH enabled - using development login flow');
        const storedSession = getStoredSession();
        const storedUser = getUser();

        if (storedSession && storedUser) {
          setUserData(storedUser);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // Automatically perform dev login using env vars or defaults
        const devEmail = getClientEnv('REACT_APP_DEV_TEST_EMAIL', 'dev@local.test')!;
        const devDisplay = getClientEnv('REACT_APP_DEV_DISPLAYNAME', 'Developer')!;

        const devResult = await devLogin({ email: devEmail, displayName: devDisplay });
        if (devResult.success) {
          setUserData(devResult.user);
          setIsAuthenticated(true);
          localStorage.setItem('nextbi_auth_method', 'dev');
          setLoading(false);
          return;
        } else {
          console.error('Dev login failed:', devResult.error);
          setError('Development login failed');
          setLoading(false);
          return;
        }
      }

      if (msalInitialized || msalInstance) return;

      const msalApp = new PublicClientApplication(msalConfig);
      await msalApp.initialize();
      setMsalInstance(msalApp);
      setMsalInitialized(true);

      // Add MSAL event listener
      msalApp.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          const payload = event.payload as { account: AccountInfo };
          if (payload.account) exchangeTokenForJWT(payload.account);
        }
      });

      // Handle redirect result
      const redirectResponse = await msalApp.handleRedirectPromise();
      if (redirectResponse?.account) {
        await exchangeTokenForJWT(redirectResponse.account);
        return;
      }

      // Restore session if available
      const storedSession = getStoredSession();
      const storedUser = getUser();

      if (storedSession && storedUser) {
        setUserData(storedUser);
        setIsAuthenticated(true);
      } else {
        const accounts = msalApp.getAllAccounts();
        if (accounts.length > 0) {
          await exchangeTokenForJWT(accounts[0]);
        }
      }
    } catch (err) {
      console.error("MSAL initialization failed:", err);
      setError("Failed to initialize authentication.");
    } finally {
      setLoading(false);
    }
  }, [exchangeTokenForJWT, msalInitialized, msalInstance]);

  useEffect(() => {
    initializeMsal();
  }, [initializeMsal]);

  // React to external auth changes (e.g. devLogin dispatch)
  useEffect(() => {
    const handler = (ev?: Event) => {
      try {
        const storedUser = getUser();
        if (storedUser) {
          setUserData(storedUser);
          setIsAuthenticated(true);
          setError(null);
          console.log('AuthContext: detected external login, restored user from storage');
        } else {
          setUserData(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error('Error handling external auth change:', e);
      }
    };

    window.addEventListener('nextbi:auth-changed', handler as EventListener);
    return () => {
      window.removeEventListener('nextbi:auth-changed', handler as EventListener);
    };
  }, []);

  /** Get Access Token **/
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // If dev mode, return the backend token from localStorage
    if (isDevAuthEnabled()) {
      return getToken();
    }
    if (!msalInstance) return null;
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return tokenResponse.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
        return tokenResponse.accessToken;
      }
      console.error("Access token error:", error);
      return null;
    }
  }, [msalInstance]);

  // Map common MSAL/Azure errors to friendly messages
  const getFriendlyAuthError = (err: any): string | null => {
	// err may be an Error or MSAL error object
	const msg = (err && (err.message || err.error || String(err))) || '';
	// Tenant mismatch example
	if (msg.includes('AADSTS50020')) {
		return `Account not found in tenant. Sign in with an account in the tenant or ask the tenant admin to invite your account as a guest. For local testing enable DEV_AUTH or use an account from the tenant.`;
	}
	// User cancelled popup
	if (msg.includes('user_cancelled') || msg.includes('Popup window closed')) {
		return 'Sign-in was cancelled or blocked by the browser. Try using the "Sign in" button again (redirect) or enable Dev sign-in for local testing.';
	}
	// Generic fallback
	if (msg) return msg;
	return null;
};

  /** Login **/
  const login = async () => {
    try {
      // If dev mode, run devLogin instead of MSAL flows
      if (isDevAuthEnabled()) {
        setLoading(true);
        setError(null);

        const devEmail = getClientEnv('REACT_APP_DEV_TEST_EMAIL', 'dev@local.test')!;
        const devDisplay = getClientEnv('REACT_APP_DEV_DISPLAYNAME', 'Developer')!;
        const result = await devLogin({ email: devEmail, displayName: devDisplay });

        if (result.success) {
          setUserData(result.user);
          setIsAuthenticated(true);
          localStorage.setItem('nextbi_auth_method', 'dev');
          setError(null);
          // navigate to main app
          window.location.href = '/';
        } else {
          setError('Development login failed');
        }

        setLoading(false);
        return;
      }

      if (!msalInstance) {
        setError("Authentication not initialized yet. Please wait a moment.");
        return;
      }

      // Ensure MSAL is ready
      if (!msalInitialized) {
        console.warn("MSAL not ready — waiting...");
        for (let i = 0; i < 10; i++) {
          await new Promise((res) => setTimeout(res, 300));
          if (msalInitialized) break;
        }
        if (!msalInitialized) {
          setError("Authentication not initialized");
          return;
        }
      }

      setError(null);
      setLoading(true);

      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        await exchangeTokenForJWT(accounts[0]);
        return;
      }

      // Use redirect-based login to avoid popup blockers and OP/GPO issues.
      try {
        await msalInstance.loginRedirect({
          ...loginRequest,
          prompt: "select_account",
        });
        // On redirect the app will re-initialize and handleRedirectPromise will process the response.
      } catch (innerErr) {
        // Fallback: try popup if redirect fails (rare)
        console.warn('Redirect login failed, attempting popup fallback', innerErr);
        try {
          const result = await msalInstance.loginPopup({
            ...loginRequest,
            prompt: "select_account",
          });
          if (result.account) await exchangeTokenForJWT(result.account);
          else setError("No account information returned.");
        } catch (popupErr) {
          console.error("Popup login error:", popupErr);
          const friendly = getFriendlyAuthError(popupErr);
          setError(friendly || (popupErr?.message || "Login failed."));
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const friendly = getFriendlyAuthError(err);
      setError(friendly || (err?.message || "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  /** Logout **/
  const logout = async () => {
    try {
      const method = localStorage.getItem("nextbi_auth_method");
      clearAuthData();
      setIsAuthenticated(false);
      setUserData(null);

      if (method === "msal" && msalInstance) {
        await msalInstance.logoutPopup({
          postLogoutRedirectUri: window.location.origin,
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  /** Register logout for axios interceptor **/
  useEffect(() => {
    setAuthLogoutFunction(logout);
  }, [logout]);

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
