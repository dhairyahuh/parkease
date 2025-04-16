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
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TimelineIcon from '@mui/icons-material/Timeline';

const OperatorDashboard = () => {
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSpace, setNewSpace] = useState({
    name: '',
    address: '',
    totalSpots: '',
    pricePerHour: '',
  });

  // Mock data - Replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      setParkingSpaces([
        {
          id: 1,
          name: 'Central Parking',
          address: '123 Main St',
          totalSpots: 50,
          availableSpots: 30,
          pricePerHour: 5.00,
          coordinates: [51.505, -0.09],
          revenue: 1250.00,
        },
      ]);
      setBookings([
        {
          id: 1,
          parkingSpace: 'Central Parking',
          user: 'John Doe',
          startTime: '2024-01-20 10:00 AM',
          endTime: '2024-01-20 05:00 PM',
          status: 'Active',
          amount: 35.00,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddSpace = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewSpace({
      name: '',
      address: '',
      totalSpots: '',
      pricePerHour: '',
    });
  };

  const handleSubmitSpace = () => {
    // Implement space addition logic
    console.log('Adding new space:', newSpace);
    handleCloseDialog();
  };

  const totalRevenue = parkingSpaces.reduce((sum, space) => sum + space.revenue, 0);
  const totalSpots = parkingSpaces.reduce((sum, space) => sum + space.totalSpots, 0);
  const totalAvailable = parkingSpaces.reduce((sum, space) => sum + space.availableSpots, 0);

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
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MonetizationOnIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                <Typography variant="h4">${totalRevenue.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Parking Spaces Map */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Parking Spaces</Typography>
            <Button variant="contained" color="primary" onClick={handleAddSpace}>
              Add New Space
            </Button>
          </Box>
          <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden' }}>
            <MapContainer
              center={parkingSpaces[0]?.coordinates || [51.505, -0.09]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {parkingSpaces.map((space) => (
                <Marker key={space.id} position={space.coordinates}>
                  <Popup>
                    <Typography variant="subtitle2">{space.name}</Typography>
                    <Typography variant="body2">
                      Available: {space.availableSpots}/{space.totalSpots}
                    </Typography>
                    <Typography variant="body2">
                      ${space.pricePerHour}/hour
                    </Typography>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        </Box>

        {/* Parking Spaces Table */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Parking Space Details</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Total Spots</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Price/Hour</TableCell>
                  <TableCell>Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parkingSpaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell>{space.name}</TableCell>
                    <TableCell>{space.address}</TableCell>
                    <TableCell>{space.totalSpots}</TableCell>
                    <TableCell>{space.availableSpots}</TableCell>
                    <TableCell>${space.pricePerHour}</TableCell>
                    <TableCell>${space.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Recent Bookings */}
        <Box>
          <Typography variant="h5" gutterBottom>Recent Bookings</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Parking Space</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.parkingSpace}</TableCell>
                    <TableCell>{booking.user}</TableCell>
                    <TableCell>{booking.startTime}</TableCell>
                    <TableCell>{booking.endTime}</TableCell>
                    <TableCell>${booking.amount.toFixed(2)}</TableCell>
                    <TableCell>{booking.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Add Space Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Add New Parking Space</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                value={newSpace.name}
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Address"
                value={newSpace.address}
                onChange={(e) => setNewSpace({ ...newSpace, address: e.target.value })}
                fullWidth
              />
              <TextField
                label="Total Spots"
                type="number"
                value={newSpace.totalSpots}
                onChange={(e) => setNewSpace({ ...newSpace, totalSpots: e.target.value })}
                fullWidth
              />
              <TextField
                label="Price per Hour"
                type="number"
                value={newSpace.pricePerHour}
                onChange={(e) => setNewSpace({ ...newSpace, pricePerHour: e.target.value })}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmitSpace} variant="contained" color="primary">
              Add Space
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OperatorDashboard;