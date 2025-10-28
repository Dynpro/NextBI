import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import { QueryResult } from '../../services/queryService';

// Props interface for the QueryResultViewer component
interface QueryResultViewerProps {
  result?: QueryResult;
  loading?: boolean;
  error?: string;
  query?: string;
  maxHeight?: number | string;
}

/**
 * Determines the best visualization method based on the result shape
 */
const getResultDisplayMode = (result?: QueryResult): 'empty' | 'single-value' | 'single-row' | 'single-column' | 'table' => {
  if (!result || !result.rows || result.rows.length === 0) {
    return 'empty';
  }
  
  const rowCount = result.rows.length;
  const columnCount = result.fields?.length || 0;
  
  if (rowCount === 1 && columnCount === 1) {
    return 'single-value';
  } else if (rowCount === 1) {
    return 'single-row';
  } else if (columnCount === 1) {
    return 'single-column';
  } else {
    return 'table';
  }
};

/**
 * Format a value for display, handling different data types
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  } else if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Object]';
    }
  } else {
    return String(value);
  }
};

/**
 * A component to display SQL query results in various formats
 * based on the shape of the data returned
 */
const QueryResultViewer: React.FC<QueryResultViewerProps> = ({ 
  result, 
  loading, 
  error,
  query,
  maxHeight = 300
}) => {
  // If loading, show spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Executing query...
        </Typography>
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
        <Typography variant="body2">Query failed: {error}</Typography>
        {query && (
          <Typography variant="caption" component="pre" sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
            {query}
          </Typography>
        )}
      </Alert>
    );
  }

  // Determine the display mode based on result shape
  const displayMode = getResultDisplayMode(result);

  // No results case
  if (displayMode === 'empty') {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Query executed successfully. No results returned.
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
          Rows affected: {result?.rowCount || 0}
        </Typography>
      </Box>
    );
  }

  // Single value display (e.g., COUNT(*) result)
  if (displayMode === 'single-value') {
    const value = result?.rows[0]?.[result?.fields[0]?.name];
    const fieldName = result?.fields[0]?.name;
    
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {fieldName}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', my: 2 }}>
          {formatValue(value)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          1 row × 1 column
        </Typography>
      </Box>
    );
  }

  // Single row display (e.g., SELECT * FROM users WHERE id = 1)
  if (displayMode === 'single-row') {
    const row = result!.rows[0];
    
    return (
      <Paper variant="outlined" sx={{ 
        p: 2, 
        maxHeight: maxHeight,
        overflow: 'auto'
      }}>
        <Typography variant="subtitle2" gutterBottom>
          Record Details:
        </Typography>
        <Grid container spacing={1}>
          {result!.fields.map((field, idx) => (
            <React.Fragment key={field.name}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  {field.name}:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }} component="div">
                  {formatValue(row[field.name])}
                </Typography>
              </Grid>
              {idx < result!.fields.length - 1 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 0.5 }} />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          1 row × {result?.fields.length} columns
        </Typography>
      </Paper>
    );
  }

  // Single column display (e.g., SELECT email FROM users)
  if (displayMode === 'single-column') {
    const fieldName = result!.fields[0].name;
    
    return (
      <Box sx={{ 
        maxHeight: maxHeight,
        overflow: 'auto'
      }}>
        <Typography variant="subtitle2" gutterBottom>
          {fieldName}:
        </Typography>
        <List dense>
          {result!.rows.map((row, idx) => (
            <ListItem key={idx} divider={idx < result!.rows.length - 1}>
              <ListItemText primary={formatValue(row[fieldName])} />
            </ListItem>
          ))}
        </List>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {result!.rows.length} rows × 1 column
        </Typography>
      </Box>
    );
  }

  // Default table display for multiple rows and columns
  return (
    <Box sx={{ 
      maxHeight: maxHeight,
      overflow: 'auto'
    }}>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {result!.fields.map((field) => (
                <TableCell key={field.name}>
                  <Typography variant="subtitle2">{field.name}</Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {result!.rows.map((row, rowIdx) => (
              <TableRow key={rowIdx} hover>
                {result!.fields.map((field) => (
                  <TableCell key={`${rowIdx}-${field.name}`}>
                    <Typography variant="body2">
                      {formatValue(row[field.name])}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {result!.rows.length} rows × {result!.fields.length} columns
      </Typography>
    </Box>
  );
};

export default QueryResultViewer;
