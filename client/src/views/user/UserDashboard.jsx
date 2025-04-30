import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
// Fix for date-picker import
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useAuth } from '../../components/layout/Navbar';
import userService from '../../services/userService';

// Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HistoryIcon from '@mui/icons-material/History';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import EventIcon from '@mui/icons-material/Event';
import EvStationIcon from '@mui/icons-material/EvStation';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import SecurityIcon from '@mui/icons-material/Security';
import AccessibleIcon from '@mui/icons-material/Accessible';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import FilterListIcon from '@mui/icons-material/FilterList';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import InfoIcon from '@mui/icons-material/Info';

// Tab Panel component for tab navigation
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
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

// LocationMarker component to show user's location on map
function LocationMarker({ position, setPosition }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <>
      <Marker position={position}>
        <Popup>You are here</Popup>
      </Marker>
      <Circle center={position} radius={500} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
    </>
  ) : null;
}

const UserDashboard = () => {
  const { isAuthenticated, userName } = useAuth();
  const navigate = useNavigate();
  
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
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [nearbyParkingLots, setNearbyParkingLots] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [selectedParkingLot, setSelectedParkingLot] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form states
  const [bookingForm, setBookingForm] = useState({
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // Default 2 hours
    vehicleNumber: '',
    vehicleType: 'car'
  });
  
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  
  const [filters, setFilters] = useState({
    vehicleType: '',
    features: []
  });
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  // Notification handler
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Show notification
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load user profile and bookings
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profileResponse = await userService.getUserProfile();
        if (profileResponse && profileResponse.data) {
          setUserProfile(profileResponse.data.user);
        }
        
        // Fetch user bookings
        await fetchBookings();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification(error.message || 'Failed to fetch user data', 'error');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Function to fetch and deduplicate bookings
  const fetchBookings = async () => {
    try {
      // Fetch user bookings
      const bookingsResponse = await userService.getUserBookings();
      if (bookingsResponse && bookingsResponse.data && bookingsResponse.data.bookings) {
        console.log('Received bookings data:', bookingsResponse.data.bookings.length, 'bookings');
        
        // Deduplicate bookings based on _id to prevent multiple entries
        const allBookings = bookingsResponse.data.bookings;
        
        // Create a Map using booking _id as the key to ensure uniqueness
        const uniqueBookingsMap = new Map();
        allBookings.forEach(booking => {
          uniqueBookingsMap.set(booking._id, booking);
        });
        
        // Convert Map back to array
        const uniqueBookings = Array.from(uniqueBookingsMap.values());
        console.log('Deduplicated bookings length:', uniqueBookings.length, 'Original length:', allBookings.length);
        
        // Filter active and past bookings
        const active = uniqueBookings.filter(booking => 
          booking.status === 'active' || 
          booking.status === 'pending' || 
          booking.status === 'approved'
        );
        const history = uniqueBookings.filter(booking => 
          booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected'
        );
        
        setActiveBookings(active);
        setBookingHistory(history);
        return uniqueBookings;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      showNotification(error.message || 'Failed to fetch bookings', 'error');
      return [];
    }
  };

  // Get user's location
  const handleGetCurrentLocation = () => {
    setIsSearching(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          fetchNearbyParkingLots(location.lat, location.lng);
          setIsSearching(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          showNotification('Failed to get your location. Please try again or enter manually.', 'error');
          setIsSearching(false);
        }
      );
    } else {
      showNotification('Geolocation is not supported by your browser. Please enter your location manually.', 'error');
      setIsSearching(false);
    }
  };

  // Fetch nearby parking lots
  const fetchNearbyParkingLots = async (lat, lng) => {
    try {
      setIsSearching(true);
      console.log(`Searching for parking lots near: ${lat}, ${lng} with radius ${searchRadius}km and filters:`, filters);
      const response = await userService.getNearbyParkingLots(lat, lng, searchRadius, filters);
      console.log('API Response for nearby parking lots:', response);
      if (response && response.data && response.data.parkings) {
        setNearbyParkingLots(response.data.parkings);
        console.log('Found parking lots:', response.data.parkings.length);
      } else {
        console.log('No parking lots found or unexpected response structure:', response);
        setNearbyParkingLots([]);
      }
      setIsSearching(false);
    } catch (error) {
      console.error('Error fetching nearby parking lots:', error);
      showNotification(error.message || 'Failed to fetch nearby parking lots', 'error');
      setIsSearching(false);
    }
  };

  // Fetch all parking lots without location filtering (for debugging)
  const fetchAllParkingLots = async () => {
    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      
      // Direct API call to get all parking lots without location filtering
      const response = await fetch(`${userService.API_URL}/parking`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('All parking lots:', data);
      
      if (data && data.data && data.data.parkings) {
        // Log each parking lot's coordinates for debugging
        data.data.parkings.forEach(lot => {
          console.log(`Parking lot: ${lot.name}, ID: ${lot._id}, Type: ${lot.type}`);
          console.log(`- Coordinates: ${JSON.stringify(lot.location?.coordinates)}`);
          console.log(`- Total Spots: ${lot.totalSpots}, Available: ${lot.availableSpots}`);
        });
        
        setNearbyParkingLots(data.data.parkings);
        showNotification(`Found ${data.data.parkings.length} parking lots`, 'info');
      } else {
        showNotification('No parking lots found in the system', 'warning');
      }
      setIsSearching(false);
    } catch (error) {
      console.error('Error fetching all parking lots:', error);
      showNotification(error.message || 'Failed to fetch parking lots', 'error');
      setIsSearching(false);
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    if (userLocation) {
      fetchNearbyParkingLots(userLocation.lat, userLocation.lng);
    }
    setFiltersOpen(false);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      vehicleType: '',
      features: []
    });
    if (userLocation) {
      fetchNearbyParkingLots(userLocation.lat, userLocation.lng);
    }
    setFiltersOpen(false);
  };

  // Toggle feature filter
  const handleFeatureToggle = (feature) => {
    const features = [...filters.features];
    const index = features.indexOf(feature);
    
    if (index === -1) {
      features.push(feature);
    } else {
      features.splice(index, 1);
    }
    
    setFilters({ ...filters, features });
  };

  // Open booking dialog
  const handleOpenBookingDialog = (parkingLot) => {
    setSelectedParkingLot(parkingLot);
    
    // Calculate end time (2 hours from now)
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    
    setBookingForm({
      startTime,
      endTime,
      vehicleNumber: userProfile?.vehicleNumber || '',
      vehicleType: 'car'
    });
    
    setBookingDialogOpen(true);
  };

  // Close booking dialog
  const handleCloseBookingDialog = () => {
    setBookingDialogOpen(false);
    setSelectedParkingLot(null);
  };

  // Handle booking form change
  const handleBookingFormChange = (e) => {
    const { name, value } = e.target;
    setBookingForm({ ...bookingForm, [name]: value });
  };

  // Calculate booking duration and price
  const calculateBookingDetails = () => {
    if (!selectedParkingLot || !bookingForm.startTime || !bookingForm.endTime) {
      return { duration: 0, price: 0 };
    }
    
    const start = new Date(bookingForm.startTime);
    const end = new Date(bookingForm.endTime);
    const durationHours = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60)));
    const price = durationHours * selectedParkingLot.pricePerHour;
    
    return { duration: durationHours, price };
  };

  // Submit booking
  const handleSubmitBooking = async () => {
    try {
      if (!selectedParkingLot) {
        showNotification('No parking lot selected', 'error');
        return;
      }
      
      if (!bookingForm.vehicleNumber) {
        showNotification('Please enter your vehicle number', 'error');
        return;
      }
      
      const { duration, price } = calculateBookingDetails();
      
      if (duration <= 0) {
        showNotification('Invalid booking duration', 'error');
        return;
      }
      
      const bookingData = {
        parking: selectedParkingLot._id,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        vehicleDetails: {
          number: bookingForm.vehicleNumber,
          type: bookingForm.vehicleType
        }
      };
      
      const response = await userService.createBooking(bookingData);
      
      if (response && response.data && response.data.booking) {
        // Close booking dialog and open payment dialog
        setBookingDialogOpen(false);
        setPaymentDialogOpen(true);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      showNotification(error.message || 'Failed to create booking', 'error');
    }
  };

  // Handle payment form change
  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm({ ...paymentForm, [name]: value });
  };

  // Process payment
  const handleProcessPayment = async () => {
    try {
      // Validate payment form
      if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.name) {
        showNotification('Please fill in all payment details', 'error');
        return;
      }
      
      // In a real app, we would process the payment through a payment gateway
      // For now, simulate a successful payment
      
      // Close payment dialog and show success notification
      setPaymentDialogOpen(false);
      showNotification('Payment successful! Your booking is confirmed', 'success');
      
      // Refresh bookings using the deduplication function
      await fetchBookings();
      
      // Switch to bookings tab
      setValue(1);
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification(error.message || 'Payment failed', 'error');
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const response = await userService.cancelBooking(bookingId);
        
        if (response && response.data) {
          showNotification('Booking cancelled successfully', 'success');
          
          // Refresh bookings using the deduplication function
          await fetchBookings();
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification(error.message || 'Failed to cancel booking', 'error');
      }
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate total stats
  const totalActiveBookings = activeBookings.length;
  const totalBookings = activeBookings.length + bookingHistory.length;
  const totalSpent = [...activeBookings, ...bookingHistory].reduce((acc, booking) => acc + (booking.totalPrice || 0), 0);

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
            User Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find and book parking spaces, manage your bookings, and view your history.
          </Typography>
        </Box>

        {/* User Stats */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DirectionsCarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Active Bookings</Typography>
                <Typography variant="h4">{totalActiveBookings}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <HistoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Bookings</Typography>
                <Typography variant="h4">{totalBookings}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PaymentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Spent</Typography>
                <Typography variant="h4">₹{totalSpent.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleTabChange} aria-label="user dashboard tabs">
            <Tab label="Find Parking" id="user-tab-0" aria-controls="user-tabpanel-0" />
            <Tab label="My Bookings" id="user-tab-1" aria-controls="user-tabpanel-1" />
            <Tab label="Profile" id="user-tab-2" aria-controls="user-tabpanel-2" />
          </Tabs>
        </Box>

        {/* Find Parking Tab */}
        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Find Parking Near You</Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<MyLocationIcon />}
                      onClick={handleGetCurrentLocation}
                      fullWidth
                      disabled={isSearching}
                    >
                      {isSearching ? 'Locating...' : 'Use My Location'}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Search Radius</InputLabel>
                      <Select
                        value={searchRadius}
                        label="Search Radius"
                        onChange={(e) => setSearchRadius(e.target.value)}
                      >
                        <MenuItem value={1}>1 km</MenuItem>
                        <MenuItem value={2}>2 km</MenuItem>
                        <MenuItem value={5}>5 km</MenuItem>
                        <MenuItem value={10}>10 km</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      startIcon={<FilterListIcon />}
                      onClick={() => setFiltersOpen(true)}
                      fullWidth
                    >
                      Filters {filters.vehicleType || filters.features.length > 0 ? `(${
                        (filters.vehicleType ? 1 : 0) + filters.features.length
                      })` : ''}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<SearchIcon />}
                      onClick={() => userLocation && fetchNearbyParkingLots(userLocation.lat, userLocation.lng)}
                      fullWidth
                      disabled={!userLocation || isSearching}
                    >
                      {isSearching ? 'Searching...' : 'Search Parking'}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={fetchAllParkingLots}
                      fullWidth
                    >
                      Show All Parking
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>

          {userLocation ? (
            <Grid container spacing={3}>
              {/* Map View */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>Map View</Typography>
                <Paper sx={{ height: 500, borderRadius: 2, overflow: 'hidden' }}>
                  <MapContainer
                    center={[userLocation.lat, userLocation.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* User location marker */}
                    <LocationMarker position={[userLocation.lat, userLocation.lng]} />
                    
                    {/* Parking lots markers - MongoDB stores as [longitude, latitude], but Leaflet needs [latitude, longitude] */}
                    {nearbyParkingLots.map((lot) => {
                      // Skip lots without valid coordinates
                      if (!lot.location?.coordinates || !Array.isArray(lot.location.coordinates) || lot.location.coordinates.length !== 2) {
                        console.warn(`Invalid coordinates for parking lot: ${lot.name}`, lot.location);
                        return null;
                      }

                      // Convert from MongoDB [longitude, latitude] to Leaflet [latitude, longitude]
                      const markerPosition = [lot.location.coordinates[1], lot.location.coordinates[0]];
                      
                      return (
                        <Marker 
                          key={lot._id}
                          position={markerPosition}
                        >
                          <Popup>
                            <Typography variant="subtitle2">{lot.name}</Typography>
                            <Typography variant="body2">{lot.location.address || 'No address provided'}</Typography>
                            <Typography variant="body2">
                              Type: {lot.type.charAt(0).toUpperCase() + lot.type.slice(1)}
                            </Typography>
                            <Typography variant="body2">
                              Available: {lot.availableSpots}/{lot.totalSpots}
                            </Typography>
                            <Typography variant="body2">
                              Price: ₹{lot.pricePerHour}/hour
                            </Typography>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="primary" 
                              onClick={() => handleOpenBookingDialog(lot)}
                              disabled={lot.availableSpots <= 0}
                              sx={{ mt: 1 }}
                            >
                              {lot.availableSpots > 0 ? 'Book Now' : 'No Spots Available'}
                            </Button>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </Paper>
              </Grid>
              
              {/* Parking List */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>Available Parking Lots</Typography>
                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {nearbyParkingLots.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No parking lots found in this area. Try increasing the search radius or changing your location.
                      </Typography>
                    </Paper>
                  ) : (
                    <>
                      {nearbyParkingLots.map((lot) => (
                        <Card key={lot._id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="h6">{lot.name}</Typography>
                              <Chip 
                                label={lot.type.charAt(0).toUpperCase() + lot.type.slice(1)} 
                                color={lot.type === 'government' ? 'primary' : lot.type === 'private' ? 'secondary' : 'default'}
                                size="small"
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {lot.location.address || 'No address provided'}
                            </Typography>
                            
                            <Grid container spacing={1} sx={{ mb: 1 }}>
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  <LocalParkingIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  {lot.availableSpots}/{lot.totalSpots} spots
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2">
                                  <LocalAtmIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  ₹{lot.pricePerHour}/hour
                                </Typography>
                              </Grid>
                            </Grid>
                            
                            {lot.features && lot.features.length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                {lot.features.includes('ev') && (
                                  <Chip icon={<EvStationIcon />} label="EV Charging" size="small" variant="outlined" />
                                )}
                                {lot.features.includes('covered') && (
                                  <Chip label="Covered" size="small" variant="outlined" />
                                )}
                                {lot.features.includes('security') && (
                                  <Chip icon={<SecurityIcon />} label="Security" size="small" variant="outlined" />
                                )}
                                {lot.features.includes('disabled') && (
                                  <Chip icon={<AccessibleIcon />} label="Disabled Access" size="small" variant="outlined" />
                                )}
                                {lot.features.includes('24/7') && (
                                  <Chip icon={<NightsStayIcon />} label="24/7" size="small" variant="outlined" />
                                )}
                              </Box>
                            )}
                            
                            <Button 
                              variant="contained" 
                              color="primary" 
                              fullWidth
                              onClick={() => handleOpenBookingDialog(lot)}
                              disabled={lot.availableSpots <= 0}
                            >
                              {lot.availableSpots > 0 ? 'Book Now' : 'No Spots Available'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <LocationOnIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>Find Parking Near You</Typography>
              <Typography variant="body1" paragraph color="text.secondary">
                Click the "Use My Location" button above to find available parking spaces near your current location.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={fetchAllParkingLots}
                disabled={isSearching}
                sx={{ mt: 2 }}
              >
                Show All Parking
              </Button>
            </Paper>
          )}
        </TabPanel>

        {/* My Bookings Tab */}
        <TabPanel value={value} index={1}>
          <Grid container spacing={3}>
            {/* Active Bookings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Active Bookings</Typography>
              {activeBookings.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    You don't have any active bookings. Find and book a parking space to get started.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 2 }}
                    onClick={() => setValue(0)}
                  >
                    Find Parking
                  </Button>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Parking Lot</TableCell>
                        <TableCell>Start Time</TableCell>
                        <TableCell>End Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Total Price</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeBookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>{booking.parking?.name || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(booking.startTime)}</TableCell>
                          <TableCell>{formatDate(booking.endTime)}</TableCell>
                          <TableCell>{booking.duration} hours</TableCell>
                          <TableCell>₹{booking.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Chip 
                              icon={
                                booking.status === 'approved' ? <CheckCircleIcon /> :
                                booking.status === 'rejected' ? <CancelIcon /> :
                                booking.status === 'pending' ? <AccessTimeIcon /> :
                                undefined
                              }
                              label={booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Unknown'} 
                              color={
                                booking.status === 'approved' ? 'success' : 
                                booking.status === 'active' ? 'success' :
                                booking.status === 'rejected' ? 'error' :
                                booking.status === 'pending' ? 'warning' : 
                                'default'
                              }
                            />
                            {booking.comment && (
                              <Tooltip title={booking.comment}>
                                <IconButton size="small">
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            {booking.status === 'approved' || booking.status === 'active' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleCancelBooking(booking._id)}
                              >
                                Cancel
                              </Button>
                            ) : booking.status === 'pending' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleCancelBooking(booking._id)}
                              >
                                Cancel Request
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => setValue(0)}
                              >
                                Book New
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
            
            {/* Booking History */}
            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Booking History</Typography>
              {bookingHistory.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    You don't have any booking history yet.
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Parking Lot</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Total Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingHistory.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>{booking.parking?.name || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(booking.startTime)}</TableCell>
                          <TableCell>{booking.duration} hours</TableCell>
                          <TableCell>₹{booking.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Unknown'} 
                              color={
                                booking.status === 'completed' ? 'success' : 
                                booking.status === 'cancelled' ? 'error' : 
                                'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value={value} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Profile Information</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Name"
                          value={userProfile?.name || ''}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Email"
                          value={userProfile?.email || ''}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Role"
                          value={userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || ''}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Vehicle Number"
                          value={userProfile?.vehicleNumber || 'Not provided'}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Vehicle Type"
                          value={userProfile?.vehicleType || 'Not provided'}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                    </Grid>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/account')}
                    >
                      Edit Profile
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Filter Dialog */}
        <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Filter Parking Lots</DialogTitle>
          <IconButton
            aria-label="close"
            onClick={() => setFiltersOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={filters.vehicleType}
                  label="Vehicle Type"
                  onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="car">Car</MenuItem>
                  <MenuItem value="motorcycle">Motorcycle</MenuItem>
                  <MenuItem value="ev">Electric Vehicle</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="subtitle1">Features:</Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.features.includes('covered')}
                      onChange={() => handleFeatureToggle('covered')}
                    />
                  }
                  label="Covered"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.features.includes('security')}
                      onChange={() => handleFeatureToggle('security')}
                    />
                  }
                  label="Security"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.features.includes('charging')}
                      onChange={() => handleFeatureToggle('charging')}
                    />
                  }
                  label="EV Charging"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.features.includes('disabled')}
                      onChange={() => handleFeatureToggle('disabled')}
                    />
                  }
                  label="Disabled Access"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.features.includes('24/7')}
                      onChange={() => handleFeatureToggle('24/7')}
                    />
                  }
                  label="24/7 Access"
                />
              </FormGroup>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClearFilters}>Clear Filters</Button>
            <Button onClick={handleApplyFilters} variant="contained" color="primary">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onClose={handleCloseBookingDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Book Parking Space</DialogTitle>
          <DialogContent>
            {selectedParkingLot && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6">{selectedParkingLot.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedParkingLot.location.address || 'No address provided'}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <LocalParkingIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {selectedParkingLot.availableSpots}/{selectedParkingLot.totalSpots} spots available
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <LocalAtmIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      ₹{selectedParkingLot.pricePerHour}/hour
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DateTimePicker
                        label="Start Time"
                        value={bookingForm.startTime}
                        onChange={(newValue) => setBookingForm({ ...bookingForm, startTime: newValue })}
                        slotProps={{ textField: { fullWidth: true } }}
                        minDateTime={new Date()}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DateTimePicker
                        label="End Time"
                        value={bookingForm.endTime}
                        onChange={(newValue) => setBookingForm({ ...bookingForm, endTime: newValue })}
                        slotProps={{ textField: { fullWidth: true } }}
                        minDateTime={new Date(bookingForm.startTime.getTime() + 30 * 60 * 1000)}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
                
                <TextField
                  label="Vehicle Number"
                  name="vehicleNumber"
                  value={bookingForm.vehicleNumber}
                  onChange={handleBookingFormChange}
                  fullWidth
                  required
                  margin="normal"
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    name="vehicleType"
                    value={bookingForm.vehicleType}
                    label="Vehicle Type"
                    onChange={handleBookingFormChange}
                  >
                    <MenuItem value="car">Car</MenuItem>
                    <MenuItem value="motorcycle">Motorcycle</MenuItem>
                    <MenuItem value="ev">Electric Vehicle</MenuItem>
                  </Select>
                </FormControl>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Duration:</Typography>
                      <Typography variant="body1">{calculateBookingDetails().duration} hours</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Total Price:</Typography>
                      <Typography variant="body1">₹{calculateBookingDetails().price.toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBookingDialog}>Cancel</Button>
            <Button onClick={handleSubmitBooking} variant="contained" color="primary">
              Confirm Booking
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>Enter Payment Information</Typography>
              
              <TextField
                label="Card Number"
                name="cardNumber"
                value={paymentForm.cardNumber}
                onChange={handlePaymentFormChange}
                fullWidth
                placeholder="1234 5678 9012 3456"
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCardIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Expiry Date"
                    name="expiryDate"
                    value={paymentForm.expiryDate}
                    onChange={handlePaymentFormChange}
                    fullWidth
                    placeholder="MM/YY"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="CVV"
                    name="cvv"
                    value={paymentForm.cvv}
                    onChange={handlePaymentFormChange}
                    fullWidth
                    placeholder="123"
                    margin="normal"
                    type="password"
                  />
                </Grid>
              </Grid>
              
              <TextField
                label="Cardholder Name"
                name="name"
                value={paymentForm.name}
                onChange={handlePaymentFormChange}
                fullWidth
                margin="normal"
              />
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Payment Summary:</Typography>
                <Typography variant="body1">
                  Total Amount: ₹{calculateBookingDetails().price.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleProcessPayment} variant="contained" color="primary">
              Pay Now
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

export default UserDashboard;