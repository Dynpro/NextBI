import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DashboardIcon from '@mui/icons-material/Dashboard';

const FolderView: React.FC = () => {
  const { projectId, folderId } = useParams<{ projectId: string, folderId: string }>();

  // This would normally be fetched from an API
  const mockDashboards = [
    { id: '1', name: 'Sales Overview' },
    { id: '2', name: 'Customer Analytics' },
    { id: '3', name: 'Performance Metrics' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Folder View
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Project ID: {projectId} | Folder ID: {folderId}
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          Dashboards in this folder:
        </Typography>
        <List>
          {mockDashboards.map(dashboard => (
            <ListItem 
              button 
              key={dashboard.id}
              component="a"
              href={`/projects/${projectId}/folders/${folderId}/dashboards/${dashboard.id}`}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary={dashboard.name} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default FolderView;
