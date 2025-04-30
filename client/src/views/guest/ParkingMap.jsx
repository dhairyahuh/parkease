import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import { useLocation, useNavigate } from 'react-router-dom';
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

const residentialIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Add a custom icon for the user's location
const userLocationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

const Routing = ({ start, end }) => {
  const map = useMap();
  const routeRef = useRef(null);

  useEffect(() => {
    if (!start || !end) return;

    if (routeRef.current) {
      map.removeControl(routeRef.current);
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(end.lat, end.lng)
      ],
      routeWhileDragging: true,
      show: true,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    }).addTo(map);

    routeRef.current = routingControl;

    return () => {
      if (routeRef.current) {
        map.removeControl(routeRef.current);
      }
    };
  }, [map, start, end]);

  return null;
};

const ParkingMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [nearestParkings, setNearestParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [allParkingSpots, setAllParkingSpots] = useState([]);

  const findNearestParkings = (location) => {
    if (parkingSpots.length > 0) {
      const sortedParkings = parkingSpots
        .map(spot => ({
          spot,
          distance: Math.sqrt(
            Math.pow(location.lat - spot.location.coordinates[1], 2) +
            Math.pow(location.lng - spot.location.coordinates[0], 2)
          )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
      
      setNearestParkings(sortedParkings);
      // Set the first parking spot as selected by default
      if (sortedParkings.length > 0) {
        setSelectedParking(sortedParkings[0].spot);
        setEndPoint({
          lat: sortedParkings[0].spot.location.coordinates[1],
          lng: sortedParkings[0].spot.location.coordinates[0]
        });
      }
    }
  };

  const handleParkingSelect = (parking) => {
    setSelectedParking(parking);
    setEndPoint({
      lat: parking.location.coordinates[1],
      lng: parking.location.coordinates[0]
    });
  };

  const updateParkingSpots = async (lat, lng) => {
    try {
      // Fetch real parking data from the server
      const realParkingData = await fetchParkingData(lat, lng);
      
      if (realParkingData && realParkingData.length > 0) {
        setParkingSpots(realParkingData);
      } else {
        console.log('No real parking data found');
        setParkingSpots([]);
      }
      
      findNearestParkings({ lat, lng });
    } catch (error) {
      console.error('Error updating parking spots:', error);
      setParkingSpots([]);
      findNearestParkings({ lat, lng });
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
          setStartPoint(location);
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

  const handleSearch = async () => {
    if (!searchLocation.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setStartPoint(location);
        await updateParkingSpots(location.lat, location.lng);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
    setIsSearching(false);
    setLoading(false);
  };

  // Handle 'Book Now' button click
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

  // Load all parking spots on mount
  useEffect(() => {
    async function loadAllParkingSpots() {
      const spots = await fetchAllParkingSpots();
      setAllParkingSpots(spots);
    }
    
    loadAllParkingSpots();
  }, []);

  // On mount, check for location query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const loc = params.get('location');
    if (loc) {
      setIsSearching(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const geo = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
            setStartPoint(geo);
            setUserLocation(geo);
            updateParkingSpots(geo.lat, geo.lng);
          }
        })
        .finally(() => {
          setIsSearching(false);
          setLoading(false);
        });
    } else {
      // If no location is provided, use default Delhi coordinates
      const defaultLat = 28.6139;
      const defaultLng = 77.2090;
      updateParkingSpots(defaultLat, defaultLng);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: if loading is still true after 3 seconds, set it to false
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  return (
    <Box sx={{ height: '100vh', width: '100%', position: 'relative' }}>
      <Container maxWidth="lg" sx={{ height: '100%', py: 4 }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          <Grid item xs={12} md={4}>
            <Box sx={{
              background: '#fff',
              borderRadius: 2,
              boxShadow: 2,
              p: 2,
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}>
              <Typography variant="h4" component="h2" gutterBottom>
                Find Available Parking
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Enter your location or use your current location to find the nearest available parking spots and get directions.
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <TextField
                      fullWidth
                      label="Enter your location"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder="e.g., 123 Main St, City, State"
                      sx={{ mb: { xs: 2, sm: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6} lg={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSearch}
                      disabled={isSearching}
                      sx={{ mb: { xs: 2, sm: 0 } }}
                    >
                      Search
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={6} lg={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<MyLocationIcon />}
                      onClick={handleFindMyLocation}
                      disabled={isSearching}
                    >
                      Find Me
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box 
              sx={{ 
                minHeight: '70vh',
                height: '70vh',
                width: '100%',
                position: 'relative',
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
                  {parkingSpots.map((spot) => (
                    <Marker
                      key={spot._id}
                      position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
                      icon={
                        spot.type === 'government' 
                          ? governmentIcon 
                          : spot.type === 'residential'
                            ? residentialIcon
                            : privateIcon
                      }
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
                          Price: ₹{spot.pricePerHour}/hour
                        </Typography>
                      </Popup>
                    </Marker>
                  ))}
                  {selectedParking && startPoint && endPoint && (
                    <Routing
                      start={startPoint}
                      end={endPoint}
                    />
                  )}
                </MapContainer>
              )}
            </Box>
            
            {/* All Available Parking Spots */}
            {allParkingSpots.length > 0 && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  All Available Parking Spots
                </Typography>
                <Grid container spacing={2}>
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
                            onClick={() => handleParkingSelect(spot)}
                          >
                            View on Map
                          </Button>
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
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ParkingMap;