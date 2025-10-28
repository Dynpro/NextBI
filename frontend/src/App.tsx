import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Folders from './pages/Folders';
import Dashboards from './pages/Dashboards';
import Tiles from './pages/Tiles';
import DatabaseConnections from './pages/DatabaseConnections';
import DataModels from './pages/DataModels';
import NotFound from './pages/NotFound';
import { getToken, devLogin } from './services/authService'; // use devLogin to request a real backend JWT
import React from 'react';

// Safe environment accessor (browser-safe)
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

// DEV override flag
const DEV_AUTH = getClientEnv('REACT_APP_DEV_AUTH', 'false') === 'true';

const App = () => {
  const { isAuthenticated, loading, userData } = useAuth();
  
  console.log('App rendering - Auth state:', { isAuthenticated, loading, userData });

  // On mount, seed a dev session if DEV_AUTH enabled and no token exists.
  // This creates a simple test user for local development so protected routes can be opened immediately.
  // NOTE: for safety do not enable this in production.
  React.useEffect(() => {
    if (!DEV_AUTH) return;
    (async () => {
      try {
        const existing = getToken();
        if (!existing) {
          const devEmail = getClientEnv('REACT_APP_DEV_TEST_EMAIL', 'dev@local.test')!;
          const devDisplay = getClientEnv('REACT_APP_DEV_DISPLAYNAME', 'Developer')!;
          console.debug('DEV_AUTH: requesting dev login from backend', devEmail);
          const res = await devLogin({ email: devEmail, displayName: devDisplay });
          if (res.success) {
            // devLogin stores token/user and dispatches nextbi:auth-changed
            console.debug('DEV_AUTH: dev login successful, backend token stored');
          } else {
            console.error('DEV_AUTH: dev login failed', res.error);
          }
        }
      } catch (e) {
        console.error('DEV_AUTH seed error:', e);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        {/* If DEV_AUTH is enabled, bypass login checks for easier local testing */}
        <Route path="/login" element={!isAuthenticated && !DEV_AUTH ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes: allow when authenticated OR when DEV_AUTH is enabled */}
        <Route path="/" element={isAuthenticated || DEV_AUTH ? <Layout /> : <Navigate to="/login" />}>
           <Route index element={<Projects />} />
           <Route path="projects">
             <Route index element={<Projects />} />
             <Route path=":projectId" element={<Folders />} />
             <Route path=":projectId/folders/:folderId" element={<Dashboards />} />
             <Route path=":projectId/folders/:folderId/dashboards/:dashboardId" element={<Tiles />} />
           </Route>
           <Route path="connections" element={<DatabaseConnections />} />
           <Route path="data-models" element={<DataModels />} />
         </Route>
         
         {/* 404 Page */}
         <Route path="*" element={<NotFound />} />
       </Routes>
    </Router>
  );
};

export default App;
