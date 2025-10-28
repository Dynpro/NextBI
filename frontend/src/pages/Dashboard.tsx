import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, IconButton, Menu, MenuItem, Dialog, TextField, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SaveIcon from '@mui/icons-material/Save';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAuth } from '../context/AuthContext';
import TileComponent from '../components/Dashboard/TileComponent';

interface TileData {
  id: string;
  type: 'chart' | 'text' | 'kpi';
  title: string;
  content: any; // This would be chart data, text content, etc.
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  styling: {
    backgroundColor: string;
    textColor: string;
    chartColors: string[];
  };
}

interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
}

const Dashboard = () => {
  const { projectId, folderId, dashboardId } = useParams<{ projectId: string; folderId: string; dashboardId: string }>();
  const { userData } = useAuth();
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [openTileDialog, setOpenTileDialog] = useState(false);
  const [newTileTitle, setNewTileTitle] = useState('');
  const [newTileType, setNewTileType] = useState<'chart' | 'text' | 'kpi'>('chart');
  const [newChartType, setNewChartType] = useState<'bar' | 'line' | 'pie' | 'donut'>('bar');
  const [dashboardTitle, setDashboardTitle] = useState('Loading...');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const isEditor = userData?.roles.includes('admin') || userData?.roles.includes('editor');

  useEffect(() => {
    // In a real app, fetch dashboard data from API
    const fetchDashboard = async () => {
      try {
        // Mock data
        setDashboardTitle(`Dashboard ${dashboardId}`);

        const mockTiles: TileData[] = [
          {
            id: '1',
            type: 'chart',
            title: 'Monthly Revenue',
            chartType: 'bar',
            content: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                {
                  label: 'Revenue',
                  data: [12, 19, 3, 5, 2, 3],
                }
              ]
            },
            position: { x: 0, y: 0, w: 6, h: 8 },
            styling: {
              backgroundColor: '#ffffff',
              textColor: '#333333',
              chartColors: ['#40c0a0', '#2060e0', '#e04060']
            }
          },
          {
            id: '2',
            type: 'chart',
            title: 'Customer Distribution',
            chartType: 'pie',
            content: {
              labels: ['New', 'Returning', 'Inactive'],
              datasets: [
                {
                  data: [30, 50, 20],
                }
              ]
            },
            position: { x: 6, y: 0, w: 6, h: 8 },
            styling: {
              backgroundColor: '#ffffff',
              textColor: '#333333',
              chartColors: ['#40c0a0', '#2060e0', '#e04060']
            }
          },
          {
            id: '3',
            type: 'text',
            title: 'Notes',
            content: 'This dashboard shows our monthly performance metrics across different departments.',
            position: { x: 0, y: 8, w: 12, h: 4 },
            styling: {
              backgroundColor: '#ffffff',
              textColor: '#333333',
              chartColors: []
            }
          }
        ];

        setTiles(mockTiles);
        
        // Convert tile positions to layout format for react-grid-layout
        const newLayouts = mockTiles.map(tile => ({
          i: tile.id,
          x: tile.position.x,
          y: tile.position.y,
          w: tile.position.w,
          h: tile.position.h,
          static: !isEditor
        }));
        
        setLayouts(newLayouts);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      }
    };

    fetchDashboard();
  }, [dashboardId, isEditor]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayouts(newLayout);
    
    // Update tile positions based on new layout
    const updatedTiles = tiles.map(tile => {
      const layoutItem = newLayout.find(item => item.i === tile.id);
      if (layoutItem) {
        return {
          ...tile,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return tile;
    });
    
    setTiles(updatedTiles);
  };

  const handleTileMenuOpen = (event: React.MouseEvent<HTMLElement>, tileId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTileId(tileId);
  };

  const handleTileMenuClose = () => {
    setAnchorEl(null);
    setSelectedTileId(null);
  };

  const handleDeleteTile = () => {
    if (selectedTileId) {
      setTiles(tiles.filter(tile => tile.id !== selectedTileId));
      setLayouts(layouts.filter(layout => layout.i !== selectedTileId));
      handleTileMenuClose();
    }
  };

  const handleEditTile = () => {
    // Implement tile editing functionality
    handleTileMenuClose();
  };

  const handleOpenAddTileDialog = () => {
    setOpenTileDialog(true);
  };

  const handleCloseAddTileDialog = () => {
    setOpenTileDialog(false);
    setNewTileTitle('');
    setNewTileType('chart');
    setNewChartType('bar');
  };

  const handleAddTile = () => {
    const newTileId = `tile-${Date.now()}`;
    
    // Find a position for the new tile
    // For simplicity, place it at the bottom of the dashboard
    let maxY = 0;
    layouts.forEach(layout => {
      const bottomY = layout.y + layout.h;
      if (bottomY > maxY) maxY = bottomY;
    });
    
    const newTile: TileData = {
      id: newTileId,
      type: newTileType,
      title: newTileTitle,
      chartType: newTileType === 'chart' ? newChartType : undefined,
      content: newTileType === 'chart' ? {
        labels: ['Data 1', 'Data 2', 'Data 3'],
        datasets: [{ 
          label: 'Sample Data',
          data: [33, 25, 42] 
        }]
      } : 'New text content',
      position: { x: 0, y: maxY, w: 6, h: 6 },
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        chartColors: ['#40c0a0', '#2060e0', '#e04060']
      }
    };
    
    setTiles([...tiles, newTile]);
    
    const newLayout: Layout = {
      i: newTileId,
      x: 0,
      y: maxY,
      w: 6,
      h: 6
    };
    
    setLayouts([...layouts, newLayout]);
    handleCloseAddTileDialog();
  };

  const handleSaveDashboard = async () => {
    // In a real app, save the dashboard to the API
    console.log('Saving dashboard:', { tiles, layouts });
    // Show success notification
  };

  const handleDashboardTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleDashboardTitleSave = () => {
    setIsEditingTitle(false);
    // In a real app, save the title to the API
  };
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Dashboard Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isEditingTitle ? (
            <TextField
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
              onBlur={handleDashboardTitleSave}
              onKeyPress={(e) => e.key === 'Enter' && handleDashboardTitleSave()}
              autoFocus
              size="small"
              sx={{ mr: 2 }}
            />
          ) : (
            <Typography 
              variant="h5" 
              component="h1" 
              onClick={isEditor ? handleDashboardTitleEdit : undefined}
              sx={{ cursor: isEditor ? 'pointer' : 'default' }}
            >
              {dashboardTitle}
            </Typography>
          )}
        </Box>
        
        <Box>
          {isEditor && (
            <>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={handleOpenAddTileDialog}
                sx={{ mr: 1 }}
              >
                Add Tile
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />} 
                onClick={handleSaveDashboard}
              >
                Save
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Dashboard Grid */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 200px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          position: 'relative'
        }}
      >
        <GridLayout 
          className="layout"
          layout={layouts}
          cols={12}
          rowHeight={30}
          width={1200}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditor}
          isResizable={isEditor}
          draggableHandle=".tile-drag-handle"
        >
          {tiles.map((tile) => (
            <div key={tile.id}>
              <TileComponent 
                tile={tile} 
                isEditor={isEditor}
                onMenuOpen={(e) => handleTileMenuOpen(e, tile.id)}
              />
            </div>
          ))}
        </GridLayout>
        
        {tiles.length === 0 && (
          <Box sx={{
            height: '100%',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            padding: 4
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Tiles Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add tiles to build your dashboard.
            </Typography>
            {isEditor && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenAddTileDialog}
              >
                Add First Tile
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Tile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleTileMenuClose}
      >
        <MenuItem onClick={handleEditTile}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteTile} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>

      {/* Add Tile Dialog */}
      <Dialog open={openTileDialog} onClose={handleCloseAddTileDialog} fullWidth>
        <DialogTitle>Add New Tile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newTileTitle}
            onChange={(e) => setNewTileTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Tile Type"
            fullWidth
            value={newTileType}
            onChange={(e) => setNewTileType(e.target.value as 'chart' | 'text' | 'kpi')}
            sx={{ mb: 2 }}
          >
            <MenuItem value="chart">Chart</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="kpi">KPI</MenuItem>
          </TextField>
          
          {newTileType === 'chart' && (
            <TextField
              select
              margin="dense"
              label="Chart Type"
              fullWidth
              value={newChartType}
              onChange={(e) => setNewChartType(e.target.value as 'bar' | 'line' | 'pie' | 'donut')}
            >
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
              <MenuItem value="donut">Donut Chart</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddTileDialog}>Cancel</Button>
          <Button 
            onClick={handleAddTile} 
            variant="contained" 
            color="primary"
            disabled={!newTileTitle.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
