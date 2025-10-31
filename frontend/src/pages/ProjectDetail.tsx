import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  Divider, 
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActionArea
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { hasProjectPermission } from '../services/userService';
import ProjectRoleManager from '../components/ProjectRoleManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Folder {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userRole?: 'admin' | 'editor' | 'viewer';
}

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [project, setProject] = useState<Project | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectData = async () => {
      try {
        setLoading(true);
        // Get project details
        const projectData = await projectService.getProjectById(projectId);
        setProject(projectData);
        
        // Get folders for this project
        const folderData = await projectService.getFoldersByProjectId(projectId);
        setFolders(folderData);
        
        // Check user permissions
        const hasEditPermission = await hasProjectPermission(projectId, 'edit');
        const hasAdminPermission = await hasProjectPermission(projectId, 'admin');
        
        setCanEdit(hasEditPermission);
        setCanManageUsers(hasAdminPermission);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch project data:', error);
        setNotification({
          message: `Error loading project: ${(error as Error).message}`,
          type: 'error'
        });
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateFolder = async () => {
    if (!projectId || !canEdit) return;
    
    try {
      const folderName = `New Folder ${folders.length + 1}`;
      const newFolder = await projectService.createFolder({
        name: folderName,
        projectId
      });
      
      setFolders([...folders, newFolder]);
      setNotification({
        message: 'Folder created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
      setNotification({
        message: `Error creating folder: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  const handleOpenFolder = (folderId: string) => {
    navigate(`/projects/${projectId}/folders/${folderId}`);
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Project not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">{project.name}</Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {project.description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
            <Tab label="Folders" id="project-tab-0" aria-controls="project-tabpanel-0" />
            {canManageUsers && <Tab label="User Management" id="project-tab-1" aria-controls="project-tabpanel-1" />}
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Project Folders</Typography>
            {canEdit && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleCreateFolder}
              >
                Create Folder
              </Button>
            )}
          </Box>
          
          <Grid container spacing={3}>
            {folders.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary">
                  No folders found. {canEdit ? 'Create a folder to get started.' : ''}
                </Typography>
              </Grid>
            ) : (
              folders.map((folder) => (
                <Grid item xs={12} sm={6} md={4} key={folder.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleOpenFolder(folder.id)}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <FolderIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6" component="h2" noWrap>
                            {folder.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Updated: {new Date(folder.updatedAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </TabPanel>
        
        {canManageUsers && (
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" sx={{ mb: 2 }}>User Management</Typography>
            <ProjectRoleManager 
              projectId={projectId || ''} 
              onUserAdded={() => {
                setNotification({
                  message: 'User added to project successfully',
                  type: 'success'
                });
              }}
              onUserRemoved={() => {
                setNotification({
                  message: 'User removed from project',
                  type: 'success'
                });
              }}
              onError={(error) => {
                setNotification({
                  message: `Error: ${error}`,
                  type: 'error'
                });
              }}
            />
          </TabPanel>
        )}
      </Paper>
      
      {/* Notification */}
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert onClose={handleNotificationClose} severity={notification.type} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default ProjectDetail;
