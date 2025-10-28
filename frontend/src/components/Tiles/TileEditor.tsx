import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  FormControlLabel,
  Switch,
  IconButton,
  Divider,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
// MUI imports
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TitleIcon from '@mui/icons-material/Title';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CodeIcon from '@mui/icons-material/Code';
import PieChartIcon from '@mui/icons-material/PieChart';
import { v4 as uuidv4 } from 'uuid';
import { databaseConnectionService } from '../../services/databaseConnectionService';

// Define the text row interface for Text & Query tiles
interface TextRow {
  id: string;
  type: 'header' | 'subheader' | 'text';
  content: string;
  isQuery: boolean;
}

// Backend tile data structure
export interface TileData {
  id: string;
  title: string;
  type: 'Text & Query' | 'Pie Chart';
  connectionId: string; // Required for all tile types
  dashboardId: string;
  content: {
    textRows?: TextRow[];
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
  createdAt?: string;
  updatedAt?: string;
}

interface TileEditorProps {
  open: boolean;
  tile?: TileData;
  dashboardId: string;
  onClose: () => void;
  onSave: (tileData: TileData) => void;
  // Connection ID is required and cannot be changed after creation
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component for managing editor tabs
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tile-editor-tab-${index}`}
      aria-labelledby={`tile-editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TileEditor: React.FC<TileEditorProps> = ({
  open,
  tile,
  onClose,
  onSave
}) => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Tile data state
  const [title, setTitle] = useState('');
  const [textRows, setTextRows] = useState<TextRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pie chart state
  const [dimensionQuery, setDimensionQuery] = useState('');
  const [measureQuery, setMeasureQuery] = useState('');
  const [dimensionLabel, setDimensionLabel] = useState('');
  const [measureLabel, setMeasureLabel] = useState('');

  // Initialize form data when editing an existing tile
  useEffect(() => {
    if (open) {
      console.log('[DEBUG] TileEditor - Opening editor with tile data:', JSON.stringify(tile, null, 2));
      
      if (tile) {
        setTitle(tile.title);
        
        // Set text rows for Text & Query tiles
        if (tile.type === 'Text & Query') {
          console.log('[DEBUG] TileEditor - Text & Query tile detected, textRows:', 
            JSON.stringify(tile.content.textRows, null, 2));
          setTextRows(tile.content.textRows || []);
        }
        
        // Set pie chart configuration for Pie Chart tiles
        if (tile.type === 'Pie Chart') {
          if (tile.content.pieChartConfig) {
            setDimensionQuery(tile.content.pieChartConfig.dimensionQuery || '');
            setMeasureQuery(tile.content.pieChartConfig.measureQuery || '');
            setDimensionLabel(tile.content.pieChartConfig.dimensionLabel || '');
            setMeasureLabel(tile.content.pieChartConfig.measureLabel || '');
          }
        }
        
        // Load database schema on open if we have a connectionId
        // Connection ID is required for all tile types
        if (tile.connectionId) {
          // Schema loading is only needed for table tiles, which we've removed
          console.log('[DEBUG] TileEditor - Database connection available:', tile.connectionId);
        } else {
          setError('Database connection is required but not provided');
        }
      } else {
        // Initialize with defaults for a new tile
        setTitle('');
        setTextRows([]);
      }
    }
  }, [tile, open]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Text row management functions for Text & Query tiles
  const addTextRow = () => {
    const newRow: TextRow = {
      id: uuidv4(),
      type: 'text',
      content: '',
      isQuery: false
    };
    console.log('[DEBUG] TileEditor addTextRow - Adding new row:', newRow);
    setTextRows([...textRows, newRow]);
  };

  const removeTextRow = (id: string) => {
    setTextRows(textRows.filter(row => row.id !== id));
  };

  const updateTextRowContent = (id: string, content: string) => {
    console.log(`[DEBUG] TileEditor updateTextRowContent - Updating row ${id} with content:`, content);
    setTextRows(textRows.map(row => 
      row.id === id ? { ...row, content } : row
    ));
  };

  const updateTextRowType = (id: string, type: 'header' | 'subheader' | 'text') => {
    const targetRow = textRows.find(row => row.id === id);
  
    // If this is a query row, don't allow changing the type - it should stay as 'text'
    if (targetRow?.isQuery) {
      console.log(`[DEBUG] TileEditor updateTextRowType - Attempted to change query row ${id} type to ${type}, ignoring`);
      return;
    }
  
    console.log(`[DEBUG] TileEditor updateTextRowType - Updating row ${id} with type:`, type);
    setTextRows(textRows.map(row => 
      row.id === id ? { ...row, type } : row
    ));
  };

  const toggleQueryMode = (id: string) => {
    const targetRow = textRows.find(row => row.id === id);
    const newIsQuery = !targetRow?.isQuery;
    console.log(`[DEBUG] TileEditor toggleQueryMode - Toggling query mode for row ${id} from ${targetRow?.isQuery} to ${newIsQuery}`);
    
    setTextRows(textRows.map(row => {
      if (row.id === id) {
        // If switching to query mode, always set type to normal 'text'
        if (newIsQuery) {
          return { ...row, isQuery: true, type: 'text' };
        } else {
          return { ...row, isQuery: false };
        }
      }
      return row;
    }));
  };

  // Form validation
  const isValid = (): boolean => {
    if (!title.trim()) return false;
    
    if (tile?.type === 'Text & Query' && textRows.length === 0) {
      return false;
    }
    
    if (tile?.type === 'Pie Chart' && (!dimensionQuery.trim() || !measureQuery.trim())) {
      return false;
    }
    
    return true;
  };

  // Handle save button click
  const handleSave = () => {
    console.log('[DEBUG] TileEditor handleSave - Starting save process');
    console.log('[DEBUG] TileEditor handleSave - Current state:', {
      title,
      textRows: JSON.stringify(textRows, null, 2),
      tileId: tile?.id,
      tileType: tile?.type
    });
    
    if (!title.trim()) {
      console.log('[DEBUG] TileEditor handleSave - Validation failed: Title is required');
      setError('Title is required');
      return;
    }
    
    // Validate that we have a connection ID
    if (!tile?.connectionId) {
      console.log('[DEBUG] TileEditor handleSave - Validation failed: Connection ID is required');
      setError('Database connection is required');
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare the tile data based on the type
      const updatedTile: TileData = {
        id: tile?.id || uuidv4(),
        title: title.trim(),
        type: tile?.type || 'Text & Query', // Default to Text & Query if not specified
        dashboardId: tile?.dashboardId || '',
        connectionId: tile.connectionId, // Use the existing connection ID, cannot be changed
        position: tile?.position || { x: 0, y: 0, w: 6, h: 4 },
        content: {}
      };
      
      // For Text & Query tiles, explicitly add textRows at both locations to ensure they're preserved
      if (tile?.type === 'Text & Query' && textRows.length > 0) {
        // Add textRows to content for frontend consistency
        updatedTile.content.textRows = textRows;
      }
      
      // For Pie Chart tiles, add pie chart configuration
      if (tile?.type === 'Pie Chart') {
        updatedTile.content.pieChartConfig = {
          dimensionQuery,
          measureQuery,
          dimensionLabel,
          measureLabel
        };
      }
      
      console.log('[DEBUG] TileEditor handleSave - Prepared tile data for saving:', JSON.stringify(updatedTile, null, 2));
      console.log('[DEBUG] TileEditor handleSave - Text rows count:', textRows.length);
      if (textRows.length > 0) {
        console.log('[DEBUG] TileEditor handleSave - First text row:', JSON.stringify(textRows[0], null, 2));
      }
      
      onSave(updatedTile);
      console.log('[DEBUG] TileEditor handleSave - onSave callback called');
      onClose();
    } catch (err) {
      console.error('[ERROR] TileEditor handleSave - Error saving tile:', err);
      setError('Failed to save tile');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {tile ? `Edit ${tile.type} Tile` : 'Create New Tile'}
        {tile?.connectionId && <Typography variant="caption" display="block">Connected to database</Typography>}
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tile editor tabs">
          <Tab label="Settings" id="tile-editor-tab-0" />
          <Tab label="Content" id="tile-editor-tab-1" />
          <Tab label="Preview" id="tile-editor-tab-2" />
        </Tabs>
      </Box>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
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
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Tile Type</Typography>
                <Typography variant="body1">
                  {tile?.type || 'Not set'}
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Tile type cannot be changed after creation
                  </Typography>
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Database Connection</Typography>
                <Typography variant="body1">
                  {tile?.connectionId || 'Not set'}
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Database connection cannot be changed after creation
                  </Typography>
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {tile?.type === 'Text & Query' && (
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={addTextRow}
                >
                  Add Text Row
                </Button>
              </Grid>
              
              {textRows.map((row, index) => (
                <Grid item xs={12} key={row.id}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">Row {index + 1}</Typography>
                        <IconButton 
                          color="error" 
                          onClick={() => removeTextRow(row.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth disabled={row.isQuery}>
                          <InputLabel>Text Type</InputLabel>
                          <Select
                            value={row.type}
                            label="Text Type"
                            onChange={(e) => updateTextRowType(row.id, e.target.value as 'header' | 'subheader' | 'text')}
                          >
                            <MenuItem value="header">
                              <Box display="flex" alignItems="center">
                                <TitleIcon sx={{ mr: 1 }} /> Header
                              </Box>
                            </MenuItem>
                            <MenuItem value="subheader">
                              <Box display="flex" alignItems="center">
                                <SubtitlesIcon sx={{ mr: 1 }} /> Subheader
                              </Box>
                            </MenuItem>
                            <MenuItem value="text">
                              <Box display="flex" alignItems="center">
                                <TextFieldsIcon sx={{ mr: 1 }} /> Normal Text
                              </Box>
                            </MenuItem>
                          </Select>
                          <FormHelperText>
                            {row.isQuery ? 'Text type cannot be changed in query mode' : ''}
                          </FormHelperText>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={row.isQuery}
                              onChange={() => toggleQueryMode(row.id)}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center">
                              {row.isQuery ? (
                                <>
                                  <CodeIcon sx={{ mr: 1 }} /> Query Mode
                                </>
                              ) : (
                                <>
                                  <TextFieldsIcon sx={{ mr: 1 }} /> Text Mode
                                </>
                              )}
                            </Box>
                          }
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={row.isQuery ? 4 : 2}
                          label={row.isQuery ? 'SQL Query' : 'Content'}
                          value={row.content}
                          onChange={(e) => updateTextRowContent(row.id, e.target.value)}
                          placeholder={row.isQuery ? 'SELECT * FROM table' : 'Enter text content here'}
                          InputProps={{
                            startAdornment: row.isQuery ? <CodeIcon sx={{ mr: 1, color: 'text.secondary' }} /> : undefined
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
              
              {textRows.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No text rows added yet. Click "Add Text Row" to add content.</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
          
          {tile?.type === 'Pie Chart' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Dimension Query</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  SQL query to get the dimension values (categories/labels for the pie chart)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Dimension SQL Query"
                  value={dimensionQuery}
                  onChange={(e) => setDimensionQuery(e.target.value)}
                  placeholder="SELECT category FROM sales GROUP BY category"
                  InputProps={{
                    startAdornment: <CodeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Measure Query</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  SQL query to get the measure values (numbers for the pie chart slices)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Measure SQL Query"
                  value={measureQuery}
                  onChange={(e) => setMeasureQuery(e.target.value)}
                  placeholder="SELECT SUM(amount) FROM sales GROUP BY category"
                  InputProps={{
                    startAdornment: <CodeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dimension Column Label"
                  value={dimensionLabel}
                  onChange={(e) => setDimensionLabel(e.target.value)}
                  placeholder="category"
                  helperText="Column name from dimension query result"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Measure Column Label"
                  value={measureLabel}
                  onChange={(e) => setMeasureLabel(e.target.value)}
                  placeholder="sum"
                  helperText="Column name from measure query result"
                />
              </Grid>
              
              {(!dimensionQuery || !measureQuery) && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Enter both dimension and measure queries to configure the pie chart
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {tile && tile.type === 'Text & Query' && (
            <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
              {textRows.length > 0 ? (
                <Box>
                  {textRows.map((row) => (
                    <Box key={row.id} sx={{ mb: 2 }}>
                      {!row.isQuery ? (
                        <>
                          {row.type === 'header' && (
                            <Typography variant="h4">{row.content || 'Header Text'}</Typography>
                          )}
                          {row.type === 'subheader' && (
                            <Typography variant="h5">{row.content || 'Subheader Text'}</Typography>
                          )}
                          {row.type === 'text' && (
                            <Typography variant="body1">{row.content || 'Regular Text'}</Typography>
                          )}
                        </>
                      ) : (
                        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>Query Result Preview</Typography>
                          <Typography variant="body2" component="code" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {row.content ? 'Query results would display here' : 'No query defined'}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                            SQL: {row.content || 'No query defined'}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No content added yet. Add text rows in the Content tab.
                </Typography>
              )}
            </Paper>
          )}
          
          {tile && tile.type === 'Pie Chart' && (
            <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
              {dimensionQuery && measureQuery ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Pie Chart Preview</Typography>
                  <PieChartIcon sx={{ fontSize: 60, color: 'action.active', display: 'block', mx: 'auto', my: 2 }} />
                  <Typography variant="body2" align="center">
                    Dimension Query: <b>{dimensionQuery.substring(0, 50)}{dimensionQuery.length > 50 ? '...' : ''}</b>
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    Measure Query: <b>{measureQuery.substring(0, 50)}{measureQuery.length > 50 ? '...' : ''}</b>
                  </Typography>
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    Labels: <b>{dimensionLabel || 'Not set'}</b> | Values: <b>{measureLabel || 'Not set'}</b>
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Configure dimension and measure queries in the Content tab to see preview.
                </Typography>
              )}
            </Paper>
          )}
        </TabPanel>
      </DialogContent>
      
      {error && (
        <Box sx={{ px: 3, py: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!isValid() || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TileEditor;
