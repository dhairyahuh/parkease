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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PersonIcon from '@mui/icons-material/Person';
import CarIcon from '@mui/icons-material/DirectionsCar';

const ResidentialDashboard = () => {
  const [permits, setPermits] = useState([]);
  const [visitorPasses, setVisitorPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newVisitorPass, setNewVisitorPass] = useState({
    visitorName: '',
    vehicleNumber: '',
    duration: '24',
  });

  // Mock data - Replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      setPermits([
        {
          id: 1,
          vehicleNumber: 'ABC123',
          permitType: 'Annual',
          validUntil: '2024-12-31',
          status: 'Active',
          parkingZone: 'Zone A',
          coordinates: [51.505, -0.09],
        },
      ]);
      setVisitorPasses([
        {
          id: 1,
          visitorName: 'Jane Smith',
          vehicleNumber: 'XYZ789',
          issueDate: '2024-01-20',
          validUntil: '2024-01-21',
          status: 'Active',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddVisitorPass = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewVisitorPass({
      visitorName: '',
      vehicleNumber: '',
      duration: '24',
    });
  };

  const handleSubmitVisitorPass = () => {
    // Implement visitor pass creation logic
    console.log('Adding new visitor pass:', newVisitorPass);
    handleCloseDialog();
  };

  const handleRenewPermit = (permitId) => {
    // Implement permit renewal logic
    console.log('Renewing permit:', permitId);
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
        {/* Residential Stats */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Active Permits</Typography>
                <Typography variant="h4">{permits.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Visitor Passes</Typography>
                <Typography variant="h4">{visitorPasses.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocalParkingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Parking Zones</Typography>
                <Typography variant="h4">2</Typography>
                <Typography color="text.secondary">Zone A & B</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Parking Zone Map */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Residential Parking Zones</Typography>
          <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden' }}>
            <MapContainer
              center={permits[0]?.coordinates || [51.505, -0.09]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {permits.map((permit) => (
                <Marker key={permit.id} position={permit.coordinates}>
                  <Popup>
                    <Typography variant="subtitle2">Vehicle: {permit.vehicleNumber}</Typography>
                    <Typography variant="body2">Zone: {permit.parkingZone}</Typography>
                    <Typography variant="body2">Valid until: {permit.validUntil}</Typography>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        </Box>

        {/* Resident Permits */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Your Parking Permits</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle Number</TableCell>
                  <TableCell>Permit Type</TableCell>
                  <TableCell>Parking Zone</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permits.map((permit) => (
                  <TableRow key={permit.id}>
                    <TableCell>{permit.vehicleNumber}</TableCell>
                    <TableCell>{permit.permitType}</TableCell>
                    <TableCell>{permit.parkingZone}</TableCell>
                    <TableCell>{permit.validUntil}</TableCell>
                    <TableCell>{permit.status}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleRenewPermit(permit.id)}
                      >
                        Renew
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Visitor Passes */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Visitor Passes</Typography>
            <Button variant="contained" color="primary" onClick={handleAddVisitorPass}>
              Issue New Pass
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Visitor Name</TableCell>
                  <TableCell>Vehicle Number</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitorPasses.map((pass) => (
                  <TableRow key={pass.id}>
                    <TableCell>{pass.visitorName}</TableCell>
                    <TableCell>{pass.vehicleNumber}</TableCell>
                    <TableCell>{pass.issueDate}</TableCell>
                    <TableCell>{pass.validUntil}</TableCell>
                    <TableCell>{pass.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Issue Visitor Pass Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
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
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmitVisitorPass} variant="contained" color="primary">
              Issue Pass
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ResidentialDashboard;