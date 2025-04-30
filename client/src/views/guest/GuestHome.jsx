import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Paper,
  CircularProgress,
  CardActions,
  Chip,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import L from 'leaflet';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import { API_BASE_URL } from '../../config/config';
import { useAuth } from '../../components/layout/Navbar';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different parking types
const governmentIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const privateIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for user's location
const userLocationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Function to generate parking spots around a given location
const generateParkingSpots = (centerLat, centerLng) => {
  // Convert degrees to kilometers (approximate)
  const latToKm = 111.32;
  const lngToKm = 111.32 * Math.cos(centerLat * Math.PI / 180);

  // Generate random offsets in kilometers (within 2km radius)
  const generateOffset = () => (Math.random() - 0.5) * 4;

  return [
    {
      _id: '1',
      name: 'Central Parking',
      type: 'government',
      location: {
        coordinates: [
          centerLng + (generateOffset() / lngToKm),
          centerLat + (generateOffset() / latToKm)
        ]
      },
      availableSpots: 20,
      totalSpots: 50,
      pricePerHour: 5
    },
    {
      _id: '2',
      name: 'Downtown Parking',
      type: 'private',
      location: {
        coordinates: [
          centerLng + (generateOffset() / lngToKm),
          centerLat + (generateOffset() / latToKm)
        ]
      },
      availableSpots: 15,
      totalSpots: 30,
      pricePerHour: 8
    },
    {
      _id: '3',
      name: 'City Center Parking',
      type: 'government',
      location: {
        coordinates: [
          centerLng + (generateOffset() / lngToKm),
          centerLat + (generateOffset() / latToKm)
        ]
      },
      availableSpots: 25,
      totalSpots: 40,
      pricePerHour: 6
    },
    {
      _id: '4',
      name: 'Premium Parking',
      type: 'private',
      location: {
        coordinates: [
          centerLng + (generateOffset() / lngToKm),
          centerLat + (generateOffset() / latToKm)
        ]
      },
      availableSpots: 10,
      totalSpots: 20,
      pricePerHour: 12
    },
    {
      _id: '5',
      name: 'Public Parking',
      type: 'government',
      location: {
        coordinates: [
          centerLng + (generateOffset() / lngToKm),
          centerLat + (generateOffset() / latToKm)
        ]
      },
      availableSpots: 30,
      totalSpots: 60,
      pricePerHour: 4
    }
  ];
};

// Fallback mock data for parking spots
const fallbackParkingSpots = [
  {
    _id: '1',
    name: 'Central Parking',
    type: 'government',
    location: { coordinates: [77.2090, 28.6139] },
    availableSpots: 20,
    totalSpots: 50,
    pricePerHour: 5
  },
  {
    _id: '2',
    name: 'Downtown Parking',
    type: 'private',
    location: { coordinates: [77.2190, 28.6239] },
    availableSpots: 15,
    totalSpots: 30,
    pricePerHour: 8
  },
  {
    _id: '3',
    name: 'City Center Parking',
    type: 'government',
    location: { coordinates: [77.2150, 28.6180] },
    availableSpots: 25,
    totalSpots: 40,
    pricePerHour: 6
  },
  {
    _id: '4',
    name: 'Premium Parking',
    type: 'private',
    location: { coordinates: [77.2250, 28.6100] },
    availableSpots: 10,
    totalSpots: 20,
    pricePerHour: 12
  },
  {
    _id: '5',
    name: 'Public Parking',
    type: 'government',
    location: { coordinates: [77.2300, 28.6200] },
    availableSpots: 30,
    totalSpots: 60,
    pricePerHour: 4
  },
  {
    _id: '6',
    name: 'Mall Parking',
    type: 'private',
    location: { coordinates: [77.2400, 28.6250] },
    availableSpots: 40,
    totalSpots: 100,
    pricePerHour: 7
  },
  {
    _id: '7',
    name: 'Station Parking',
    type: 'government',
    location: { coordinates: [77.2000, 28.6300] },
    availableSpots: 35,
    totalSpots: 70,
    pricePerHour: 5
  },
  {
    _id: '8',
    name: 'Business District Parking',
    type: 'private',
    location: { coordinates: [77.2100, 28.6350] },
    availableSpots: 20,
    totalSpots: 40,
    pricePerHour: 10
  },
  {
    _id: '9',
    name: 'Residential Parking',
    type: 'government',
    location: { coordinates: [77.2200, 28.6400] },
    availableSpots: 15,
    totalSpots: 30,
    pricePerHour: 4
  },
  {
    _id: '10',
    name: 'Shopping Center Parking',
    type: 'private',
    location: { coordinates: [77.2350, 28.6450] },
    availableSpots: 50,
    totalSpots: 120,
    pricePerHour: 6
  }
];

// Component to automatically center map on location change
const MapCenterHandler = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

// Function to fetch real parking data from the server
const fetchParkingData = async (lat, lng, radius = 5) => {
  try {
    const response = await fetch(`${API_BASE_URL || 'http://localhost:5002/api'}/parking?lat=${lat}&lng=${lng}&distance=${radius}`);
    const data = await response.json();
    
    if (response.ok && data.status === 'success' && data.data && data.data.parkings) {
      console.log(`Fetched ${data.data.parkings.length} parking spaces from server`);
      return data.data.parkings;
    } else {
      console.error('Error fetching parking data:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch parking data:', error);
    return [];
  }
};

// Function to fetch all parking spots
const fetchAllParkingSpots = async () => {
  try {
    const response = await fetch(`${API_BASE_URL || 'http://localhost:5002/api'}/parking`);
    const data = await response.json();
    
    if (response.ok && data.status === 'success' && data.data && data.data.parkings) {
      console.log(`Fetched ${data.data.parkings.length} parking spaces from server`);
      return data.data.parkings;
    } else {
      console.error('Error fetching all parking data:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch all parking data:', error);
    return [];
  }
};

const GuestHome = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [allParkingSpots, setAllParkingSpots] = useState([]);

  const updateParkingSpots = async (lat, lng) => {
    try {
      // Fetch real parking data from the server
      const realParkingData = await fetchParkingData(lat, lng);
      
      if (realParkingData && realParkingData.length > 0) {
        setParkingSpots(realParkingData);
      } else {
        console.log('No real parking data found, using fallback data');
        setParkingSpots(fallbackParkingSpots);
      }
    } catch (error) {
      console.error('Error updating parking spots:', error);
      setParkingSpots(fallbackParkingSpots);
    }
  };

  const handleBookNow = (parking) => {
    // If user is already logged in, redirect directly to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { 
        state: { 
          parkingLot: parking
        } 
      });
    } else {
      // Otherwise redirect to login page
      navigate('/login', { 
        state: { 
          from: '/dashboard', 
          parkingId: parking._id 
        } 
      });
    }
  };

  const handleFindMyLocation = () => {
    setIsSearching(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          updateParkingSpots(location.lat, location.lng);
          setIsSearching(false);
          setLoading(false);
        },
        (error) => {
          setLocationError(error.message);
          console.error('Error getting location:', error);
          setIsSearching(false);
          setLoading(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
      setIsSearching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFindMyLocation();
  }, []);

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Load all parking spots on mount
  useEffect(() => {
    async function loadAllParkingSpots() {
      const spots = await fetchAllParkingSpots();
      setAllParkingSpots(spots);
    }
    
    loadAllParkingSpots();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(searchLocation)}`);
  };

  const features = [
    {
      icon: <SearchIcon fontSize="large" color="primary" />,
      title: 'Easy Search',
      description: 'Find available parking spaces near you with real-time availability.',
    },
    {
      icon: <SecurityIcon fontSize="large" color="primary" />,
      title: 'Secure Booking',
      description: 'Book your parking spot in advance with secure payment processing.',
    },
    {
      icon: <PaymentIcon fontSize="large" color="primary" />,
      title: 'Flexible Payment',
      description: 'Multiple payment options available for your convenience.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Smart Parking Made Easy
              </Typography>
              <Typography variant="h5" paragraph>
                Find and book parking spaces in real-time. Save time and avoid the hassle.
              </Typography>
              <Paper
                component="form"
                onSubmit={handleSearch}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mt: 4,
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Enter location to find parking"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={handleFindMyLocation}
                  disabled={isSearching}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Find Me
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  minHeight: '70vh',
                  height: '70vh',
                  width: '100%',
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  '& .leaflet-container': {
                    minHeight: '70vh',
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1
                  }
                }}
              >
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : (
                  <MapContainer
                    center={userLocation || [28.6139, 77.2090]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                    whenCreated={(map) => {
                      map.invalidateSize();
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapCenterHandler center={userLocation ? [userLocation.lat, userLocation.lng] : null} />
                    {/* User location marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={userLocationIcon}
                      >
                        <Popup>
                          <Typography variant="subtitle2">Your Location</Typography>
                        </Popup>
                      </Marker>
                    )}
                    {/* Parking spot markers */}
                    {(parkingSpots.length > 0 ? parkingSpots : fallbackParkingSpots).map((spot) => (
                      <Marker
                        key={spot._id}
                        position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
                        icon={spot.type === 'government' ? governmentIcon : privateIcon}
                      >
                        <Popup>
                          <Typography variant="subtitle2">{spot.name}</Typography>
                          <Typography variant="body2">
                            Type: {spot.type.charAt(0).toUpperCase() + spot.type.slice(1)}
                          </Typography>
                          <Typography variant="body2">
                            Available: {spot.availableSpots}/{spot.totalSpots}
                          </Typography>
                          <Typography variant="body2">
                            Price: ${spot.pricePerHour}/hour
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleBookNow(spot)}
                            sx={{ mt: 1 }}
                          >
                            Book Now
                          </Button>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose ParkEase?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* All Available Parking Spots Section */}
      {allParkingSpots.length > 0 && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            All Available Parking Spots
          </Typography>
          <Grid container spacing={3}>
            {allParkingSpots.map((spot) => (
              <Grid item xs={12} sm={6} md={4} key={spot._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {spot.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {spot.location?.address || 'No address provided'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocalParkingIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Available: {spot.availableSpots}/{spot.totalSpots} spots
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocalAtmIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        ₹{spot.pricePerHour}/hour
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={spot.type.charAt(0).toUpperCase() + spot.type.slice(1)} 
                        color={
                          spot.type === 'government' ? 'primary' : 
                          spot.type === 'private' ? 'secondary' : 
                          'default'
                        }
                        size="small"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      disabled={spot.availableSpots <= 0}
                      onClick={() => handleBookNow(spot)}
                    >
                      {spot.availableSpots > 0 ? 'Book Now' : 'No Spots Available'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}
    </Box>
  );
};

export default GuestHome;