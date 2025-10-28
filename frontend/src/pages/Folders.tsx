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
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate, useParams } from 'react-router-dom';
// Auth context not needed here
import { projectService, Folder as ServiceFolder, CreateFolderDto } from '../services/projectService';

// Extended interface for UI display with additional properties
interface Folder extends ServiceFolder {
  itemCount?: number;
}

const Folders: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [folderDescription, setFolderDescription] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Get project details
        const projectData = await projectService.getProjectById(projectId);
        setProject(projectData);
        
        // Get folders for this project
        const folderData = await projectService.getFoldersByProjectId(projectId);
        
        // For each folder, get dashboard count (in a real app, this might be included in the API response)
        const foldersWithCounts = await Promise.all(folderData.map(async (folder) => {
          try {
            const dashboards = await projectService.getDashboardsByFolderId(folder.id, projectId);
            return { ...folder, itemCount: dashboards.length };
          } catch (error) {
            console.error(`Error fetching dashboards for folder ${folder.id}:`, error);
            return { ...folder, itemCount: 0 };
          }
        }));
        
        setFolders(foldersWithCounts);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setNotification({
          message: `Error loading data: ${(error as Error).message}`,
          type: 'error'
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleCreateFolder = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFolderName('');
    setFolderDescription('');
  };

  const handleSaveFolder = async () => {
    if (!projectId) return;
    
    try {
      const folderData: CreateFolderDto = {
        name: folderName,
        description: folderDescription,
        projectId
      };
      
      // Create folder using the service
      const newFolder = await projectService.createFolder(folderData);
      
      // Add to UI with item count
      const uiFolder: Folder = {
        ...newFolder,
        itemCount: 0
      };
      
      setFolders([...folders, uiFolder]);
      handleCloseDialog();
      
      setNotification({
        message: 'Folder created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      setNotification({
        message: `Failed to create folder: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, folder: Folder) => {
    setAnchorEl(event.currentTarget);
    setSelectedFolder(folder);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFolder(null);
  };

  const handleOpenFolder = (folderId: string) => {
    navigate(`/projects/${projectId}/folders/${folderId}`);
  };

  const handleDeleteFolder = async () => {
    if (selectedFolder) {
      try {
        if (!projectId) {
          throw new Error('Project ID is required');
        }
        
        // Delete folder using the service
        // Need projectId for nested route
        await projectService.deleteFolder(selectedFolder.id, projectId);
        
        // Remove from UI
        setFolders(folders.filter(f => f.id !== selectedFolder.id));
        handleMenuClose();
        
        setNotification({
          message: 'Folder deleted successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting folder:', error);
        setNotification({
          message: `Failed to delete folder: ${(error as Error).message}`,
          type: 'error'
        });
      }
    }
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
      
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link color="inherit" href="/projects" onClick={(e) => { e.preventDefault(); navigate('/projects'); }}>
          Projects
        </Link>
        <Typography color="text.primary">{project?.name || 'Project'}</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Folders
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateFolder}
        >
          Create Folder
        </Button>
      </Box>

      {folders.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No folders yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a folder to organize your dashboards
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateFolder}
          >
            Create Folder
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {folders.map((folder) => (
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
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2" noWrap>
                        {folder.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }} paragraph>
                      {folder.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                      <Typography variant="caption" color="text.secondary">
                        <DashboardIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                        {folder.itemCount} {folder.itemCount === 1 ? 'dashboard' : 'dashboards'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {folder.updatedAt ? new Date(folder.updatedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, folder)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Folder Menu */}
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
        <MenuItem onClick={() => selectedFolder && handleOpenFolder(selectedFolder.id)}>
          Open
        </MenuItem>
        <MenuItem onClick={handleDeleteFolder} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={folderDescription}
            onChange={(e) => setFolderDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveFolder} 
            variant="contained" 
            color="primary"
            disabled={!folderName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Folders;
