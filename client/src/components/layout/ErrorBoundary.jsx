import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Try to recover by refreshing the component
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="100vh"
          p={3}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 500, 
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but there was an error loading this page. Our team has been notified.
            </Typography>
            <Box mt={3}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </Box>
            {process.env.NODE_ENV === 'development' && (
              <Box mt={4} textAlign="left" sx={{ overflow: 'auto', maxHeight: 200 }}>
                <Typography variant="caption" component="pre" color="error">
                  {this.state.error && this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="caption" component="pre" color="text.secondary">
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;