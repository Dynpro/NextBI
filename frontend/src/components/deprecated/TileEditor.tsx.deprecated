import React, { useState, useEffect } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Button,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
  IconButton,
  Divider,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon,
  Code as CodeIcon,
  Title as TitleIcon,
  Subtitles as SubtitlesIcon,
  TextFields as TextFieldsIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { projectService } from '../services/projectService';
import { databaseConnectionService, DatabaseConnection } from '../services/databaseConnectionService';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for the component
interface TilePosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Backend tile data structure
interface TileData {
  id?: string;
  title: string;
  description?: string;
  type: 'chart' | 'text' | 'kpi'; // Backend types
  dashboardId: string;
  connectionId?: string;
  config?: TileConfig;
  createdAt?: string;
  updatedAt?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  position?: TilePosition;
}

// Data structure for creating or updating a tile
interface CreateTileDto {
  title: string;
  description?: string;
  type: 'chart' | 'text' | 'kpi';
  dashboardId: string;
  connectionId?: string;
  config: TileConfig;
  position?: TilePosition;
}

// Tab panel component for the editor
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
      id={`tile-editor-tabpanel-${index}`}
      aria-labelledby={`tile-editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Fields and configuration interfaces
interface DimensionField {
  fieldId: string;
  fieldName: string;
  aggregation?: string;
}

interface MeasureField {
  fieldId: string;
  fieldName: string;
  aggregation: string;
  alias?: string;
}

interface TextRow {
  id: string;
  type: 'header' | 'subheader' | 'text';
  content: string;
  isQuery: boolean;
  text?: string; // Added for compatibility with projectService
}

interface DatabaseField {
  name: string;
  type: string;
  table: string;
  description?: string;
}

// Tile configuration structure
interface TileConfig {
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
  uiChartType?: string; // UI-specific chart type (including 'table')
  uiType?: 'chart' | 'table' | 'metric' | 'text' | 'query'; // UI-specific type
  dimensions?: DimensionField[];
  measures?: MeasureField[];
  textRows?: TextRow[];
  connectionId?: string;
  isQueryMode?: boolean; // For text/query tiles
  customQuery?: string; // For text/query tiles in query mode
  metadata?: {
    sqlQuery?: string;
    [key: string]: any;
  };
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  measure?: MeasureField;
}

interface TileEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  dashboardId: string;
  tile?: TileData; // Will be provided when editing an existing tile
}

// Helper function to check if a field is numeric
const isNumericField = (field: DatabaseField): boolean => {
  const numericTypes = ['int', 'integer', 'number', 'float', 'double', 'decimal'];
  return numericTypes.some(type => field.type.toLowerCase().includes(type));
};

// TileEditor component
const TileEditor: React.FC<TileEditorProps> = ({ open, onClose, onSave, dashboardId, tile }) => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Basic tile information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Tile type and visualization
  const [tileType, setTileType] = useState<'chart' | 'table' | 'metric' | 'text' | 'query'>('chart');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'donut'>('bar');
  
  // Connection and fields
  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [fields, setFields] = useState<DatabaseField[]>([]);
  const [fieldTableMap, setFieldTableMap] = useState<Map<string, string>>(new Map());
  
  // Tile data configuration
  const [dimensions, setDimensions] = useState<DimensionField[]>([]);
  const [measures, setMeasures] = useState<MeasureField[]>([]);
  const [textRows, setTextRows] = useState<TextRow[]>([]);
  
  // Query mode (for text and query tiles)
  const [isQueryMode, setIsQueryMode] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize editor with data from existing tile
  useEffect(() => {
    if (open) {
      // Reset to defaults
      setName('');
      setDescription('');
      setTileType('chart');
      setChartType('bar');
      setConnectionId(undefined);
      setDimensions([]);
      setMeasures([]);
      setTextRows([]);
      setIsQueryMode(false);
      setCustomQuery('');
      setError('');
      setTabValue(0);
      
      // Load connections
      loadConnections();
      
      // If editing an existing tile, load its data
      if (tile) {
        setName(tile.title);
        setDescription(tile.description || '');
        
        // Set connection ID if available
        if (tile.connectionId) {
          setConnectionId(tile.connectionId);
          // Load fields for this connection
          loadFields(tile.connectionId);
        }
        
        // Handle tile config if available
        if (tile.config) {
          const config = tile.config;
          
          // Set UI type - default based on backend type if not specified
          if (config.uiType) {
            setTileType(config.uiType);
          } else {
            // Derive from backend type
            switch (tile.type) {
              case 'chart':
                setTileType(config.chartType === 'table' ? 'table' : 'chart');
                break;
              case 'kpi':
                setTileType('metric');
                break;
              case 'text':
                setTileType(config.isQueryMode ? 'query' : 'text');
                break;
              default:
                setTileType('chart'); // Default
            }
          }
          
          // Set chart type if available
          if (config.chartType) {
            setChartType(config.chartType);
          } else if (config.uiChartType) {
            setChartType(config.uiChartType as 'bar' | 'line' | 'pie' | 'donut' | 'table');
          }
          
          // Set dimensions and measures
          if (config.dimensions) {
            setDimensions(config.dimensions);
          }
          
          if (config.measures) {
            setMeasures(config.measures);
          } else if (config.measure) {
            // For backward compatibility with single measure
            setMeasures([config.measure]);
          }
          
          // Set text rows if available
          if (config.textRows) {
            setTextRows(config.textRows);
          }
          
          // Set query mode and custom query if available
          if (config.isQueryMode !== undefined) {
            setIsQueryMode(config.isQueryMode);
          }
          
          if (config.customQuery) {
            setCustomQuery(config.customQuery);
          }
        }
      }
    }
  }, [open, tile]);

  // Load database connections
  const loadConnections = async () => {
    try {
      const response = await databaseConnectionService.getAllConnections();
      setConnections(response);
    } catch (error) {
      console.error('Error loading connections:', error);
      setError('Failed to load database connections');
    }
  };

  // Load fields for a specific connection
  const loadFields = async (connectionId: string) => {
    setLoading(true);
    try {
      // Note: This is a mock implementation as the actual method doesn't exist in the service
      // In a real implementation, this would call an appropriate API endpoint
      // For now, we're setting dummy fields for demonstration
      const dummyFields: DatabaseField[] = [
        { name: 'id', type: 'integer', table: 'users' },
        { name: 'name', type: 'string', table: 'users' },
        { name: 'email', type: 'string', table: 'users' },
        { name: 'created_at', type: 'timestamp', table: 'users' },
        { name: 'amount', type: 'decimal', table: 'orders' },
        { name: 'product_id', type: 'integer', table: 'orders' },
        { name: 'order_date', type: 'timestamp', table: 'orders' }
      ];
      
      setFields(dummyFields);
      
      // Build mapping between field IDs and their source tables
      const tableMap = new Map<string, string>();
      dummyFields.forEach((field: DatabaseField) => {
        tableMap.set(field.name, field.table);
      });
      setFieldTableMap(tableMap);
    } catch (error) {
      console.error('Error loading fields:', error);
      setError('Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  // Handle connection change
  const handleConnectionChange = (event: SelectChangeEvent) => {
    const newConnectionId = event.target.value;
    setConnectionId(newConnectionId);
    setFields([]); // Reset fields when connection changes
    
    // Load fields for the selected connection
    if (newConnectionId) {
      loadFields(newConnectionId);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle tile type change
  const handleTileTypeChange = (_event: React.MouseEvent<HTMLElement>, newTileType: 'chart' | 'table' | 'metric' | 'text' | 'query') => {
    if (newTileType !== null) {
      setTileType(newTileType);
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (_event: React.MouseEvent<HTMLElement>, newChartType: 'bar' | 'line' | 'pie' | 'donut' | 'table') => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  // Functions to manage dimensions
  const handleAddDimension = (field: DatabaseField) => {
    const dimension: DimensionField = {
      fieldId: `${field.table}.${field.name}`,
      fieldName: `${field.table}.${field.name}`
    };
    setDimensions([...dimensions, dimension]);
  };

  const handleRemoveDimension = (index: number) => {
    const newDimensions = [...dimensions];
    newDimensions.splice(index, 1);
    setDimensions(newDimensions);
  };

  // Functions to manage measures
  const handleAddMeasure = (field: DatabaseField) => {
    const measure: MeasureField = {
      fieldId: `${field.table}.${field.name}`,
      fieldName: `${field.table}.${field.name}`,
      aggregation: 'sum' // Default aggregation
    };
    setMeasures([...measures, measure]);
  };

  const handleRemoveMeasure = (index: number) => {
    const newMeasures = [...measures];
    newMeasures.splice(index, 1);
    setMeasures(newMeasures);
  };

  const handleMeasureAggregationChange = (index: number, aggregation: string) => {
    const newMeasures = [...measures];
    newMeasures[index].aggregation = aggregation;
    setMeasures(newMeasures);
  };

  // Functions to manage text rows
  const handleAddTextRow = () => {
    setTextRows([
      ...textRows,
      {
        id: uuidv4(),
        type: 'text',
        content: '',
        text: '',
        isQuery: false
      }
    ]);
  };

  const handleRemoveTextRow = (id: string) => {
    setTextRows(textRows.filter(row => row.id !== id));
  };

  const handleTextRowTypeChange = (id: string, type: 'header' | 'subheader' | 'text') => {
    setTextRows(
      textRows.map(row => 
        row.id === id ? { ...row, type } : row
      )
    );
  };

  const handleTextRowContentChange = (id: string, content: string) => {
    setTextRows(
      textRows.map(row => 
        row.id === id ? { ...row, content } : row
      )
    );
  };

  const handleTextRowQueryModeChange = (id: string, isQuery: boolean) => {
    setTextRows(textRows.map((row) => 
      row.id === id ? { ...row, isQuery, text: row.content } : row
    ));
  };

  // Generate a simple SQL query based on selected dimensions and measures
  const generateSqlQuery = (): string => {
    if (dimensions.length === 0 && measures.length === 0) {
      return 'SELECT * FROM table LIMIT 100';
    }

    const selectClauses: string[] = [];
    const fromTables = new Set<string>();

    // Add dimensions to SELECT
    dimensions.forEach(dim => {
      selectClauses.push(dim.fieldName);
      const tableName = dim.fieldName.split('.')[0];
      if (tableName) fromTables.add(tableName);
    });

    // Add measures to SELECT
    measures.forEach(measure => {
      selectClauses.push(`${measure.aggregation}(${measure.fieldName}) as ${measure.aggregation}_${measure.fieldName.replace('.', '_')}`);
      const tableName = measure.fieldName.split('.')[0];
      if (tableName) fromTables.add(tableName);
    });

    // Build query
    let query = `SELECT ${selectClauses.join(', ')} FROM ${Array.from(fromTables).join(', ')}`;
    
    // Add GROUP BY if we have dimensions and measures
    if (dimensions.length > 0 && measures.length > 0) {
      query += ` GROUP BY ${dimensions.map(d => d.fieldName).join(', ')}`;
    }
    
    query += ' LIMIT 100';
    return query;
  };

  // Validate tile configuration before saving
  const isValid = (): boolean => {
    if (!name.trim()) {
      return false;
    }

    switch (tileType) {
      case 'chart':
      case 'table':
        return measures.length > 0; // Need at least one measure for charts/tables
      case 'metric':
        return measures.length === 1; // Need exactly one measure for metrics
      case 'text':
      case 'query':
        return textRows.length > 0 || (isQueryMode && !!customQuery); // Need text or query
      default:
        return false;
    }
  };

  // Save the tile with proper type mapping between UI and backend
  const handleSave = async () => {
    if (!isValid()) {
      setError('Invalid tile configuration');
      setSaving(false);
      return;
    }
    setError('');
    setSaving(true);
    
    try {
      // Generate final config object based on tile type
      let config: TileConfig = {};
      
      switch (tileType) {
        case 'chart':
          config = {
            chartType,
            uiChartType: chartType, // Store UI chart type explicitly
            dimensions,
            measures,
            uiType: 'chart', // Store original UI type
            metadata: {
              sqlQuery: generateSqlQuery()
            }
          };
          break;
        case 'table':
          config = {
            chartType: chartType, // Keep the same chart type property for consistency
            uiChartType: 'table',
            dimensions,
            measures,
            uiType: 'table', // Store original UI type
            metadata: {
              sqlQuery: generateSqlQuery()
            }
          };
          break;
        case 'metric':
          config = {
            measures, // Store as array for consistency
            measure: measures[0], // For backward compatibility
            uiType: 'metric',
            metadata: {
              sqlQuery: generateSqlQuery()
            }
          };
          break;
        case 'text':
          config = {
            // Map our TextRow format to the backend format expected by projectService
            textRows: textRows.map(row => ({ 
              ...row,
              text: row.content // Ensure text property is set for backend compatibility
            })),
            uiType: 'text',
            isQueryMode: false
          };
          break;
        case 'query':
          config = {
            // Map our TextRow format to the backend format expected by projectService
            textRows: textRows.map(row => ({ 
              ...row,
              text: row.content // Ensure text property is set for backend compatibility
            })),
            uiType: 'query',
            isQueryMode: true,
            customQuery,
            connectionId
          };
          break;
      }
      
      // Map UI tile type to backend-accepted type
      let backendType: 'chart' | 'text' | 'kpi';
      switch (tileType) {
        case 'chart':
        case 'table':
          backendType = 'chart';
          break;
        case 'metric':
          backendType = 'kpi';
          break;
        case 'text':
        case 'query':
          backendType = 'text';
          break;
        default:
          backendType = 'chart'; // Default fallback
      }
      
      // Create the tile data payload
      const tileData: CreateTileDto = {
        title: name,
        description: description || undefined,
        type: backendType,
        dashboardId,
        connectionId: connectionId || undefined,
        config,
        position: tile?.position || { x: 0, y: 0, w: 6, h: 6 }
      };
      
      // Create or update the tile
      if (tile?.id) {
        await projectService.updateTile(tile.id, tileData);
      } else {
        await projectService.createTile(tileData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save tile:', error);
      setError(`Failed to save tile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Render the component
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="tile-editor-title"
    >
      <DialogTitle id="tile-editor-title">
        {tile ? 'Edit Tile' : 'Create New Tile'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {/* Tabs navigation */}
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tile editor tabs">
          <Tab label="General" id="tile-editor-tab-0" />
          <Tab label="Data" id="tile-editor-tab-1" />
          <Tab label="Visualization" id="tile-editor-tab-2" />
        </Tabs>
        
        {/* General Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Tile Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                error={!name.trim() && saving}
                helperText={!name.trim() && saving ? 'Name is required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Tile Type</Typography>
              <ToggleButtonGroup
                value={tileType}
                exclusive
                onChange={handleTileTypeChange}
                aria-label="tile type"
              >
                <ToggleButton value="chart" aria-label="chart">
                  <BarChartIcon sx={{ mr: 1 }} />
                  Chart
                </ToggleButton>
                <ToggleButton value="table" aria-label="table">
                  <TableChartIcon sx={{ mr: 1 }} />
                  Table
                </ToggleButton>
                <ToggleButton value="metric" aria-label="metric">
                  <PieChartIcon sx={{ mr: 1 }} />
                  Metric
                </ToggleButton>
                <ToggleButton value="text" aria-label="text">
                  <TextFieldsIcon sx={{ mr: 1 }} />
                  Text
                </ToggleButton>
                <ToggleButton value="query" aria-label="query">
                  <CodeIcon sx={{ mr: 1 }} />
                  Query
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Data Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Connection selection - for all tile types except pure text */}
            {tileType !== 'text' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="connection-select-label">Database Connection</InputLabel>
                  <Select
                    labelId="connection-select-label"
                    value={connectionId || ''}
                    onChange={handleConnectionChange}
                    label="Database Connection"
                    disabled={loading}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {connections.map((conn) => (
                      <MenuItem key={conn.id} value={conn.id}>
                        {conn.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {loading ? 'Loading...' : 'Select a database connection'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Content specific to tile type */}
            {(tileType === 'text' || tileType === 'query') ? (
              <Grid item xs={12}>
                {/* Text Rows Editor */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Content Rows</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddTextRow}
                    size="small"
                  >
                    Add Row
                  </Button>
                </Box>
                
                {/* Text rows list */}
                {textRows.map((row) => (
                  <Paper key={row.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} display="flex" justifyContent="space-between">
                        <ToggleButtonGroup
                          value={row.type}
                          exclusive
                          onChange={(e, newType) => newType && handleTextRowTypeChange(row.id, newType)}
                          size="small"
                        >
                          <ToggleButton value="header">
                            <TitleIcon sx={{ mr: 1 }} />
                            Header
                          </ToggleButton>
                          <ToggleButton value="subheader">
                            <SubtitlesIcon sx={{ mr: 1 }} />
                            Subheader
                          </ToggleButton>
                          <ToggleButton value="text">
                            <TextFieldsIcon sx={{ mr: 1 }} />
                            Text
                          </ToggleButton>
                        </ToggleButtonGroup>
                        
                        <IconButton onClick={() => handleRemoveTextRow(row.id)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      
                      {/* Query mode toggle for text row */}
                      {tileType === 'query' && (
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={row.isQuery}
                                onChange={(e) => handleTextRowQueryModeChange(row.id, e.target.checked)}
                              />
                            }
                            label="Use SQL Query"
                          />
                        </Grid>
                      )}
                      
                      {/* Row content input */}
                      <Grid item xs={12}>
                        <TextField
                          label={row.isQuery ? "SQL Query" : "Content"}
                          value={row.content}
                          onChange={(e) => handleTextRowContentChange(row.id, e.target.value)}
                          fullWidth
                          multiline
                          rows={row.isQuery ? 4 : 2}
                          variant="outlined"
                          placeholder={row.isQuery ? "SELECT * FROM table" : "Enter content here"}
                        />
                      </Grid>
                      
                      {/* Preview of how the text will look */}
                      {row.content && !row.isQuery && (
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                            Preview:
                          </Typography>
                          {row.type === 'header' && (
                            <Typography variant="h4">{row.content}</Typography>
                          )}
                          {row.type === 'subheader' && (
                            <Typography variant="h5">{row.content}</Typography>
                          )}
                          {row.type === 'text' && (
                            <Typography variant="body1">{row.content}</Typography>
                          )}
                        </Grid>
                      )}
                      
                      {/* SQL Query result preview */}
                      {row.isQuery && row.content && connectionId && (
                        <Grid item xs={12}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<StorageIcon />}
                            onClick={() => {
                              // Logic to execute the SQL query and show results
                              console.log(`Execute query: ${row.content} on connection: ${connectionId}`);
                            }}
                          >
                            Test Query
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                ))}
                
                {textRows.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No text rows added. Click "Add Row" to create content.
                    </Typography>
                  </Box>
                )}
              </Grid>
            ) : (
              <Grid container spacing={3}>
                {/* For non-text tile types, show dimensions and measures */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Dimensions</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      {dimensions.length > 0 ? (
                        dimensions.map((dimension, index) => (
                          <Chip
                            key={index}
                            label={dimension.fieldName}
                            onDelete={() => handleRemoveDimension(index)}
                            sx={{ m: 0.5 }}
                          />
                        ))
                      ) : (
                        <Typography color="text.secondary">
                          No dimensions selected. Select fields from the list below.
                        </Typography>
                      )}
                    </Paper>

                    <Typography variant="subtitle2" gutterBottom>Available Fields</Typography>
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                      {fields.map((field) => (
                        <Chip
                          key={field.name + field.table}
                          label={`${field.table}.${field.name}`}
                          onClick={() => handleAddDimension(field)}
                          sx={{ m: 0.5, cursor: 'pointer' }}
                          variant="outlined"
                        />
                      ))}
                      {fields.length === 0 && (
                        <Typography color="text.secondary">
                          {loading ? 'Loading fields...' : 'Select a connection to view available fields'}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Measures</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      {measures.length > 0 ? (
                        measures.map((measure, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip
                              label={`${measure.aggregation}(${measure.fieldName})`}
                              onDelete={() => handleRemoveMeasure(index)}
                              sx={{ mr: 1 }}
                            />
                            <Select
                              value={measure.aggregation}
                              onChange={(e) => handleMeasureAggregationChange(index, e.target.value)}
                              size="small"
                              sx={{ minWidth: 100 }}
                            >
                              <MenuItem value="sum">Sum</MenuItem>
                              <MenuItem value="avg">Average</MenuItem>
                              <MenuItem value="min">Min</MenuItem>
                              <MenuItem value="max">Max</MenuItem>
                              <MenuItem value="count">Count</MenuItem>
                            </Select>
                          </Box>
                        ))
                      ) : (
                        <Typography color="text.secondary">
                          No measures selected. Select fields from the list below.
                        </Typography>
                      )}
                    </Paper>

                    <Typography variant="subtitle2" gutterBottom>Available Fields</Typography>
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                      {fields.filter(isNumericField).map((field) => (
                        <Chip
                          key={field.name + field.table}
                          label={`${field.table}.${field.name}`}
                          onClick={() => handleAddMeasure(field)}
                          sx={{ m: 0.5, cursor: 'pointer' }}
                          variant="outlined"
                        />
                      ))}
                      {fields.length === 0 && (
                        <Typography color="text.secondary">
                          {loading ? 'Loading fields...' : 'Select a connection to view available fields'}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                </Grid>

                {/* SQL Preview */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>SQL Preview</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {generateSqlQuery()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Visualization Tab */}
        <TabPanel value={tabValue} index={2}>
          {tileType === 'chart' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Chart Type</Typography>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={handleChartTypeChange}
                  aria-label="chart type"
                  color="primary"
                >
                  <ToggleButton value="bar" aria-label="bar chart">
                    <BarChartIcon sx={{ mr: 1 }} />
                    Bar Chart
                  </ToggleButton>
                  <ToggleButton value="line" aria-label="line chart">
                    <LineChartIcon sx={{ mr: 1 }} />
                    Line Chart
                  </ToggleButton>
                  <ToggleButton value="pie" aria-label="pie chart">
                    <PieChartIcon sx={{ mr: 1 }} />
                    Pie Chart
                  </ToggleButton>
                  <ToggleButton value="table" aria-label="table chart">
                    <TableChartIcon sx={{ mr: 1 }} />
                    Table
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Chart Preview</Typography>
                <Paper variant="outlined" sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {chartType === 'bar' && <BarChartIcon sx={{ fontSize: 100, color: 'action.disabled' }} />}
                  {chartType === 'line' && <LineChartIcon sx={{ fontSize: 100, color: 'action.disabled' }} />}
                  {chartType === 'pie' && <PieChartIcon sx={{ fontSize: 100, color: 'action.disabled' }} />}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {tileType === 'table' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Table Preview</Typography>
                <Paper variant="outlined" sx={{ p: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TableChartIcon sx={{ fontSize: 100, color: 'action.disabled' }} />
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {tileType === 'metric' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Metric Preview</Typography>
                <Paper variant="outlined" sx={{ p: 2, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3">123,456</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {measures.length > 0 ? `${measures[0].aggregation}(${measures[0].fieldName})` : 'Sample Metric'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {(tileType === 'text' || tileType === 'query') && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Text Content Preview</Typography>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 150 }}>
                  {textRows.length > 0 ? (
                    <Box>
                      {textRows.map((row) => (
                        <Box key={row.id} sx={{ mb: 2 }}>
                          {row.type === 'header' && (
                            <Typography variant="h4">{row.content || 'Header Text'}</Typography>
                          )}
                          {row.type === 'subheader' && (
                            <Typography variant="h5">{row.content || 'Subheader Text'}</Typography>
                          )}
                          {row.type === 'text' && (
                            <Typography variant="body1">{row.content || 'Regular Text'}</Typography>
                          )}
                          {row.isQuery && (
                            <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mt: 1 }}>
                              SQL Query: {row.content || 'SELECT * FROM table'}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No content added yet. Add text rows in the Data tab.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSave}
          variant="contained"
          color="primary"
          loading={saving}
          disabled={!isValid() || saving}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default TileEditor;
