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
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  projectService, 
  Dashboard as ServiceDashboard, 
  CreateDashboardDto 
} from '../services/projectService';

// Extended interface for UI display with additional properties
interface Dashboard extends ServiceDashboard {
  tileCount?: number;
}

const Dashboards: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, folderId } = useParams<{ projectId: string; folderId: string }>();
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [folder, setFolder] = useState<{ id: string; name: string } | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dashboardName, setDashboardName] = useState<string>('');
  const [dashboardDescription, setDashboardDescription] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (!projectId || !folderId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Get project details
        const projectData = await projectService.getProjectById(projectId);
        setProject(projectData);
        
        // Get folder details
        const folderData = await projectService.getFolderById(folderId, projectId);
        setFolder(folderData);
        
        // Get dashboards for this folder
        const dashboardData = await projectService.getDashboardsByFolderId(folderId, projectId);
        
        // For each dashboard, get tile count
        const dashboardsWithCounts = await Promise.all(dashboardData.map(async (dashboard) => {
          try {
            const tiles = await projectService.getTilesByDashboardId(dashboard.id, projectId, folderId);
            return { ...dashboard, tileCount: tiles.length };
          } catch (error) {
            console.error(`Error fetching tiles for dashboard ${dashboard.id}:`, error);
            return { ...dashboard, tileCount: 0 };
          }
        }));
        
        setDashboards(dashboardsWithCounts);
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
  }, [projectId, folderId]);

  const handleCreateDashboard = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDashboardName('');
    setDashboardDescription('');
  };

  const handleSaveDashboard = async () => {
    if (!folderId || !projectId) return;
    
    try {
      const dashboardData: CreateDashboardDto = {
        name: dashboardName,
        description: dashboardDescription,
        folderId,
        projectId
      };
      
      // Create dashboard using the service
      const newDashboard = await projectService.createDashboard(dashboardData);
      
      // Add to UI with tile count
      const uiDashboard: Dashboard = {
        ...newDashboard,
        tileCount: 0
      };
      
      setDashboards([...dashboards, uiDashboard]);
      handleCloseDialog();
      
      setNotification({
        message: 'Dashboard created successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating dashboard:', error);
      setNotification({
        message: `Failed to create dashboard: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dashboard: Dashboard) => {
    setAnchorEl(event.currentTarget);
    setSelectedDashboard(dashboard);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDashboard(null);
  };

  const handleOpenDashboard = (dashboardId: string) => {
    navigate(`/projects/${projectId}/folders/${folderId}/dashboards/${dashboardId}`);
  };

  const handleDeleteDashboard = async () => {
    if (selectedDashboard && projectId && folderId) {
      try {
        // Delete dashboard using the service
        await projectService.deleteDashboard(selectedDashboard.id, projectId, folderId);
        
        // Remove from UI
        setDashboards(dashboards.filter(d => d.id !== selectedDashboard.id));
        handleMenuClose();
        
        setNotification({
          message: 'Dashboard deleted successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting dashboard:', error);
        setNotification({
          message: `Failed to delete dashboard: ${(error as Error).message}`,
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
        <Link 
          color="inherit" 
          href={`/projects/${projectId}`} 
          onClick={(e) => { e.preventDefault(); navigate(`/projects/${projectId}`); }}
        >
          {project?.name || 'Project'}
        </Link>
        <Typography color="text.primary">{folder?.name || 'Folder'}</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Dashboards
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateDashboard}
        >
          Create Dashboard
        </Button>
      </Box>

      {dashboards.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <DashboardIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No dashboards yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a dashboard to visualize your data
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateDashboard}
          >
            Create Dashboard
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {dashboards.map((dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
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
                <CardActionArea onClick={() => handleOpenDashboard(dashboard.id)}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2" noWrap>
                        {dashboard.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }} paragraph>
                      {dashboard.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                      <Typography variant="caption" color="text.secondary">
                        <ViewQuiltIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                        {dashboard.tileCount} {dashboard.tileCount === 1 ? 'tile' : 'tiles'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dashboard.updatedAt ? new Date(dashboard.updatedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, dashboard)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dashboard Menu */}
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
        <MenuItem onClick={() => selectedDashboard && handleOpenDashboard(selectedDashboard.id)}>
          Open
        </MenuItem>
        <MenuItem onClick={handleDeleteDashboard} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Create Dashboard Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Create New Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dashboard Name"
            fullWidth
            variant="outlined"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={dashboardDescription}
            onChange={(e) => setDashboardDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveDashboard} 
            variant="contained" 
            color="primary"
            disabled={!dashboardName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboards;
