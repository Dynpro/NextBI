import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  CardActionArea,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService, Project as ServiceProject, CreateProjectDto } from '../services/projectService';

// Extended interface for UI display with user role
interface Project extends ServiceProject {
  userRole: 'admin' | 'editor' | 'viewer';
}

const Projects = () => {
  const navigate = useNavigate();
  const { userData } = useAuth(); // Only keep userData since login is not used
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Get projects from the API using projectService
        const serviceProjects = await projectService.getAllProjects();
        
        // Map service projects to UI projects with userRole
        const uiProjects: Project[] = serviceProjects.map((project: ServiceProject) => ({
          ...project,
          userRole: 'editor' // Default role, in a real app this would come from the backend
        }));
        
        setProjects(uiProjects);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        
        // Check if the error is due to missing authentication token
        if ((error as Error).message.includes('No backend token available')) {
          console.log('Authentication token missing, redirecting to login');
          setNotification({
            message: 'Your session has expired. Please login again.',
            type: 'error'
          });
          
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setNotification({
            message: `Error loading projects: ${(error as Error).message}`,
            type: 'error'
          });
        }
        setLoading(false);
      }
    };

    fetchProjects();
  }, [navigate]);

  const handleCreateProject = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setProjectName('');
    setProjectDescription('');
  };

  const handleSaveProject = async () => {
    try {
      const projectData: CreateProjectDto = {
        name: projectName,
        description: projectDescription
      };
      
      // Create project using the service
      const newProject = await projectService.createProject(projectData);
      
      // Add to UI with userRole
      const uiProject: Project = {
        ...newProject,
        userRole: 'editor' // Default role for new projects
      };
      
      setProjects([...projects, uiProject]);
      handleCloseDialog();
      
      setNotification({
        message: 'Project created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      setNotification({
        message: `Failed to create project: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleDeleteProject = async () => {
    if (selectedProject) {
      try {
        // Delete project using the service
        await projectService.deleteProject(selectedProject.id);
        
        // Remove from UI
        setProjects(projects.filter(p => p.id !== selectedProject.id));
        handleMenuClose();
        
        setNotification({
          message: 'Project deleted successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting project:', error);
        setNotification({
          message: `Failed to delete project: ${(error as Error).message}`,
          type: 'error'
        });
      }
    }
  };

  const handleShareProject = () => {
    // This would open a sharing dialog in a real app
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Notification Snackbar */}
      <Snackbar 
        open={notification !== null} 
        autoHideDuration={6000} 
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.type || 'info'} 
          sx={{ width: '100%' }}
        >
          {notification?.message || ''}
        </Alert>
      </Snackbar>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
          disabled={false} // Remove the roles check since userData doesn't have a roles property
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            p: 4, 
            border: '2px dashed', 
            borderColor: 'divider',
            borderRadius: 2,
            mt: 4
          }}
        >
          <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Projects Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first project to get started with dashboards and visualizations.
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={handleCreateProject}
            disabled={false} // Remove the roles check since userData doesn't have a roles property
          >
            Create Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
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
                <CardActionArea onClick={() => handleOpenProject(project.id)}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2" noWrap>
                        {project.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }} paragraph>
                      {project.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                      <Typography variant="caption" color="text.secondary">
                        Role: Editor {/* Hardcoded role since project.userRole might not exist */}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, project)}
                    disabled={false} // Remove the userRole check to prevent errors
                  >
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => selectedProject && handleOpenProject(selectedProject.id)}>
          Open
        </MenuItem>
        <MenuItem onClick={handleShareProject}>Share</MenuItem>
        <MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveProject} 
            variant="contained" 
            color="primary"
            disabled={!projectName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;
