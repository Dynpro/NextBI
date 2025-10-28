import axios from 'axios';

// Store auth context reference
let authLogout: ((isAutoLogout?: boolean) => void) | null = null;

/**
 * Sets up the reference to auth context logout function
 * This should be called from the AuthContext provider component
 */
export const setAuthLogoutFunction = (logoutFn: (isAutoLogout?: boolean) => void) => {
  authLogout = logoutFn;
};

/**
 * Sets up axios interceptors for handling authentication errors
 * This function should be called early in the app initialization
 */
export const setupAxiosInterceptors = () => {
  // Response interceptor to handle 401 Unauthorized errors
  axios.interceptors.response.use(
    (response) => {
      // Pass successful responses through
      return response;
    },
    (error) => {
      // Check if the error is a 401 Unauthorized
      if (error.response && error.response.status === 401) {
        console.log('Received 401 Unauthorized error. Logging out automatically...');
        
        // Check if we have a logout function reference
        if (authLogout) {
          // Trigger logout with auto logout flag
          authLogout(true);
        } else {
          console.error('Auth logout function not set, cannot perform automatic logout');
          // Fallback: Try to redirect to login
          window.location.href = '/login';
        }
      }
      
      // Pass the error through to the caller for any additional handling
      return Promise.reject(error);
    }
  );
};
