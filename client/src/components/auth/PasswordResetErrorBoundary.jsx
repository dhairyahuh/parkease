import React from 'react';
import { Container, Paper, Typography, Box, Alert, Button } from '@mui/material';

class PasswordResetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error("Error in Password Reset component:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
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
                Something Went Wrong
              </Typography>
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                There was an error loading the password reset page. Please try again later.
              </Alert>
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="textSecondary" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error && this.state.error.toString()}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                sx={{ mt: 3 }}
                onClick={() => window.location.href = '/login'}
              >
                Return to Login
              </Button>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default PasswordResetErrorBoundary;