import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, PersonAdd as PersonAddIcon, Search as SearchIcon } from '@mui/icons-material';
import { ProjectUser, searchUsers, addUserToProject, removeUserFromProject, getProjectUsers, User } from '../services/userService';

interface ProjectRoleManagerProps {
  projectId: string;
  onUpdate?: () => void;
}

const ProjectRoleManager: React.FC<ProjectRoleManagerProps> = ({ projectId, onUpdate }) => {
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openSearchDialog, setOpenSearchDialog] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load project users
  useEffect(() => {
    loadUsers();
  }, [projectId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const projectUsers = await getProjectUsers(projectId);
      setUsers(projectUsers);
    } catch (error) {
      console.error('Failed to load project users:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load project users'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 3) {
      setNotification({
        type: 'error',
        message: 'Search query must be at least 3 characters'
      });
      return;
    }

    try {
      setLoading(true);
      const results = await searchUsers(searchQuery);
      
      // Filter out users already in the project
      const filteredResults = results.filter(
        result => !users.some(user => user.id === result.id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Failed to search users:', error);
      setNotification({
        type: 'error',
        message: 'Failed to search users'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await addUserToProject(projectId, selectedUser.id, selectedRole);
      
      setNotification({
        type: 'success',
        message: `Added ${selectedUser.displayName} as ${selectedRole}`
      });
      
      // Refresh user list
      await loadUsers();
      
      // Close dialog and reset selection
      setOpenDialog(false);
      setSelectedUser(null);
      setSelectedRole('viewer');
      
      // Notify parent component if needed
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to add user to project:', error);
      setNotification({
        type: 'error',
        message: 'Failed to add user to project'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    // Don't allow removing the creator
    const userToRemove = users.find(user => user.id === userId);
    if (userToRemove?.isCreator) {
      setNotification({
        type: 'error',
        message: 'Cannot remove the project creator'
      });
      return;
    }

    try {
      setLoading(true);
      await removeUserFromProject(projectId, userId);
      
      setNotification({
        type: 'success',
        message: 'User removed from project'
      });
      
      // Refresh user list
      await loadUsers();
      
      // Notify parent component if needed
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to remove user from project:', error);
      setNotification({
        type: 'error',
        message: 'Failed to remove user from project'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setOpenSearchDialog(false);
    setOpenDialog(true);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Project Members</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenSearchDialog(true)}
        >
          Add User
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}

      {!loading && users.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
          No users in this project yet.
        </Typography>
      )}

      <List>
        {users.map((user) => (
          <ListItem
            key={user.id}
            secondaryAction={
              !user.isCreator && (
                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveUser(user.id)}>
                  <DeleteIcon />
                </IconButton>
              )
            }
          >
            <ListItemAvatar>
              <Avatar src={user.avatar} alt={user.displayName}>
                {user.displayName.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.displayName}
              secondary={
                <>
                  {user.email} • <strong>{user.role}</strong>
                  {user.isCreator && ' • Creator'}
                </>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Search Users Dialog */}
      <Dialog open={openSearchDialog} onClose={() => setOpenSearchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Find Users</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{ ml: 1 }}
              disabled={searchQuery.length < 3}
            >
              Search
            </Button>
          </Box>

          {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}

          {!loading && searchResults.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
              No users found. Try a different search term.
            </Typography>
          )}

          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleSelectUser(user)}
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar} alt={user.displayName}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.displayName}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSearchDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Add User Role Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add User to Project</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1">{selectedUser.displayName}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedUser.email}
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={selectedRole}
                  label="Role"
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                >
                  <MenuItem value="admin">Admin (Full control)</MenuItem>
                  <MenuItem value="editor">Editor (Can edit content)</MenuItem>
                  <MenuItem value="viewer">Viewer (Read-only access)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained" disabled={!selectedUser}>
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification && (
          <Alert onClose={handleCloseNotification} severity={notification.type} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default ProjectRoleManager;
