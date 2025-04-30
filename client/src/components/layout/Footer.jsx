import { Box, Container, Grid, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              About ParkEase
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Smart parking management system making parking easier for everyone.
              Find, book, and manage parking spaces efficiently.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <Link
              component={RouterLink}
              to="/search"
              color="text.secondary"
              display="block"
            >
              Find Parking
            </Link>
            <Link
              component={RouterLink}
              to="/register"
              color="text.secondary"
              display="block"
            >
              Register as Operator
            </Link>
            <Link
              component={RouterLink}
              to="/help"
              color="text.secondary"
              display="block"
            >
              Help & Support
            </Link>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: support@parkease.com
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: (555) 123-4567
            </Typography>
          </Grid>
        </Grid>
        <Box mt={5}>
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' ParkEase. All rights reserved.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;