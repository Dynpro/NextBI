import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormHelperText, 
  Grid,
  Typography,
  Box
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TableChartIcon from '@mui/icons-material/TableChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import { databaseConnectionService, DatabaseConnection } from '../../services/databaseConnectionService';
import { v4 as uuidv4 } from 'uuid';

interface TileCreatorProps {
  open: boolean;
  dashboardId: string;
  onClose: () => void;
  onCreateTile: (tileData: CreateTileDto) => void;
}

export interface CreateTileDto {
  title: string;
  type: 'Text & Query' | 'Table' | 'Pie Chart';
  connectionId: string;
  dashboardId: string;
  content: {
    textRows: any[];
    tableConfig: {
      selectedTable: string;
      columns: any[];
    };
    pieChartConfig?: {
      dimensionQuery: string;
      measureQuery: string;
      dimensionLabel: string;
      measureLabel: string;
    };
  };
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

const TileCreator: React.FC<TileCreatorProps> = ({
  open,
  dashboardId,
  onClose,
  onCreateTile
}) => {
  // State for tile data
  const [title, setTitle] = useState('');
  const [tileType, setTileType] = useState<'Text & Query' | 'Table' | 'Pie Chart'>('Text & Query');
  const [connectionId, setConnectionId] = useState('');
  
  // State for database connections
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load database connections on component mount
  useEffect(() => {
    if (open) {
      loadConnections();
    }
  }, [open]);

  // Load available database connections
  const loadConnections = async () => {
    setLoading(true);
    setError('');
    
    try {
      const connectionsData = await databaseConnectionService.getAllConnections();
      setConnections(connectionsData);
      
      // Set default connection if available
      if (connectionsData.length > 0) {
        setConnectionId(connectionsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
      setError('Failed to load database connections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tile creation
  const handleCreateTile = async () => {
    if (!isValid()) return;
    
    setSaving(true);
    
    const newTile: CreateTileDto = {
      title,
      type: tileType,
      connectionId,
      dashboardId,
      content: {
        textRows: [],
        tableConfig: {
          selectedTable: '',
          columns: []
        },
        pieChartConfig: tileType === 'Pie Chart' ? {
          dimensionQuery: '',
          measureQuery: '',
          dimensionLabel: '',
          measureLabel: ''
        } : undefined
      },
      position: {
        x: 0, 
        y: 0, 
        w: 6, 
        h: tileType === 'Table' ? 8 : tileType === 'Pie Chart' ? 8 : 6 
      }
    };
    
    try {
      await onCreateTile(newTile);
      resetForm();
    } catch (error) {
      console.error('Error creating tile:', error);
      setError('Failed to create tile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Validate form before submission
  const isValid = (): boolean => {
    return Boolean(title && connectionId);
  };

  // Reset form on close
  const resetForm = () => {
    setTitle('');
    setTileType('Text & Query');
    setConnectionId(connections.length > 0 ? connections[0].id : '');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Tile</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              label="Tile Name"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              error={!title}
              helperText={!title ? 'Tile name is required' : ''}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Tile Type</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box
                  onClick={() => setTileType('Text & Query')}
                  sx={{
                    border: '1px solid',
                    borderColor: tileType === 'Text & Query' ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: tileType === 'Text & Query' ? 'action.selected' : 'background.paper'
                  }}
                >
                  <TextFieldsIcon sx={{ fontSize: 40, color: tileType === 'Text & Query' ? 'primary.main' : 'action.active' }} />
                  <Typography variant="body1" sx={{ mt: 1 }}>Text & Query</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box
                  onClick={() => setTileType('Table')}
                  sx={{
                    border: '1px solid',
                    borderColor: tileType === 'Table' ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: tileType === 'Table' ? 'action.selected' : 'background.paper'
                  }}
                >
                  <TableChartIcon sx={{ fontSize: 40, color: tileType === 'Table' ? 'primary.main' : 'action.active' }} />
                  <Typography variant="body1" sx={{ mt: 1 }}>Table</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box
                  onClick={() => setTileType('Pie Chart')}
                  sx={{
                    border: '2px solid',
                    borderColor: tileType === 'Pie Chart' ? 'primary.main' : 'error.main',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: tileType === 'Pie Chart' ? 'action.selected' : 'error.lightest',
                    minHeight: 100
                  }}
                >
                  <DonutLargeIcon sx={{ fontSize: 40, color: tileType === 'Pie Chart' ? 'primary.main' : 'error.main' }} />
                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>Pie Chart</Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth error={!connectionId} required>
              <InputLabel>Database Connection</InputLabel>
              <Select
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
                label="Database Connection"
                disabled={loading}
              >
                {connections.map((conn) => (
                  <MenuItem key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {!connectionId ? 'Database connection is required' : 'This connection will be permanent for this tile'}
              </FormHelperText>
            </FormControl>
          </Grid>
          
          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleCreateTile}
          variant="contained"
          color="primary"
          disabled={!isValid() || saving}
        >
          {saving ? 'Creating...' : 'Create Tile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TileCreator;
