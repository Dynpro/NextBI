import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box,
  ListItemButton,
  Collapse,
  Tooltip
} from '@mui/material';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
}

const Sidebar = ({ open }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(true);

  const handleToggleProjects = () => {
    setProjectsOpen(!projectsOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={handleToggleProjects}
              selected={location.pathname.startsWith('/projects')}
            >
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="Projects" />
              {projectsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={projectsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {/* This will be dynamically populated with projects */}
              <ListItem disablePadding>
                <Tooltip title="View All Projects" placement="right">
                  <ListItemButton 
                    sx={{ pl: 4 }}
                    onClick={() => handleNavigation('/projects')}
                    selected={isActive('/projects')}
                  >
                    <ListItemIcon>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="All Projects" />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </List>
          </Collapse>
        </List>

        <Divider sx={{ my: 2 }} />

        <List>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation('/connections')}
              selected={isActive('/connections')}
            >
              <ListItemIcon>
                <StorageIcon />
              </ListItemIcon>
              <ListItemText primary="Database Connections" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation('/data-models')}
              selected={isActive('/data-models')}
            >
              <ListItemIcon>
                <TableChartIcon />
              </ListItemIcon>
              <ListItemText primary="Data Models" />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Settings section removed as requested */}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
