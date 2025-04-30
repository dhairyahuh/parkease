import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setApiResponse(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      setApiResponse({
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries([...response.headers])
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error (${response.status}): The server is not responding with JSON. Please check server logs.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
      
      // Try the test endpoint as a fallback
      try {
        const testResponse = await fetch(`${API_BASE_URL}/users/test-forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        if (testResponse.ok) {
          setError(prev => prev + '. However, the test route is working, suggesting an issue with the main handler.');
        } else {
          setError(prev => prev + '. The test route also failed, suggesting a server configuration issue.');
        }
      } catch (testErr) {
        setError(prev => prev + '. Could not reach test endpoint either. Server might be down.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            Reset Password
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          {apiResponse && (
            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                API Response Debug Info:
                {JSON.stringify(apiResponse, null, 2)}
              </Typography>
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              Password reset link has been sent to your email!
            </Alert>
          )}

          {!success && (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  'Send Reset Link'
                )}
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Remember your password?{' '}
                  <Link component={RouterLink} to="/login" variant="body2">
                    Back to Login
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}

          {success && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                <Link component={RouterLink} to="/login" variant="body2">
                  Back to Login
                </Link>
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;