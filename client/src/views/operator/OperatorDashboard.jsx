import { useState, useEffect } from 'react';
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
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  FormHelperText,
  Chip,
  IconButton,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Snackbar,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  LocalParking as LocalParkingIcon,
  MonetizationOn as MonetizationOnIcon,
  Timeline as TimelineIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Block as BlockIcon,
  LocationOn as LocationOnIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import operatorService from '../../services/operatorService';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Tab Panel component for the dashboard tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`operator-tabpanel-${index}`}
      aria-labelledby={`operator-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OperatorDashboard = () => {
  // Helper function to get vehicle number from potentially inconsistent data structure
  const getVehicleNumber = (booking) => {
    if (!booking) return 'N/A';
    
    // Direct access to the new flattened structure
    if (booking.vehicleDetails && booking.vehicleDetails.plateNumber) {
      return booking.vehicleDetails.plateNumber;
    }
    
    // Fallback checks for older data structures
    if (booking.vehicleDetails) {
      // Check for number property
      if (booking.vehicleDetails.number) {
        return booking.vehicleDetails.number;
      }
      
      // Check for nested type structure
      if (booking.vehicleDetails.type) {
        if (typeof booking.vehicleDetails.type === 'object' && booking.vehicleDetails.type.plateNumber) {
          return booking.vehicleDetails.type.plateNumber;
        }
      }
      
      // Check for stringified JSON
      if (typeof booking.vehicleDetails === 'string') {
        try {
          const parsed = JSON.parse(booking.vehicleDetails);
          if (parsed.plateNumber) return parsed.plateNumber;
          if (parsed.number) return parsed.number;
          if (parsed.type && parsed.type.plateNumber) return parsed.type.plateNumber;
        } catch (e) {
          // Parsing failed, continue with other checks
        }
      }
    }
    
    // Direct property at booking level (for backward compatibility)
    if (booking.vehicleNumber) {
      return booking.vehicleNumber;
    }
    
    return 'N/A';
  };

  // Helper function to get vehicle type from potentially inconsistent data structure
  const getVehicleType = (booking) => {
    if (!booking) return 'N/A';
    
    // Direct access to the new flattened structure
    if (booking.vehicleDetails && booking.vehicleDetails.vehicleType) {
      return booking.vehicleDetails.vehicleType;
    }
    
    // Fallback checks for older data structures
    if (booking.vehicleDetails) {
      // Check for type property as string
      if (booking.vehicleDetails.type && typeof booking.vehicleDetails.type === 'string') {
        return booking.vehicleDetails.type;
      }
      
      // Check for nested type structure
      if (booking.vehicleDetails.type && typeof booking.vehicleDetails.type === 'object') {
        if (booking.vehicleDetails.type.vehicleType) {
          return booking.vehicleDetails.type.vehicleType;
        }
      }
      
      // Check for stringified JSON
      if (typeof booking.vehicleDetails === 'string') {
        try {
          const parsed = JSON.parse(booking.vehicleDetails);
          if (parsed.vehicleType) return parsed.vehicleType;
          if (parsed.type && typeof parsed.type === 'string') return parsed.type;
          if (parsed.type && parsed.type.vehicleType) return parsed.type.vehicleType;
        } catch (e) {
          // Parsing failed, continue with other checks
        }
      }
    }
    
    // Direct property at booking level (for backward compatibility)
    if (booking.vehicleType) {
      return booking.vehicleType;
    }
    
    return 'N/A';
  };

  // State variables
  const [value, setValue] = useState(0); // For tab navigation
  const [parkingLots, setParkingLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [lotFormOpen, setLotFormOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [timeframe, setTimeframe] = useState('month');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form state for lot
  const [lotForm, setLotForm] = useState({
    name: '',
    address: '',
    totalSpots: 10,
    pricePerHour: 5,
    features: [],
    locationType: 'manual',
    coordinates: null,
    locationFound: false
  });

  // Form state for booking approval/rejection
  const [approvalForm, setApprovalForm] = useState({
    status: 'approved',
    comment: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  // Show notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Fetch parking lots
  const fetchParkingLots = async () => {
    try {
      setLoading(true);
      const response = await operatorService.getOperatorLots();
      if (response && response.data && response.data.parkingLots) {
        setParkingLots(response.data.parkingLots);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      showNotification(error.message || 'Failed to fetch parking lots', 'error');
      setLoading(false);
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      const response = await operatorService.getOperatorBookings();
      if (response && response.data && response.data.bookings) {
        const allBookings = response.data.bookings;
        setBookings(allBookings);
        
        // Filter out pending bookings
        const pending = allBookings.filter(booking => booking.status === 'pending');
        setPendingBookings(pending);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showNotification(error.message || 'Failed to fetch bookings', 'error');
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await operatorService.getOperatorAnalytics(timeframe);
      if (response && response.data) {
        setAnalytics(response.data);
      }
      setAnalyticsLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showNotification(error.message || 'Failed to fetch analytics', 'error');
      setAnalyticsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchParkingLots();
    fetchBookings();
  }, []);

  // Load analytics when timeframe changes
  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  // Open lot form dialog
  const handleOpenLotForm = (lot = null) => {
    if (lot) {
      // Edit mode
      setLotForm({
        name: lot.name,
        address: lot.location?.address || '',
        totalSpots: lot.totalSpots || 10,
        pricePerHour: lot.pricePerHour || 5,
        features: lot.features || []
      });
      setSelectedLot(lot);
      setIsEditMode(true);
    } else {
      // Add mode
      setLotForm({
        name: '',
        address: '',
        totalSpots: 10,
        pricePerHour: 5,
        features: []
      });
      setSelectedLot(null);
      setIsEditMode(false);
    }
    setFormErrors({});
    setLotFormOpen(true);
  };

  // Close lot form dialog
  const handleCloseLotForm = () => {
    setLotFormOpen(false);
  };

  // Handle lot form input change
  const handleLotFormChange = (e) => {
    const { name, value } = e.target;
    setLotForm({ ...lotForm, [name]: value });
    
    // Clear error for the field being edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  // Handle feature checkbox toggle
  const handleFeatureToggle = (feature) => {
    const features = [...lotForm.features];
    const index = features.indexOf(feature);
    
    if (index === -1) {
      features.push(feature);
    } else {
      features.splice(index, 1);
    }
    
    setLotForm({ ...lotForm, features });
  };

  // Validate lot form
  const validateLotForm = () => {
    const errors = {};
    
    if (!lotForm.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!lotForm.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!lotForm.totalSpots || lotForm.totalSpots <= 0) {
      errors.totalSpots = 'Total spots must be greater than 0';
    }
    
    if (!lotForm.pricePerHour || lotForm.pricePerHour <= 0) {
      errors.pricePerHour = 'Price per hour must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit lot form
  const handleSubmitLot = async () => {
    if (!validateLotForm()) {
      return;
    }
    
    // Check if coordinates are set
    if (!lotForm.coordinates || !Array.isArray(lotForm.coordinates) || lotForm.coordinates.length !== 2) {
      showNotification('Please set a valid location for the parking lot.', 'error');
      return;
    }
    
    try {
      // Format the data to match the expected schema format
      const formattedLot = {
        ...lotForm,
        location: {
          type: 'Point',
          coordinates: [lotForm.coordinates[1], lotForm.coordinates[0]], // [longitude, latitude] format
          address: lotForm.address
        },
        totalSpots: Number(lotForm.totalSpots),
        availableSpots: Number(lotForm.totalSpots),
        pricePerHour: Number(lotForm.pricePerHour),
        features: lotForm.features,
        status: 'active',
        type: 'private' // Explicitly set type to private for operator
      };
      
      // Remove the standalone coordinates and address as they're now in the location object
      delete formattedLot.coordinates;
      delete formattedLot.address;
      delete formattedLot.locationType;
      delete formattedLot.locationFound;
      
      console.log('Creating parking lot with data:', formattedLot);
      
      if (isEditMode) {
        // Update existing lot
        await operatorService.updateLot(selectedLot._id, formattedLot);
        showNotification('Parking lot updated successfully');
      } else {
        // Create new lot
        await operatorService.createLot(formattedLot);
        showNotification('Parking lot created successfully');
      }
      
      // Refresh parking lots
      fetchParkingLots();
      handleCloseLotForm();
    } catch (error) {
      console.error('Error saving parking lot:', error);
      showNotification(error.message || 'Failed to save parking lot', 'error');
    }
  };

  // Delete a parking lot
  const handleDeleteLot = async (lotId) => {
    if (window.confirm('Are you sure you want to delete this parking lot?')) {
      try {
        const response = await operatorService.deleteLot(lotId);
        showNotification('Parking lot deleted successfully');
        // Filter out the deleted lot from the state
        setParkingLots(parkingLots.filter(lot => lot._id !== lotId));
      } catch (error) {
        console.error('Error deleting parking lot:', error);
        showNotification(error.message || 'Failed to delete parking lot', 'error');
      }
    }
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
      await operatorService.updateBookingStatus(
        selectedBooking._id,
        approvalForm.status,
        approvalForm.comment
      );
      
      showNotification(`Booking ${approvalForm.status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchBookings();
      handleCloseApprovalModal();
    } catch (error) {
      console.error('Error updating booking status:', error);
      showNotification(error.message || 'Failed to update booking status', 'error');
    }
  };

  // Update lot availability
  const handleUpdateAvailability = async (lotId, availableSpots) => {
    try {
      await operatorService.updateLotAvailability(lotId, availableSpots);
      showNotification('Availability updated successfully');
      fetchParkingLots();
    } catch (error) {
      console.error('Error updating availability:', error);
      showNotification(error.message || 'Failed to update availability', 'error');
    }
  };

  // Add methods for location handling
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = [position.coords.latitude, position.coords.longitude];
          setLotForm({
            ...lotForm,
            coordinates,
            locationFound: true
          });
          showNotification('Current location detected successfully', 'success');
        },
        (error) => {
          console.error("Error getting current location:", error);
          showNotification('Failed to get current location: ' + error.message, 'error');
        }
      );
    } else {
      showNotification('Geolocation is not supported by your browser', 'error');
    }
  };

  const handleFindLocationFromAddress = async () => {
    if (!lotForm.address) {
      showNotification('Please enter an address first', 'error');
      return;
    }

    try {
      // Use OpenStreetMap Nominatim API for geocoding (convert address to coordinates)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lotForm.address)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coordinates = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setLotForm({
          ...lotForm,
          coordinates,
          locationFound: true
        });
        showNotification('Location found successfully', 'success');
      } else {
        showNotification('Could not find coordinates for this address', 'error');
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      showNotification('Failed to find location: ' + error.message, 'error');
    }
  };

  // Prepare chart data for occupancy
  const getOccupancyChartData = () => {
    if (!analytics || !analytics.occupancyByLot) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Occupancy Rate (%)',
            data: [],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: analytics.occupancyByLot.map(lot => lot.name),
      datasets: [
        {
          label: 'Occupancy Rate (%)',
          data: analytics.occupancyByLot.map(lot => lot.occupancyRate.toFixed(1)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare chart data for revenue
  const getRevenueChartData = () => {
    if (!analytics || !analytics.revenueByLot) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Revenue',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: analytics.revenueByLot.map(lot => lot.name),
      datasets: [
        {
          label: 'Revenue',
          data: analytics.revenueByLot.map(lot => lot.revenue),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Occupancy Rate by Parking Lot',
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue by Parking Lot',
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate summary metrics
  const totalSpots = parkingLots.reduce((sum, lot) => sum + lot.totalSpots, 0);
  const totalAvailable = parkingLots.reduce((sum, lot) => sum + lot.availableSpots, 0);
  const totalRevenue = analytics?.totalRevenue || 0;

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Operator Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your parking lots, bookings, and view analytics.
          </Typography>
        </Box>

        {/* Operator Stats */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocalParkingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Spaces</Typography>
                <Typography variant="h4">{totalSpots}</Typography>
                <Typography color="text.secondary">
                  {totalAvailable} Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimelineIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Active Bookings</Typography>
                <Typography variant="h4">{bookings.length}</Typography>
                <Typography color="text.secondary">
                  {pendingBookings.length} Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MonetizationOnIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                <Typography variant="h4">₹{totalRevenue.toFixed(2)}</Typography>
                <Typography color="text.secondary">
                  {timeframe} to date
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleTabChange} aria-label="operator dashboard tabs">
            <Tab label="Parking Lots" id="operator-tab-0" aria-controls="operator-tabpanel-0" />
            <Tab label="Bookings" id="operator-tab-1" aria-controls="operator-tabpanel-1" />
            <Tab label="Analytics" id="operator-tab-2" aria-controls="operator-tabpanel-2" />
          </Tabs>
        </Box>

        {/* Parking Lots Tab */}
        <TabPanel value={value} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Your Parking Lots</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenLotForm()}
            >
              Add New Lot
            </Button>
          </Box>
          
          {parkingLots.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              You haven't added any parking lots yet. Click "Add New Lot" to get started.
            </Alert>
          ) : (
            <>
              {/* Map of Parking Lots */}
              <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                <MapContainer
                  center={[28.6139, 77.2090]} // Default to Delhi coordinates
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {parkingLots.map((lot) => (
                    <Marker 
                      key={lot._id || lot.id}
                      position={lot.location?.coordinates ? [lot.location.coordinates[1], lot.location.coordinates[0]] : [28.6139, 77.2090]}
                    >
                      <Popup>
                        <Typography variant="subtitle2">{lot.name}</Typography>
                        <Typography variant="body2">
                          Available: {lot.availableSpots}/{lot.totalSpots}
                        </Typography>
                        <Typography variant="body2">
                          ₹{lot.pricePerHour}/hour
                        </Typography>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Box>

              {/* Parking Lots Table */}
              <Typography variant="h6" gutterBottom>Lot Details</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Total Spots</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Price/Hour</TableCell>
                      <TableCell>Features</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parkingLots.map((lot) => (
                      <TableRow key={lot._id || lot.id}>
                        <TableCell>{lot.name}</TableCell>
                        <TableCell>{lot.location?.address || 'No address'}</TableCell>
                        <TableCell>{lot.totalSpots}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TextField
                              type="number"
                              variant="outlined"
                              size="small"
                              value={lot.availableSpots}
                              onChange={(e) => handleUpdateAvailability(lot._id, e.target.value)}
                              InputProps={{ inputProps: { min: 0, max: lot.totalSpots } }}
                              sx={{ width: '80px', mr: 1 }}
                            />
                            / {lot.totalSpots}
                          </Box>
                        </TableCell>
                        <TableCell>₹{lot.pricePerHour}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {lot.features?.map((feature, index) => (
                              <Chip 
                                key={index} 
                                label={feature.charAt(0).toUpperCase() + feature.slice(1)} 
                                size="small" 
                              />
                            ))}
                            {!lot.features || lot.features.length === 0 && 'None'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton 
                              color="primary"
                              onClick={() => handleOpenLotForm(lot)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteLot(lot._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </TabPanel>

        {/* Bookings Tab */}
        <TabPanel value={value} index={1}>
          <Typography variant="h5" gutterBottom>Booking Management</Typography>
          
          {bookings.length === 0 ? (
            <Alert severity="info">
              No bookings found for your parking lots.
            </Alert>
          ) : (
            <>
              {/* Pending Bookings */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Pending Bookings</Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Parking Space</TableCell>
                      <TableCell>Vehicle Details</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Total Price</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingBookings.map((booking) => (
                      <TableRow key={booking._id || booking.id}>
                        <TableCell>{booking.user?.name || 'N/A'}</TableCell>
                        <TableCell>{booking.parking?.name || 'Unknown'}</TableCell>
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
                            sx={{ mr: 1 }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* All Bookings */}
              <Typography variant="h6" gutterBottom>All Bookings</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Vehicle Number</TableCell>
                      <TableCell>Parking Space</TableCell>
                      <TableCell>Vehicle Details</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Total Price</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking._id || booking.id}>
                        <TableCell>{booking.user?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {getVehicleNumber(booking)}
                        </TableCell>
                        <TableCell>{booking.parking?.name || 'Unknown'}</TableCell>
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
                          <Chip 
                            label={booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Unknown'} 
                            color={
                              booking.status === 'approved' ? 'success' : 
                              booking.status === 'rejected' ? 'error' : 
                              booking.status === 'pending' ? 'warning' : 
                              'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={value} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Performance Analytics</Typography>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-select-label"
                value={timeframe}
                label="Timeframe"
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {analyticsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Analytics Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                      <Typography variant="h4">₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Total Bookings</Typography>
                      <Typography variant="h4">{analytics?.totalBookings || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Avg. Occupancy</Typography>
                      <Typography variant="h4">{analytics?.occupancyRate?.toFixed(1) || 0}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Bookings/Day</Typography>
                      <Typography variant="h4">{analytics?.bookingsPerDay?.toFixed(1) || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Charts */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Occupancy Rates</Typography>
                    <Box sx={{ height: 300 }}>
                      <Pie data={getOccupancyChartData()} options={pieOptions} />
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Revenue by Lot</Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar data={getRevenueChartData()} options={barOptions} />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Peak Hours */}
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>Peak Booking Hours</Typography>
                {analytics?.peakHour && analytics.peakHour.length > 0 ? (
                  <Grid container spacing={2}>
                    {analytics.peakHour.map((peak, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h5" component="div">
                              {peak.hour}:00 - {peak.hour + 1}:00
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {peak.count} bookings
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No peak hour data available</Typography>
                )}
              </Paper>

              {/* Most Booked Lot */}
              {analytics?.mostBookedLot && (
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Most Popular Parking Lot</Typography>
                  <Box>
                    <Typography variant="h5" component="div">
                      {analytics.mostBookedLot.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analytics.mostBookedLot.bookings} bookings
                    </Typography>
                  </Box>
                </Paper>
              )}
            </>
          )}
        </TabPanel>

        {/* Lot Form Dialog */}
        <Dialog open={lotFormOpen} onClose={handleCloseLotForm} maxWidth="sm" fullWidth>
          <DialogTitle>{isEditMode ? 'Edit Parking Lot' : 'Add New Parking Lot'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Lot Name"
                name="name"
                value={lotForm.name}
                onChange={handleLotFormChange}
                fullWidth
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
              <TextField
                label="Address"
                name="address"
                value={lotForm.address}
                onChange={handleLotFormChange}
                fullWidth
                required
                error={!!formErrors.address}
                helperText={formErrors.address}
              />
              
              {/* Location Selection */}
              <Typography variant="subtitle2" gutterBottom>Parking Location</Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  name="locationType"
                  value={lotForm.locationType || "manual"}
                  onChange={(e) => setLotForm({
                    ...lotForm,
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
              
              {lotForm.locationType === "current" ? (
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={handleGetCurrentLocation}
                >
                  {lotForm.locationFound ? 'Update Current Location' : 'Get Current Location'}
                </Button>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Latitude"
                      name="lat"
                      type="number"
                      value={lotForm.coordinates ? lotForm.coordinates[0] : ''}
                      onChange={(e) => setLotForm({
                        ...lotForm,
                        coordinates: [parseFloat(e.target.value), lotForm.coordinates ? lotForm.coordinates[1] : 0]
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
                      value={lotForm.coordinates ? lotForm.coordinates[1] : ''}
                      onChange={(e) => setLotForm({
                        ...lotForm,
                        coordinates: [lotForm.coordinates ? lotForm.coordinates[0] : 0, parseFloat(e.target.value)]
                      })}
                      fullWidth
                      inputProps={{ step: 0.000001 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<LocationOnIcon />}
                      onClick={handleFindLocationFromAddress}
                      fullWidth
                    >
                      Find Location from Address
                    </Button>
                  </Grid>
                </Grid>
              )}
              
              {lotForm.locationFound && (
                <Alert severity="success" icon={<LocationOnIcon />}>
                  Location set successfully!
                </Alert>
              )}
              
              <TextField
                label="Total Spots"
                name="totalSpots"
                type="number"
                value={lotForm.totalSpots}
                onChange={handleLotFormChange}
                fullWidth
                required
                inputProps={{ min: 1 }}
                error={!!formErrors.totalSpots}
                helperText={formErrors.totalSpots}
              />
              <TextField
                label="Price per Hour (₹)"
                name="pricePerHour"
                type="number"
                value={lotForm.pricePerHour}
                onChange={handleLotFormChange}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                error={!!formErrors.pricePerHour}
                helperText={formErrors.pricePerHour}
              />
              <Typography variant="subtitle1">Features:</Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={lotForm.features.includes('covered')}
                      onChange={() => handleFeatureToggle('covered')}
                    />
                  }
                  label="Covered"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={lotForm.features.includes('security')}
                      onChange={() => handleFeatureToggle('security')}
                    />
                  }
                  label="Security"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={lotForm.features.includes('charging')}
                      onChange={() => handleFeatureToggle('charging')}
                    />
                  }
                  label="EV Charging"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={lotForm.features.includes('disabled')}
                      onChange={() => handleFeatureToggle('disabled')}
                    />
                  }
                  label="Disabled Access"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={lotForm.features.includes('24/7')}
                      onChange={() => handleFeatureToggle('24/7')}
                    />
                  }
                  label="24/7 Access"
                />
              </FormGroup>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseLotForm}>Cancel</Button>
            <Button 
              onClick={handleSubmitLot} 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
            >
              {isEditMode ? 'Update' : 'Add'} Lot
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
                    <Typography variant="subtitle2">Parking Lot:</Typography>
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
                        startIcon={<BlockIcon />}
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

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default OperatorDashboard;