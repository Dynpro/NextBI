import { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { devLogin } from '../services/authService';

// Safe environment accessor (browser-safe)
const getClientEnv = (key: string, fallback?: string): string | undefined => {
  try {
    if (typeof process !== "undefined" && (process as any).env && (process as any).env[key] !== undefined) {
      return (process as any).env[key];
    }
  } catch (e) {
    // ignore
  }
  if (typeof window !== "undefined") {
    const w = window as any;
    if (w.__env && w.__env[key] !== undefined) return w.__env[key];
    if (w[key] !== undefined) return w[key];
  }
  return fallback;
};

const Login = () => {
  const { isAuthenticated, login, loading, userData, error } = useAuth();
  const navigate = useNavigate();
  const [devError, setDevError] = useState<string | null>(null);
  const DEV_AUTH_ENABLED = getClientEnv('REACT_APP_DEV_AUTH', 'false') === 'true';

  console.log('Login component rendering - Auth state:', { isAuthenticated, loading, userData });

  useEffect(() => {
    console.log('Login useEffect - isAuthenticated changed:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User is authenticated, navigating to home page');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onDevSignIn = async () => {
    setDevError(null);
    try {
      const email = getClientEnv('REACT_APP_DEV_TEST_EMAIL', 'dev@local.test')!;
      const displayName = getClientEnv('REACT_APP_DEV_DISPLAYNAME', 'Developer')!;
      const res = await devLogin({ email, displayName });
      if (res.success) {
        // devLogin dispatches 'nextbi:auth-changed' which AuthContext listens to.
        navigate('/');
      } else {
        setDevError(res.error?.message || JSON.stringify(res.error) || 'Dev login failed');
      }
    } catch (err: any) {
      console.error('Dev sign-in error:', err);
      setDevError(err?.message || 'Unknown error during dev sign-in');
    }
  };

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
            {DEV_AUTH_ENABLED && (
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                size="large"
                onClick={onDevSignIn}
                sx={{ py: 1.5, mt: 2 }}
              >
                Dev sign in (test)
              </Button>
            )}
          </Box>

          {/* Error block with tenant-specific guidance */}
          {(error || devError) && (
            <>
              <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                {devError || error}
              </Typography>

              {/* If tenant-mismatch detected, show concise remediation steps */}
              {(error && error.includes('tenant') || error?.includes('AADSTS50020')) && (
                <Box sx={{ mt: 2, textAlign: 'left' }}>
                  <Typography variant="body2" color="textPrimary">
                    Trouble signing in? The selected account is not part of the application's tenant.
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Options:
                  </Typography>
                  <ol style={{ marginTop: 8 }}>
                    <li style={{ marginBottom: 6 }}>
                      Use an Azure AD account that belongs to the tenant (recommended).
                    </li>
                    <li style={{ marginBottom: 6 }}>
                      Ask the tenant admin to invite your account as a Guest user in Azure AD.
                    </li>
                    <li style={{ marginBottom: 6 }}>
                      For local testing only: enable DEV_AUTH and use the "Dev sign in" button.
                    </li>
                  </ol>
                </Box>
              )}
            </>
          )}

          <Typography variant="caption" sx={{ mt: 3, textAlign: 'center' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
