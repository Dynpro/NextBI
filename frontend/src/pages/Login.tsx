import { useEffect } from 'react';
import { Box, Button, Paper, Typography, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { isAuthenticated, login, loading, userData } = useAuth();
  const navigate = useNavigate();

  console.log('Login component rendering - Auth state:', { isAuthenticated, loading, userData });

  useEffect(() => {
    console.log('Login useEffect - isAuthenticated changed:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User is authenticated, navigating to home page');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            NextBI
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Data Dashboarding & Visualization
          </Typography>
          <Box sx={{ mt: 4, width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={login}
              sx={{ py: 1.5 }}
            >
              Sign in with Microsoft
            </Button>
          </Box>
          <Typography variant="caption" sx={{ mt: 3, textAlign: 'center' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
