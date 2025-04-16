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
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HistoryIcon from '@mui/icons-material/History';
import PaymentIcon from '@mui/icons-material/Payment';

const UserDashboard = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setActiveBookings([
        {
          id: 1,
          location: 'Central Parking',
          startTime: '2024-01-20 10:00 AM',
          endTime: '2024-01-20 05:00 PM',
          status: 'Active',
          price: 25.00,
          coordinates: [51.505, -0.09],
        },
      ]);
      setBookingHistory([
        {
          id: 2,
          location: 'Downtown Garage',
          startTime: '2024-01-15 09:00 AM',
          endTime: '2024-01-15 06:00 PM',
          status: 'Completed',
          price: 30.00,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleExtendBooking = (bookingId) => {
    // Implement booking extension logic
    console.log('Extending booking:', bookingId);
  };

  const handleCancelBooking = (bookingId) => {
    // Implement booking cancellation logic
    console.log('Cancelling booking:', bookingId);
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
        {/* User Stats */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DirectionsCarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Active Bookings</Typography>
                <Typography variant="h4">{activeBookings.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <HistoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Bookings</Typography>
                <Typography variant="h4">{activeBookings.length + bookingHistory.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PaymentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Spent</Typography>
                <Typography variant="h4">
                  ${[...activeBookings, ...bookingHistory]
                    .reduce((total, booking) => total + booking.price, 0)
                    .toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Active Bookings Map */}
        {activeBookings.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>Active Parking Locations</Typography>
            <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden' }}>
              <MapContainer
                center={activeBookings[0].coordinates}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {activeBookings.map((booking) => (
                  <Marker key={booking.id} position={booking.coordinates}>
                    <Popup>
                      <Typography variant="subtitle2">{booking.location}</Typography>
                      <Typography variant="body2">Until: {booking.endTime}</Typography>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </Box>
        )}

        {/* Active Bookings Table */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Active Bookings</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.location}</TableCell>
                    <TableCell>{booking.startTime}</TableCell>
                    <TableCell>{booking.endTime}</TableCell>
                    <TableCell>${booking.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleExtendBooking(booking.id)}
                        sx={{ mr: 1 }}
                      >
                        Extend
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Booking History */}
        <Box>
          <Typography variant="h5" gutterBottom>Booking History</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookingHistory.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.location}</TableCell>
                    <TableCell>{booking.startTime}</TableCell>
                    <TableCell>{booking.endTime}</TableCell>
                    <TableCell>${booking.price.toFixed(2)}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </Box>
  );
};

export default UserDashboard;