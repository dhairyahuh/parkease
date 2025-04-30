import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import EvStationIcon from '@mui/icons-material/EvStation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../components/layout/Navbar';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';

const AccountSettings = () => {
  const { isAuthenticated, userRoles, primaryRole, userName, addRole, switchRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();

  // Load user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userService.getUserProfile();
        if (response && response.data) {
          setUserProfile(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setNotification({
          open: true,
          message: 'Failed to load user profile',
          severity: 'error'
        });
      }
    };

    if (isAuthenticated) {
      fetchUserProfile();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleAddRole = async (role) => {
    setLoading(true);
    try {
      const success = await addRole(role);
      if (success) {
        setNotification({
          open: true,
          message: `Successfully added ${role} role to your account`,
          severity: 'success'
        });
      } else {
        throw new Error('Failed to add role');
      }
    } catch (error) {
      setNotification({
        open: true,
        message: `Error adding role: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async (role) => {
    setLoading(true);
    try {
      const success = await switchRole(role);
      if (success) {
        setNotification({
          open: true,
          message: `Switched to ${role} dashboard`,
          severity: 'success'
        });
        
        // Navigate to the appropriate dashboard
        switch (role) {
          case 'operator':
            navigate('/operator/dashboard');
            break;
          case 'residential':
            navigate('/residential/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        throw new Error('Failed to switch role');
      }
    } catch (error) {
      setNotification({
        open: true,
        message: `Error switching role: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleUpdateVehicle = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const vehicleData = {
        vehicleNumber: formData.get('vehicleNumber'),
        vehicleType: formData.get('vehicleType')
      };

      const response = await userService.updateProfile(vehicleData);
      if (response && response.data) {
        setUserProfile(response.data.user);
        setNotification({
          open: true,
          message: 'Vehicle information updated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating vehicle information:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to update vehicle information',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'operator':
        return <BusinessIcon />;
      case 'residential':
        return <HomeIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getVehicleTypeIcon = (type) => {
    switch (type) {
      case 'motorcycle':
        return <TwoWheelerIcon />;
      case 'ev':
        return <EvStationIcon />;
      default:
        return <DirectionsCarIcon />;
    }
  };

  const availableRoles = [
    { 
      id: 'user', 
      name: 'User',
      description: 'Search for and book parking spaces',
      icon: <PersonIcon fontSize="large" />
    },
    { 
      id: 'residential', 
      name: 'Residential Owner',
      description: 'List private residential parking spaces such as driveways and garages',
      icon: <HomeIcon fontSize="large" />
    },
    { 
      id: 'operator', 
      name: 'Parking Operator',
      description: 'Manage commercial parking lots and garages',
      icon: <BusinessIcon fontSize="large" />
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Account Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your account roles and settings
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Vehicle Information Section */}
        <Typography variant="h5" gutterBottom>
          Vehicle Information
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Update your vehicle details for easier booking
        </Typography>

        <Box component="form" onSubmit={handleUpdateVehicle} sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="vehicleNumber"
                label="Vehicle Number"
                fullWidth
                defaultValue={userProfile?.vehicleNumber || ''}
                required
                placeholder="Enter your vehicle number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  name="vehicleType"
                  defaultValue={userProfile?.vehicleType || 'car'}
                  label="Vehicle Type"
                >
                  <MenuItem value="car">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DirectionsCarIcon sx={{ mr: 1 }} /> Car
                    </Box>
                  </MenuItem>
                  <MenuItem value="motorcycle">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TwoWheelerIcon sx={{ mr: 1 }} /> Motorcycle
                    </Box>
                  </MenuItem>
                  <MenuItem value="ev">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EvStationIcon sx={{ mr: 1 }} /> Electric Vehicle
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Vehicle Information'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Your Roles
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {userRoles.map((role) => (
            <Grid item xs={12} sm={6} md={4} key={role}>
              <Card 
                variant="outlined"
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  ...(role === primaryRole && {
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }),
                }}
              >
                {role === primaryRole && (
                  <Chip 
                    label="Primary"
                    color="primary"
                    size="small"
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8 
                    }} 
                  />
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    {getRoleIcon(role)}
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {availableRoles.find(r => r.id === role)?.description || ''}
                  </Typography>
                </CardContent>
                <CardActions>
                  {role !== primaryRole && (
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => handleSwitchRole(role)}
                      disabled={loading}
                    >
                      Switch to This Role
                    </Button>
                  )}
                  {role === primaryRole && (
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="primary"
                      disabled
                    >
                      Current Role
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Available Roles
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Add additional roles to your account to access different features
        </Typography>

        <Grid container spacing={3}>
          {availableRoles.filter(role => !userRoles.includes(role.id)).map((role) => (
            <Grid item xs={12} sm={6} md={4} key={role.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    {role.icon}
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {role.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => handleAddRole(role.id)}
                    disabled={loading}
                  >
                    Add This Role
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {availableRoles.filter(role => !userRoles.includes(role.id)).length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You have all available roles already assigned to your account.
          </Alert>
        )}
      </Paper>

      {loading && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            zIndex: 9999 
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AccountSettings;