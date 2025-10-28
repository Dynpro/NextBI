import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAuth } from '../context/AuthContext';
import { databaseConnectionService, DatabaseConnection, CreateConnectionDto } from '../services/databaseConnectionService';


const DatabaseConnections = () => {
  const { userData } = useAuth();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  
  // Form state
  const [connectionName, setConnectionName] = useState('');
  const [connectionType, setConnectionType] = useState('postgresql');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const isEditor = true; // Default to true since userData doesn't have roles property

  // Add state for notifications
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    // Fetch connections from API
    const fetchConnections = async () => {
      try {
        setLoading(true);
        const data = await databaseConnectionService.getAllConnections();
        setConnections(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching connections:', error);
        setLoading(false);
        setNotification({
          message: 'Failed to load database connections',
          type: 'error'
        });
      }
    };
    
    fetchConnections();
  }, []);

  const handleOpenDialog = (connection?: DatabaseConnection) => {
    if (connection) {
      // Edit mode
      setEditingConnection(connection);
      setConnectionName(connection.name);
      setConnectionType(connection.type);
      setHost(connection.host);
      setPort(connection.port.toString());
      setDatabase(connection.database);
      setUsername(connection.username);
      setPassword(''); // Don't populate password for security
    } else {
      // Create mode
      resetForm();
      setEditingConnection(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setConnectionName('');
    setConnectionType('postgresql');
    setHost('');
    setPort('5432');
    setDatabase('');
    setUsername('');
    setPassword('');
    setEditingConnection(null);
  };

  const handleSaveConnection = async () => {
    try {
      // Validate form
      if (!connectionName || !host || !port || !database || !username || !password) {
        setNotification({
          message: 'Please fill in all required fields',
          type: 'error'
        });
        return;
      }

      setLoading(true);
      
      const connectionData: CreateConnectionDto = {
        name: connectionName,
        type: connectionType,
        host,
        port: parseInt(port, 10),
        database,
        username,
        password
      };

      let savedConnection: DatabaseConnection;

      if (editingConnection) {
        // Update existing connection
        savedConnection = await databaseConnectionService.updateConnection(
          editingConnection.id, 
          connectionData
        );
        
        // Update the connection in the local state
        setConnections(connections.map(conn => 
          conn.id === editingConnection.id ? savedConnection : conn
        ));
        
        setNotification({
          message: 'Connection updated successfully',
          type: 'success'
        });
      } else {
        // Create new connection
        savedConnection = await databaseConnectionService.createConnection(connectionData);
        
        // Add the new connection to the local state
        setConnections([...connections, savedConnection]);
        
        setNotification({
          message: 'Connection created successfully',
          type: 'success'
        });
      }

      handleCloseDialog();
      setLoading(false);
    } catch (error) {
      console.error('Error saving connection:', error);
      setLoading(false);
      setNotification({
        message: `Failed to ${editingConnection ? 'update' : 'create'} connection: ${(error as Error).message}`,
        type: 'error'
      });
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      setLoading(true);
      // Delete via API
      await databaseConnectionService.deleteConnection(id);
      
      // Remove from local state
      setConnections(connections.filter(conn => conn.id !== id));
      
      setNotification({
        message: 'Connection deleted successfully',
        type: 'success'
      });
      setLoading(false);
    } catch (error) {
      console.error('Error deleting connection:', error);
      setNotification({
        message: `Failed to delete connection: ${(error as Error).message}`,
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      setTestingId(id);
      
      // Test connection via API
      const result = await databaseConnectionService.testConnection(id);
      
      // Update connection status based on test result
      setConnections(connections.map(conn => 
        conn.id === id ? { ...conn, status: result.status, lastTestedAt: result.lastTestedAt } : conn
      ));
      
      setNotification({
        message: 'Connection tested successfully',
        type: 'success'
      });
      setTestingId(null);
    } catch (error) {
      console.error('Error testing connection:', error);
      setNotification({
        message: `Connection test failed: ${(error as Error).message}`,
        type: 'error'
      });
      setTestingId(null);
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(null);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Database Connections
        </Typography>
        {isEditor && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Connection
          </Button>
        )}
      </Box>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification?.type || 'info'} 
          sx={{ width: '100%' }}
        >
          {notification?.message || ''}
        </Alert>
      </Snackbar>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 240px)' }}>
          <Table stickyHeader aria-label="database connections table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Database</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No database connections found.
                    </Typography>
                    {isEditor && (
                      <Button
                        variant="text"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{ mt: 1 }}
                      >
                        Create your first connection
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                connections.map((connection) => (
                  <TableRow key={connection.id} hover>
                    <TableCell>{connection.name}</TableCell>
                    <TableCell>{connection.type}</TableCell>
                    <TableCell>{`${connection.host}:${connection.port}`}</TableCell>
                    <TableCell>{connection.database}</TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.8125rem',
                          backgroundColor: connection.status === 'active' ? 'success.lighter' : 'error.lighter',
                          color: connection.status === 'active' ? 'success.darker' : 'error.darker',
                        }}
                      >
                        {connection.status === 'active' ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(connection.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {isEditor && (
                          <>
                            <Tooltip title="Test Connection">
                              <IconButton
                                size="small"
                                onClick={() => handleTestConnection(connection.id)}
                                disabled={testingId === connection.id}
                              >
                                {testingId === connection.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <PlayArrowIcon fontSize="small" color="success" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(connection)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteConnection(connection.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConnection ? 'Edit Database Connection' : 'Create Database Connection'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Connection Name"
              fullWidth
              required
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
            />
            <FormControl fullWidth required>
              <InputLabel>Database Type</InputLabel>
              <Select
                value={connectionType}
                label="Database Type"
                onChange={(e) => setConnectionType(e.target.value)}
              >
                <MenuItem value="postgresql">PostgreSQL</MenuItem>
                <MenuItem value="mysql" disabled>MySQL (Coming Soon)</MenuItem>
                <MenuItem value="mongodb" disabled>MongoDB (Coming Soon)</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Host"
                fullWidth
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
              <TextField
                label="Port"
                type="number"
                required
                value={port}
                onChange={(e) => setPort(e.target.value)}
                sx={{ width: '150px' }}
              />
            </Box>
            <TextField
              label="Database Name"
              fullWidth
              required
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
            />
            <TextField
              label="Username"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveConnection} 
            variant="contained" 
            color="primary"
            disabled={!connectionName || !host || !port || !database || !username}
          >
            {editingConnection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatabaseConnections;
