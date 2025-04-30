import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { API_BASE_URL } from '../../config/config';

const ResetPassword = () => {
  console.log('ResetPassword component rendering');
  const navigate = useNavigate();
  const location = useLocation();
  console.log('Current location:', location);
  
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    try {
      // Extract token from URL params
      const searchParams = new URLSearchParams(location.search);
      const resetToken = searchParams.get('token');
      console.log('Token from URL:', resetToken);
      
      if (!resetToken) {
        console.log('No token found in URL, setting tokenError to true');
        setTokenError(true);
      } else {
        console.log('Token found, setting token state');
        setToken(resetToken);
      }
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('An error occurred while processing the reset link.');
      setTokenError(true);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: The server is not responding correctly. Please try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render a simple message first to verify component is loading
  console.log('Rendering ResetPassword component, tokenError:', tokenError);
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            {tokenError ? 'Invalid Reset Link' : 'Reset Your Password'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          {tokenError && (
            <>
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                The password reset link is invalid or has expired.
              </Alert>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2">
                  <Link component={RouterLink} to="/forgot-password" variant="body2">
                    Request a new password reset link
                  </Link>
                </Typography>
              </Box>
            </>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              Your password has been successfully reset! Redirecting to login...
            </Alert>
          )}

          {!tokenError && !success && (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Reset Password'
                )}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;