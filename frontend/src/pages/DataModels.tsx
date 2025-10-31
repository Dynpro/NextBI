import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  Grid, 
  IconButton, 
  CircularProgress, 
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { dataModelService, CreateDataModelDto } from '../services/dataModelService';
import { databaseConnectionService, DatabaseConnection } from '../services/databaseConnectionService';
import { useAuth } from '../context/AuthContext';

// Extended interfaces for UI display
interface UIDataModel {
  id: string;
  name: string;
  description: string;
  connection: {
    id: string;
    name: string;
    type: string;
  };
  lastRefreshedAt: string | null;
}

interface DatabaseSchema {
  tables: SchemaTable[];
}

interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  primaryKey?: string[];
  foreignKeys?: ForeignKey[];
}

interface SchemaColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  maxLength?: number;
}

interface ForeignKey {
  column: string;
  referenceTable: string;
  referenceColumn: string;
}

const DataModels: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // State for data models and connections
  const [dataModels, setDataModels] = useState<UIDataModel[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [schemaLoading, setSchemaLoading] = useState<boolean>(false);
  
  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [viewSchemaDialogOpen, setViewSchemaDialogOpen] = useState<boolean>(false);
  
  // State for form inputs
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelDescription, setNewModelDescription] = useState<string>('');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [selectedDataModelId, setSelectedDataModelId] = useState<string>('');
  
  // State for database schema
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseSchema | null>(null);
  
  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Fetch data models and connections on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch connections and data models using services
        const connectionsData = await databaseConnectionService.getAllConnections();
        
        // Fetch data models
        const dataModelsData = await dataModelService.getAllDataModels();
        
        // Map data models to UI format
        const uiDataModels: UIDataModel[] = dataModelsData.map(model => {
          const connection = connectionsData.find(conn => conn.id === model.connectionId) || {
            id: model.connectionId,
            name: 'Unknown Connection',
            type: 'unknown'
          };
          
          return {
            id: model.id,
            name: model.name,
            description: model.description,
            connection: {
              id: connection.id,
              name: connection.name,
              type: connection.type
            },
            lastRefreshedAt: model.updatedAt || null
          };
        });
        
        setConnections(connectionsData);
        setDataModels(uiDataModels);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data models or connections:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data models or connections',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleCreateDataModel = async () => {
    if (!newModelName || !selectedConnectionId) {
      setSnackbar({
        open: true,
        message: 'Please provide a name and select a database connection',
        severity: 'warning'
      });
      return;
    }
    
    try {
      // Create data model with schema from database
      await fetchDatabaseSchema(selectedConnectionId);
      
      const modelData: CreateDataModelDto = {
        name: newModelName,
        description: newModelDescription,
        connectionId: selectedConnectionId
      };
      
      // Add schema data if available
      if (databaseSchema?.tables) {
        modelData.tables = databaseSchema.tables.map(t => t.name);
      }
      
      // Create data model using service
      const newModel = await dataModelService.createDataModel(modelData);
      
      // Find the connection to display in UI
      const connection = connections.find(conn => conn.id === selectedConnectionId) || {
        id: selectedConnectionId,
        name: 'Unknown Connection',
        type: 'unknown'
      };
      
      // Add new data model to state in UI format
      const uiModel: UIDataModel = {
        id: newModel.id,
        name: newModel.name,
        description: newModel.description,
        connection: {
          id: connection.id,
          name: connection.name,
          type: connection.type
        },
        lastRefreshedAt: newModel.updatedAt || null
      };
      
      setDataModels([...dataModels, uiModel]);
      
      // Reset form and close dialog
      setNewModelName('');
      setNewModelDescription('');
      setSelectedConnectionId('');
      setCreateDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Data model created successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating data model:', error);
      setSnackbar({
        open: true,
        message: `Failed to create data model: ${(error as Error).message}`,
        severity: 'error'
      });
    }
  };
  
  const handleDeleteDataModel = async () => {
    try {
      // Delete data model using service
      await dataModelService.deleteDataModel(selectedDataModelId);
      
      // Remove deleted data model from state
      setDataModels(dataModels.filter(model => model.id !== selectedDataModelId));
      
      // Reset state and close dialog
      setSelectedDataModelId('');
      setDeleteDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Data model deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting data model:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete data model: ${(error as Error).message}`,
        severity: 'error'
      });
    }
  };
  
  const fetchDatabaseSchema = async (connectionId: string) => {
    try {
      setSchemaLoading(true);
      
      // Get database schema using service
      const schemaData = await dataModelService.getDatabaseSchema(connectionId);
      
      // Convert to expected format
      const schema: DatabaseSchema = {
        tables: Object.entries(schemaData.tables).map(([tableName, columns]) => ({
          name: tableName,
          columns: columns.map(col => ({
            name: col,
            dataType: 'unknown', // We don't have this info from the service yet
            nullable: true
          }))
        }))
      };
      
      setDatabaseSchema(schema);
      setSchemaLoading(false);
      return schema;
    } catch (error) {
      console.error('Error fetching database schema:', error);
      setSnackbar({
        open: true,
        message: `Failed to fetch database schema: ${(error as Error).message}`,
        severity: 'error'
      });
      setSchemaLoading(false);
      return null;
    }
  };
  
  const handleViewSchema = async (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setViewSchemaDialogOpen(true);
    await fetchDatabaseSchema(connectionId);
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Data Models</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Model
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : dataModels.length === 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body1">
              No data models found. Create your first data model to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {dataModels.map((model) => (
            <Grid item xs={12} md={6} lg={4} key={model.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {model.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedDataModelId(model.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleViewSchema(model.connection.id)}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {model.description && (
                    <Typography color="textSecondary" gutterBottom>
                      {model.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Connection:</strong> {model.connection.name} ({model.connection.type})
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Last refreshed:</strong> {formatDate(model.lastRefreshedAt)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleViewSchema(model.connection.id)}
                    >
                      View Schema
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Create Data Model Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Data Model</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              label="Description"
              fullWidth
              value={newModelDescription}
              onChange={(e) => setNewModelDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              select
              label="Database Connection"
              fullWidth
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
              margin="normal"
              required
            >
              {connections.map((connection) => (
                <MenuItem key={connection.id} value={connection.id}>
                  {connection.name} ({connection.type})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateDataModel} 
            color="primary" 
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this data model? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDataModel} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Database Schema Dialog */}
      <Dialog
        open={viewSchemaDialogOpen}
        onClose={() => setViewSchemaDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Database Schema</DialogTitle>
        <DialogContent>
          {schemaLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : databaseSchema ? (
            <Box sx={{ mt: 2 }}>
              {databaseSchema.tables.map((table) => (
                <Accordion key={table.name}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography><strong>{table.name}</strong></Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      {table.primaryKey && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">Primary Key:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {table.primaryKey.map(key => (
                              <Chip key={key} label={key} size="small" color="primary" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {table.foreignKeys && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">Foreign Keys:</Typography>
                          {table.foreignKeys.map((fk, index) => (
                            <Box key={index} sx={{ ml: 1, mb: 1 }}>
                              <Typography variant="body2">
                                {`${fk.column} → ${fk.referenceTable}.${fk.referenceColumn}`}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      <Typography variant="subtitle2">Columns:</Typography>
                      <Box sx={{ overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Name</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Type</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Nullable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((column) => (
                              <tr key={column.name}>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{column.name}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                  {column.dataType}
                                  {column.maxLength ? `(${column.maxLength})` : ''}
                                </td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                  {column.nullable ? 'Yes' : 'No'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Typography>No schema available or failed to load schema.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSchemaDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataModels;
