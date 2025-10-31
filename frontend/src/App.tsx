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

const App = () => {
  const { isAuthenticated, loading, userData } = useAuth();
  
  console.log('App rendering - Auth state:', { isAuthenticated, loading, userData });

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
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
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
