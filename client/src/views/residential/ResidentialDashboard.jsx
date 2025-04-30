import React, { useState, useEffect } from 'react';
import { residentialService } from '../../services/residentialService';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Divider,
  Alert,
  Snackbar,
  RadioGroup,
  Radio
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PersonIcon from '@mui/icons-material/Person';
import CarIcon from '@mui/icons-material/DirectionsCar';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';

// TabPanel component for tab navigation
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`residential-tabpanel-${index}`}
      aria-labelledby={`residential-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ResidentialDashboard = () => {
  // Helper function to get vehicle number from potentially inconsistent data structure
  const getVehicleNumber = (booking) => {
    if (!booking) return 'N/A';
    
    // Direct access to vehicleDetails object
    if (booking.vehicleDetails) {
      // Case 1: When vehicleDetails has a number property
      if (booking.vehicleDetails.number) {
        return booking.vehicleDetails.number;
      }
      
      // Case 2: When vehicleDetails has a plateNumber property (as per DB schema)
      if (booking.vehicleDetails.plateNumber) {
        return booking.vehicleDetails.plateNumber;
      }
      
      // Case 3: When vehicleDetails has nested structure
      if (typeof booking.vehicleDetails === 'object') {
        // Check within the type property
        if (booking.vehicleDetails.type) {
          if (typeof booking.vehicleDetails.type === 'object') {
            if (booking.vehicleDetails.type.plateNumber) {
              return booking.vehicleDetails.type.plateNumber;
            }
            if (booking.vehicleDetails.type.number) {
              return booking.vehicleDetails.type.number;
            }
          }
        }
      }
      
      // Case 4: When vehicleDetails is a stringified JSON
      if (typeof booking.vehicleDetails === 'string') {
        try {
          const parsed = JSON.parse(booking.vehicleDetails);
          if (parsed.number) return parsed.number;
          if (parsed.plateNumber) return parsed.plateNumber;
          if (parsed.type && parsed.type.plateNumber) return parsed.type.plateNumber;
        } catch (e) {
          // Parsing failed, continue with other checks
        }
      }
    }
    
    // Case 5: When vehicle details are directly at booking level (compatibility with older data)
    if (booking.vehicleNumber) {
      return booking.vehicleNumber;
    }
    
    // Default fallback
    return 'N/A';
  };

  // Helper function to get vehicle type from potentially inconsistent data structure
  const getVehicleType = (booking) => {
    if (!booking) return 'N/A';
    
    // Direct access to vehicleDetails object
    if (booking.vehicleDetails) {
      // Case 1: When vehicleDetails has a type property that's a string
      if (booking.vehicleDetails.type && typeof booking.vehicleDetails.type === 'string') {
        return booking.vehicleDetails.type;
      }
      
      // Case 2: When vehicleDetails has a vehicleType property
      if (booking.vehicleDetails.vehicleType) {
        return booking.vehicleDetails.vehicleType;
      }
      
      // Case 3: When vehicleDetails has nested structures
      if (booking.vehicleDetails.type && typeof booking.vehicleDetails.type === 'object') {
        if (booking.vehicleDetails.type.vehicleType) {
          if (typeof booking.vehicleDetails.type.vehicleType === 'string') {
            return booking.vehicleDetails.type.vehicleType;
          } else if (booking.vehicleDetails.type.vehicleType.type) {
            return booking.vehicleDetails.type.vehicleType.type;
          }
        }
      }
      
      // Case 4: When vehicleDetails is a stringified JSON
      if (typeof booking.vehicleDetails === 'string') {
        try {
          const parsed = JSON.parse(booking.vehicleDetails);
          if (parsed.type && typeof parsed.type === 'string') return parsed.type;
          if (parsed.vehicleType) return parsed.vehicleType;
        } catch (e) {
          // Parsing failed, continue with other checks
        }
      }
    }
    
    // Case 5: When vehicle type is directly at booking level (compatibility with older data)
    if (booking.vehicleType) {
      return booking.vehicleType;
    }
    
    // Default fallback
    return 'N/A';
  };
  
  // State variables
  const [value, setValue] = useState(0); // For tab navigation
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [openSpaceDialog, setOpenSpaceDialog] = useState(false);
  const [openVisitorDialog, setOpenVisitorDialog] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Form states
  const [currentSpace, setCurrentSpace] = useState({
    name: '',
    address: '',
    totalSpots: 1,
    pricePerHour: '',
    vehicleType: 'car',
    features: []
  });
  
  const [newVisitorPass, setNewVisitorPass] = useState({
    visitorName: '',
    vehicleNumber: '',
    duration: '24',
  });
  
  // Form state for booking approval/rejection
  const [approvalForm, setApprovalForm] = useState({
    status: 'approved',
    comment: ''
  });

  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  // Snackbar handler
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show notification
  const showNotification = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Load parking spaces
  useEffect(() => {
    const fetchParkingSpaces = async () => {
      try {
        const data = await residentialService.getParkingSpaces();
        // Check if data has the expected structure
        if (data && data.data && Array.isArray(data.data.parkingSpaces)) {
          setParkingSpaces(data.data.parkingSpaces);
        } else if (data && Array.isArray(data.parkingSpaces)) {
          setParkingSpaces(data.parkingSpaces);
        } else if (data && Array.isArray(data)) {
          setParkingSpaces(data);
        } else {
          // Default to empty array if data structure is unexpected
          setParkingSpaces([]);
          console.warn("Unexpected data structure received from API:", data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching parking spaces:", error);
        setParkingSpaces([]);
        showNotification(error.message || 'Failed to fetch parking spaces', 'error');
        setLoading(false);
      }
    };
    fetchParkingSpaces();
  }, []);

  // Function to fetch bookings - used both on initial load and after updates
  const fetchBookings = async () => {
    try {
      const bookingsData = await residentialService.getBookings();
      // Check if data has the expected structure
      if (bookingsData && Array.isArray(bookingsData)) {
        // Deduplicate bookings using a Map with the booking ID as key
        const uniqueBookingsMap = new Map();
        bookingsData.forEach(booking => {
          uniqueBookingsMap.set(booking._id, booking);
        });
        
        // Convert Map back to array
        const uniqueBookings = Array.from(uniqueBookingsMap.values());
        
        setBookings(uniqueBookings);
        
        // Filter pending bookings
        const pending = uniqueBookings.filter(booking => booking.status === 'pending');
        setPendingBookings(pending);
        
        // Set total bookings count
        setTotalBookings(uniqueBookings.length);
        
        // Calculate total revenue
        const revenue = uniqueBookings
          .filter(booking => booking.status === 'approved' || booking.status === 'completed')
          .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
        setTotalRevenue(revenue);
      } else {
        console.warn("Unexpected data structure from bookings API:", bookingsData);
        setBookings([]);
        setPendingBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showNotification(error.message || 'Failed to fetch bookings', 'error');
    }
  };

  // Load bookings data
  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle form submission for creating/editing parking space
  const handleSubmit = async () => {
    try {
      if (!currentSpace.name || !currentSpace.address || !currentSpace.pricePerHour) {
        showNotification('Please fill in all required fields.', 'error');
        return;
      }

      // Check if coordinates are provided
      if (!currentSpace.coordinates || !Array.isArray(currentSpace.coordinates) || currentSpace.coordinates.length !== 2) {
        showNotification('Please set a valid location for the parking space.', 'error');
        return;
      }

      // Format the data to match the expected schema format
      const formattedSpace = {
        ...currentSpace,
        location: {
          type: 'Point',
          coordinates: [currentSpace.coordinates[1], currentSpace.coordinates[0]], // [longitude, latitude] format
          address: currentSpace.address
        },
        totalSpots: Number(currentSpace.totalSpots) || 1,
        availableSpots: Number(currentSpace.totalSpots) || 1,
        pricePerHour: Number(currentSpace.pricePerHour),
        features: currentSpace.features || [],
        status: 'active' // Set default status to active
      };

      // Remove the standalone coordinates and address as they're now in the location object
      delete formattedSpace.coordinates;
      delete formattedSpace.address;

      let response;
      if (isEditMode) {
        response = await residentialService.updateParkingSpace(currentSpace._id || currentSpace.id, formattedSpace);
        if (response.success && response.parkingSpace) {
          setParkingSpaces(parkingSpaces.map(space => 
            (space._id === response.parkingSpace._id || space.id === response.parkingSpace._id) 
              ? response.parkingSpace 
              : space
          ));
        }
      } else {
        response = await residentialService.createParkingSpace(formattedSpace);
        if (response.success && response.parkingSpace) {
          setParkingSpaces([...parkingSpaces, response.parkingSpace]);
          console.log("New parking space added:", response.parkingSpace);
        }
      }

      setOpenSpaceDialog(false);
      setCurrentSpace({
        name: '',
        address: '',
        totalSpots: 1,
        pricePerHour: '',
        vehicleType: 'car',
        features: []
      });
      showNotification(
        isEditMode ? 'Parking space updated successfully!' : 'Parking space created successfully!'
      );
    } catch (error) {
      console.error("Error submitting parking space:", error);
      showNotification(error.message || 'Failed to save parking space', 'error');
    }
  };

  // Handle parking space deletion
  const handleDelete = async (spaceId) => {
    try {
      await residentialService.deleteParkingSpace(spaceId);
      setParkingSpaces(parkingSpaces.filter(space => space.id !== spaceId));
      showNotification('Parking space deleted successfully!');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  // Toggle parking space availability
  const toggleAvailability = async (spaceId, currentStatus) => {
    try {
      if (!spaceId) {
        showNotification('Unable to update availability: No space ID found', 'error');
        return;
      }

      // Convert between 'active'/'inactive' status and true/false isAvailable
      // The backend expects a status string ('active' or 'inactive')
      const isActive = currentStatus === 'active';
      const newStatus = isActive ? 'inactive' : 'active';
      
      console.log(`Toggling space ${spaceId} from ${currentStatus} to ${newStatus}`);
      
      const response = await residentialService.toggleAvailability(spaceId, !isActive);
      
      if (response.success && response.parkingSpace) {
        // Update the local state with the returned parking space
        setParkingSpaces(parkingSpaces.map(space =>
          (space._id === spaceId || space.id === spaceId) ? response.parkingSpace : space
        ));
        showNotification('Availability updated successfully!');
      } else {
        // If the response doesn't contain the updated space, do a simpler update
        setParkingSpaces(parkingSpaces.map(space =>
          (space._id === spaceId || space.id === spaceId) 
            ? { ...space, status: newStatus } 
            : space
        ));
        showNotification('Availability updated successfully!');
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      showNotification(error.message || 'Failed to update availability', 'error');
    }
  };

  // Handler for opening the add/edit space dialog
  const handleOpenSpaceDialog = (space = null) => {
    if (space) {
      setCurrentSpace(space);
      setIsEditMode(true);
    } else {
      setCurrentSpace({
        name: '',
        address: '',
        totalSpots: 1,
        pricePerHour: '',
        vehicleType: 'car',
        features: []
      });
      setIsEditMode(false);
    }
    setOpenSpaceDialog(true);
  };

  // Handler for closing the space dialog
  const handleCloseSpaceDialog = () => {
    setOpenSpaceDialog(false);
  };

  // Handler for form field changes
  const handleSpaceChange = (e) => {
    const { name, value } = e.target;
    setCurrentSpace({ ...currentSpace, [name]: value });
  };

  // Handler for feature checkboxes
  const handleFeatureToggle = (feature) => {
    const features = [...currentSpace.features];
    const index = features.indexOf(feature);
    
    if (index === -1) {
      features.push(feature);
    } else {
      features.splice(index, 1);
    }
    
    setCurrentSpace({ ...currentSpace, features });
  };

  // Update booking status
  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      // In a real implementation, this would be an API call:
      // await fetch(`/api/bookings/${bookingId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status })
      // });
      
      // Simulate API response
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      ));
      
      showNotification(`Booking ${status === 'confirmed' ? 'confirmed' : 'cancelled'} successfully!`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      showNotification('Failed to update booking status. Please try again.', 'error');
    }
  };

  // Visitor pass handlers
  const handleOpenVisitorDialog = () => {
    setOpenVisitorDialog(true);
  };

  const handleCloseVisitorDialog = () => {
    setOpenVisitorDialog(false);
    setNewVisitorPass({
      visitorName: '',
      vehicleNumber: '',
      duration: '24',
    });
  };

  const handleSubmitVisitorPass = () => {
    // Implement visitor pass creation logic
    console.log('Adding new visitor pass:', newVisitorPass);
    showNotification('Visitor pass issued successfully!');
    handleCloseVisitorDialog();
  };

  // Open approval modal
  const handleOpenApprovalModal = (booking) => {
    setSelectedBooking(booking);
    setApprovalForm({
      status: 'approved',
      comment: ''
    });
    setApprovalModalOpen(true);
  };

  // Close approval modal
  const handleCloseApprovalModal = () => {
    setApprovalModalOpen(false);
  };

  // Handle approval form change
  const handleApprovalFormChange = (e) => {
    const { name, value } = e.target;
    setApprovalForm({ ...approvalForm, [name]: value });
  };

  // Submit booking approval/rejection
  const handleSubmitBookingStatus = async () => {
    try {
      if (!selectedBooking || !selectedBooking._id) {
        showNotification('Booking ID not found', 'error');
        return;
      }

      console.log(`Updating booking ${selectedBooking._id} status to ${approvalForm.status}`);
      
      const response = await residentialService.updateBookingStatus(
        selectedBooking._id,
        approvalForm.status,
        approvalForm.comment
      );
      
      if (response && response.success) {
        showNotification(`Booking ${approvalForm.status === 'approved' ? 'approved' : 'rejected'} successfully`);
        
        // Update the specific booking in the state
        const updatedBookings = bookings.map(booking => 
          booking._id === selectedBooking._id ? { ...booking, status: approvalForm.status } : booking
        );
        
        setBookings(updatedBookings);
        
        // Update pending bookings list by filtering out the updated booking
        setPendingBookings(updatedBookings.filter(booking => booking.status === 'pending'));
        
        // Refresh the bookings to ensure we have the latest data
        setTimeout(() => {
          fetchBookings();
        }, 1000);
      } else {
        showNotification('Failed to update booking status', 'error');
      }
      
      handleCloseApprovalModal();
      
    } catch (error) {
      console.error('Error updating booking status:', error);
      showNotification(error.message || 'Failed to update booking status', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Residential Parking Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your private parking spaces, bookings, and visitor passes.
          </Typography>
        </Box>

        {/* Revenue Stats */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocalParkingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Spaces</Typography>
                <Typography variant="h4">{parkingSpaces.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <EventAvailableIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Bookings</Typography>
                <Typography variant="h4">{totalBookings}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MonetizationOnIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                <Typography variant="h4">₹{totalRevenue.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Visitor Management</Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  size="small"
                  onClick={handleOpenVisitorDialog}
                  sx={{ mt: 1 }}
                >
                  Issue Pass
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleTabChange} aria-label="residential dashboard tabs">
            <Tab label="My Parking Spaces" id="residential-tab-0" aria-controls="residential-tabpanel-0" />
            <Tab label="Bookings" id="residential-tab-1" aria-controls="residential-tabpanel-1" />
            <Tab label="Map View" id="residential-tab-2" aria-controls="residential-tabpanel-2" />
          </Tabs>
        </Box>

        {/* Parking Spaces Tab */}
        <TabPanel value={value} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Your Parking Spaces</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenSpaceDialog()}
            >
              Add New Space
            </Button>
          </Box>
          
          {parkingSpaces.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              You haven't added any parking spaces yet. Click "Add New Space" to get started.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {parkingSpaces.map((space, index) => (
                <Grid item xs={12} md={6} key={space?._id || space?.id || `space-${index}`}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="h3">{space?.name || 'Unnamed Space'}</Typography>
                        <Chip 
                          label={space?.status === 'active' ? 'Active' : 'Inactive'} 
                          color={space?.status === 'active' ? 'success' : 'default'}
                        />
                      </Box>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {space?.location?.address || space?.address || 'No address'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {Array.isArray(space?.features) && space?.features.length > 0 ? (
                          space.features.map((feature) => (
                            <Chip 
                              key={feature} 
                              label={feature.charAt(0).toUpperCase() + feature.slice(1)} 
                              size="small"
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">No special features</Typography>
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Price: ₹{space?.pricePerHour || 'N/A'}/hour
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Type: {space?.vehicleType ? space.vehicleType.charAt(0).toUpperCase() + space.vehicleType.slice(1) : 'Car'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Spots: {space?.totalSpots || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Available: {space?.availableSpots || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={space?.status === 'active'} 
                              onChange={() => toggleAvailability(space?._id || space?.id, space?.status)}
                              color="primary"
                            />
                          }
                          label={space?.status === 'active' ? 'Available' : 'Unavailable'}
                        />
                        <Box>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenSpaceDialog(space)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error"
                            onClick={() => handleDelete(space?._id || space?.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Bookings Tab */}
        <TabPanel value={value} index={1}>
          <Typography variant="h5" gutterBottom>Booking Requests & History</Typography>
          
          {bookings.length === 0 ? (
            <Alert severity="info">
              You don't have any bookings yet. Once users book your spaces, they will appear here.
            </Alert>
          ) : (
            <>
              {/* Pending Bookings */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Pending Requests</Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Parking Space</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Vehicle Details</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No pending booking requests</TableCell>
                      </TableRow>
                    ) : (
                      pendingBookings.map((booking) => (
                        <TableRow key={booking._id || booking.id}>
                          <TableCell>{booking.parking?.name || booking.parkingSpace || 'Unknown'}</TableCell>
                          <TableCell>{booking.user?.name || booking.user || 'Unknown'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              Number: {getVehicleNumber(booking)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Type: {getVehicleType(booking)}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(booking.startTime).toLocaleString()}</TableCell>
                          <TableCell>{new Date(booking.endTime).toLocaleString()}</TableCell>
                          <TableCell>₹{booking.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleOpenApprovalModal(booking)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Confirmed/Past Bookings */}
              <Typography variant="h6" gutterBottom>Confirmed & Past Bookings</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Vehicle Number</TableCell>
                      <TableCell>Parking Space</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Total Price</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.filter(b => b.status !== 'pending').map((booking) => (
                      <TableRow key={booking._id || booking.id}>
                        <TableCell>
                          {typeof booking.user === 'object' ? booking.user?.name || 'Unknown' : booking.user || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {getVehicleNumber(booking)}
                        </TableCell>
                        <TableCell>
                          {typeof booking.parking === 'object' ? booking.parking?.name : 
                           typeof booking.parkingSpace === 'object' ? booking.parkingSpace?.name : 
                           booking.parkingSpace || 'Unknown'}
                        </TableCell>
                        <TableCell>{new Date(booking.startTime).toLocaleString()}</TableCell>
                        <TableCell>{new Date(booking.endTime).toLocaleString()}</TableCell>
                        <TableCell>₹{booking.totalPrice && typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : booking.amount && typeof booking.amount === 'number' ? booking.amount.toFixed(2) : '0.00'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'} 
                            color={booking.status === 'approved' ? 'success' : 
                                  booking.status === 'rejected' ? 'error' : 
                                  booking.status === 'confirmed' ? 'success' : 
                                  booking.status === 'cancelled' ? 'error' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {bookings.filter(b => b.status !== 'pending').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No confirmed or past bookings</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </TabPanel>

        {/* Map View Tab */}
        <TabPanel value={value} index={2}>
          <Typography variant="h5" gutterBottom>Your Parking Locations</Typography>
          
          <Box sx={{ height: 500, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            {parkingSpaces.length > 0 ? (
              <MapContainer
                center={parkingSpaces[0]?.location?.coordinates ? 
                  [parkingSpaces[0].location.coordinates[1], parkingSpaces[0].location.coordinates[0]] : 
                  [51.505, -0.09]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {parkingSpaces.filter(space => space?.location?.coordinates && Array.isArray(space?.location?.coordinates) && space.location.coordinates.length >= 2).map((space) => (
                  <Marker 
                    key={space?._id || space?.id || Math.random().toString(36).substr(2, 9)} 
                    position={[space.location.coordinates[1], space.location.coordinates[0]]}
                  >
                    <Popup>
                      <Typography variant="subtitle2">{space?.name || 'Unnamed Space'}</Typography>
                      <Typography variant="body2">{space?.location?.address || space?.address || 'No address'}</Typography>
                      <Typography variant="body2">
                        Price: ₹{typeof space?.pricePerHour === 'number' ? space.pricePerHour.toFixed(2) : 'N/A'}/hour
                      </Typography>
                      <Typography variant="body2">
                        Available: {space?.availableSpots !== undefined ? `${space.availableSpots}/${space.totalSpots || 0}` : 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        Status: {space?.status === 'active' ? 'Available' : 'Unavailable'}
                      </Typography>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%" bgcolor="grey.100" borderRadius={2}>
                <Typography variant="body1" color="text.secondary">
                  Add parking spaces to view them on the map
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Add/Edit Parking Space Dialog */}
        <Dialog open={openSpaceDialog} onClose={handleCloseSpaceDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{isEditMode ? 'Edit Parking Space' : 'Add New Parking Space'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Space Name"
                name="name"
                value={currentSpace.name}
                onChange={handleSpaceChange}
                fullWidth
                required
              />
              <TextField
                label="Address"
                name="address"
                value={currentSpace.address}
                onChange={handleSpaceChange}
                fullWidth
                required
              />
              
              {/* Location Selection Section */}
              <Typography variant="subtitle2" gutterBottom>Parking Location</Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  name="locationType"
                  value={currentSpace.locationType || "manual"}
                  onChange={(e) => setCurrentSpace({
                    ...currentSpace,
                    locationType: e.target.value
                  })}
                >
                  <FormControlLabel 
                    value="current" 
                    control={<Radio />} 
                    label="Use my current location" 
                  />
                  <FormControlLabel 
                    value="manual" 
                    control={<Radio />} 
                    label="Enter location manually" 
                  />
                </RadioGroup>
              </FormControl>
              
              {currentSpace.locationType === "current" ? (
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setCurrentSpace({
                            ...currentSpace,
                            coordinates: [position.coords.latitude, position.coords.longitude],
                            locationFound: true
                          });
                          showNotification('Current location detected successfully!');
                        },
                        (error) => {
                          console.error('Error getting location:', error);
                          showNotification('Failed to get current location. Please try again or enter manually.', 'error');
                        }
                      );
                    } else {
                      showNotification('Geolocation is not supported by your browser. Please enter location manually.', 'error');
                    }
                  }}
                >
                  {currentSpace.locationFound ? 'Update Current Location' : 'Get Current Location'}
                </Button>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Latitude"
                      name="lat"
                      type="number"
                      value={currentSpace.coordinates ? currentSpace.coordinates[0] : ''}
                      onChange={(e) => setCurrentSpace({
                        ...currentSpace,
                        coordinates: [parseFloat(e.target.value), currentSpace.coordinates ? currentSpace.coordinates[1] : 0]
                      })}
                      fullWidth
                      inputProps={{ step: 0.000001 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Longitude"
                      name="lng"
                      type="number"
                      value={currentSpace.coordinates ? currentSpace.coordinates[1] : ''}
                      onChange={(e) => setCurrentSpace({
                        ...currentSpace,
                        coordinates: [currentSpace.coordinates ? currentSpace.coordinates[0] : 0, parseFloat(e.target.value)]
                      })}
                      fullWidth
                      inputProps={{ step: 0.000001 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<LocationOnIcon />}
                      onClick={async () => {
                        try {
                          if (!currentSpace.address) {
                            showNotification('Please enter an address first', 'error');
                            return;
                          }
                          
                          // Show processing state
                          showNotification('Searching for coordinates...', 'info');
                          
                          // Use Nominatim OpenStreetMap service for geocoding (free and open source)
                          const encodedAddress = encodeURIComponent(currentSpace.address);
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
                            {
                              headers: {
                                'Accept': 'application/json',
                                'User-Agent': 'ParkEase Residential App' // Required by Nominatim ToS
                              }
                            }
                          );
                          
                          const data = await response.json();
                          
                          if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            setCurrentSpace({
                              ...currentSpace,
                              coordinates: [parseFloat(lat), parseFloat(lon)],
                              locationFound: true
                            });
                            showNotification('Location coordinates found successfully!', 'success');
                          } else {
                            showNotification('Could not find coordinates for this address. Please try a more specific address.', 'warning');
                          }
                        } catch (error) {
                          console.error('Error finding location from address:', error);
                          showNotification('Error finding location. Please try again or enter coordinates manually.', 'error');
                        }
                      }}
                      fullWidth
                    >
                      Find Location from Address
                    </Button>
                  </Grid>
                </Grid>
              )}
              
              {currentSpace.locationFound && (
                <Alert severity="success" icon={<LocationOnIcon />}>
                  Location set successfully!
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Price per Hour (₹)"
                    name="pricePerHour"
                    type="number"
                    value={currentSpace.pricePerHour}
                    onChange={handleSpaceChange}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      name="vehicleType"
                      value={currentSpace.vehicleType}
                      label="Vehicle Type"
                      onChange={handleSpaceChange}
                    >
                      <MenuItem value="car">Car</MenuItem>
                      <MenuItem value="motorcycle">Motorcycle</MenuItem>
                      <MenuItem value="ev">Electric Vehicle</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Features:</Typography>
              <Grid container spacing={1}>
                {['covered', 'security', 'charging', 'disabled', '24/7'].map((feature) => (
                  <Grid item key={feature}>
                    <Chip 
                      label={feature.charAt(0).toUpperCase() + feature.slice(1)}
                      onClick={() => handleFeatureToggle(feature)}
                      color={currentSpace.features.includes(feature) ? 'primary' : 'default'}
                      variant={currentSpace.features.includes(feature) ? 'filled' : 'outlined'}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSpaceDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {isEditMode ? 'Update' : 'Add'} Space
            </Button>
          </DialogActions>
        </Dialog>

        {/* Issue Visitor Pass Dialog */}
        <Dialog open={openVisitorDialog} onClose={handleCloseVisitorDialog}>
          <DialogTitle>Issue Visitor Pass</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Visitor Name"
                value={newVisitorPass.visitorName}
                onChange={(e) => setNewVisitorPass({ ...newVisitorPass, visitorName: e.target.value })}
                fullWidth
              />
              <TextField
                label="Vehicle Number"
                value={newVisitorPass.vehicleNumber}
                onChange={(e) => setNewVisitorPass({ ...newVisitorPass, vehicleNumber: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={newVisitorPass.duration}
                  label="Duration"
                  onChange={(e) => setNewVisitorPass({ ...newVisitorPass, duration: e.target.value })}
                >
                  <MenuItem value="24">24 Hours</MenuItem>
                  <MenuItem value="48">48 Hours</MenuItem>
                  <MenuItem value="72">72 Hours</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseVisitorDialog}>Cancel</Button>
            <Button onClick={handleSubmitVisitorPass} variant="contained" color="primary">
              Issue Pass
            </Button>
          </DialogActions>
        </Dialog>

        {/* Booking Approval Modal */}
        <Dialog open={approvalModalOpen} onClose={handleCloseApprovalModal} maxWidth="sm" fullWidth>
          <DialogTitle>Review Booking</DialogTitle>
          <DialogContent>
            {selectedBooking && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">User:</Typography>
                    <Typography variant="body1">{selectedBooking.user?.name || 'Unknown'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Parking Space:</Typography>
                    <Typography variant="body1">{selectedBooking.parking?.name || 'Unknown'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Start Time:</Typography>
                    <Typography variant="body1">{new Date(selectedBooking.startTime).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">End Time:</Typography>
                    <Typography variant="body1">{new Date(selectedBooking.endTime).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Duration:</Typography>
                    <Typography variant="body1">{selectedBooking.duration} hours</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Total Price:</Typography>
                    <Typography variant="body1">₹{selectedBooking.totalPrice?.toFixed(2) || '0.00'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Vehicle Details:</Typography>
                    <Typography variant="body1">
                      Number: {getVehicleNumber(selectedBooking)}, Type: {getVehicleType(selectedBooking)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Decision:</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item>
                      <Button
                        variant={approvalForm.status === 'approved' ? 'contained' : 'outlined'}
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setApprovalForm({ ...approvalForm, status: 'approved' })}
                      >
                        Approve
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant={approvalForm.status === 'rejected' ? 'contained' : 'outlined'}
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setApprovalForm({ ...approvalForm, status: 'rejected' })}
                      >
                        Reject
                      </Button>
                    </Grid>
                  </Grid>
                </FormControl>

                <TextField
                  label="Comment (Optional)"
                  name="comment"
                  value={approvalForm.comment}
                  onChange={handleApprovalFormChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Explain your decision or add any notes..."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseApprovalModal}>Cancel</Button>
            <Button 
              onClick={handleSubmitBookingStatus} 
              variant="contained" 
              color={approvalForm.status === 'approved' ? 'success' : 'error'}
            >
              {approvalForm.status === 'approved' ? 'Approve' : 'Reject'} Booking
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ResidentialDashboard;