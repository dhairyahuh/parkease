import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../layout/Navbar';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // default role
  });
  const [error, setError] = useState('');

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

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!['user', 'operator', 'residential'].includes(formData.role)) {
      setError('Please select a valid role');
      return;
    }

    try {
      const response = await fetch('http://localhost:5002/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Use auth context to login
      login(data.token, data.user.role);
      
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
            Register
          </Typography>
          {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              required
              fullWidth
              margin="normal"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              required
              fullWidth
              margin="normal"
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              required
              fullWidth
              margin="normal"
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              required
              fullWidth
              margin="normal"
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="operator">Operator</MenuItem>
                <MenuItem value="residential">Residential</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Register
            </Button>
          </Box>

        </Paper>
      </Box>
    </Container>
  );
};

export default Register;