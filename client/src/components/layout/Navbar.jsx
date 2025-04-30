import { useState, useEffect, createContext, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LocalParkingIcon from '@mui/icons-material/LocalParking';

// Create auth context
export const AuthContext = createContext();

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    const storedUserName = localStorage.getItem('userName');
    const storedUserId = localStorage.getItem('userId');
    
    setIsAuthenticated(!!token);
    
    if (token) {
      setUserRole(storedRole || null);
      setUserName(storedUserName || '');
      setUserId(storedUserId || null);
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.name || '');
    localStorage.setItem('userId', user._id || '');
    
    setIsAuthenticated(true);
    setUserRole(user.role);
    setUserName(user.name || '');
    setUserId(user._id || '');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userRole,
      userName,
      userId,
      login, 
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, userRole, userName, logout } = useAuth();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/');
  };

  const getNavigationItems = () => {
    if (!isAuthenticated) {
      return [
        { label: 'Home', path: '/' },
        { label: 'Find Parking', path: '/search' }
      ];
    }

    switch (userRole) {
      case 'operator':
        return [
          { label: 'Dashboard', path: '/operator' },
          { label: 'My Spaces', path: '/operator/spaces' },
          { label: 'Bookings', path: '/operator/bookings' },
        ];
      case 'residential':
        return [
          { label: 'Dashboard', path: '/residential' },
          { label: 'My Spaces', path: '/residential/spaces' },
          { label: 'Bookings', path: '/residential/bookings' },
        ];
      default: // regular user
        return [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Find Parking', path: '/search' },
          { label: 'My Bookings', path: '/bookings' },
        ];
    }
  };

  const navItems = getNavigationItems();
  
  const getCurrentRoleLabel = () => {
    switch (userRole) {
      case 'operator':
        return 'Parking Operator';
      case 'residential':
        return 'Residential Owner';
      default:
        return 'User';
    }
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <LocalParkingIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            PARKEASE
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={handleCloseNavMenu}
                  component={RouterLink}
                  to={item.path}
                >
                  <Typography textAlign="center">{item.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <LocalParkingIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            PARKEASE
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            {isAuthenticated && (
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mr: 2, 
                  display: { xs: 'none', md: 'flex' },
                  bgcolor: 'rgba(255,255,255,0.1)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1
                }}
              >
                {getCurrentRoleLabel()}
              </Typography>
            )}

            {isAuthenticated ? (
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt={userName} src="/" />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <Typography sx={{ p: 2, fontSize: '14px', fontWeight: 'bold' }}>
                    {userName}
                  </Typography>
                  <Typography sx={{ px: 2, pb: 1, fontSize: '12px', color: 'text.secondary' }}>
                    {getCurrentRoleLabel()}
                  </Typography>
                  <Divider />
                  <MenuItem
                    component={RouterLink}
                    to="/profile"
                    onClick={handleCloseUserMenu}
                  >
                    <Typography textAlign="center">My Profile</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={handleLogout}
                  >
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    component={RouterLink}
                    to="/login"
                    onClick={handleCloseUserMenu}
                  >
                    <Typography textAlign="center">Switch Account</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="secondary"
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  color="inherit"
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;