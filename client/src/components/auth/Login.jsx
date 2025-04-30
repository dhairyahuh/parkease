import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../layout/Navbar';
import { API_BASE_URL } from '../../config/config';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' // Default role
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Use auth context to login
      login(data.token, data.user);
      
      // Redirect based on user role
      switch (data.user.role) {
        case 'operator':
          navigate('/operator/dashboard');
          break;
        case 'residential':
          navigate('/residential/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'operator':
        return 'Parking Operator';
      case 'residential':
        return 'Residential Owner';
      default:
        return 'Regular User';
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
            Sign in
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-select-label">Account Type</InputLabel>
              <Select
                labelId="role-select-label"
                id="role"
                name="role"
                value={formData.role}
                label="Account Type"
                onChange={handleChange}
                disabled={isLoading}
              >
                <MenuItem value="user">{getRoleName('user')}</MenuItem>
                <MenuItem value="residential">{getRoleName('residential')}</MenuItem>
                <MenuItem value="operator">{getRoleName('operator')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 1 }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Box>
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
                'Sign In'
              )}
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" variant="body2">
                  Register
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;