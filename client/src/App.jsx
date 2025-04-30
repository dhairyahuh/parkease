import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Leaflet CSS
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Layout components
import Navbar, { AuthProvider } from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/layout/ErrorBoundary';
import PasswordResetErrorBoundary from './components/auth/PasswordResetErrorBoundary';
import ProtectedRoute from './components/routing/ProtectedRoute';

// Views
import GuestHome from './views/guest/GuestHome';
import UserDashboard from './views/user/UserDashboard';
import AccountSettings from './views/user/AccountSettings';
import OperatorDashboard from './views/operator/OperatorDashboard';
import ResidentialDashboard from './views/residential/ResidentialDashboard';
import ParkingMap from './views/guest/ParkingMap';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <ErrorBoundary>
          <Router>
            <AuthProvider>
              <div className="app">
                <Navbar />
                <main>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<GuestHome />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/search" element={<ParkingMap />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={
                      <PasswordResetErrorBoundary>
                        <ResetPassword />
                      </PasswordResetErrorBoundary>
                    } />
                    
                    {/* User routes - only accessible by regular users */}
                    <Route path="/dashboard/*" element={
                      <ProtectedRoute allowedRoles={['user']}>
                        <UserDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/account" element={
                      <ProtectedRoute allowedRoles={['user', 'operator', 'residential']}>
                        <AccountSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/bookings" element={
                      <ProtectedRoute allowedRoles={['user']}>
                        <UserDashboard />
                      </ProtectedRoute>
                    } />

                    {/* Operator routes - only accessible by operators */}
                    <Route path="/operator/*" element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <OperatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/operator/dashboard" element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <OperatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/operator/spaces" element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <OperatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/operator/bookings" element={
                      <ProtectedRoute allowedRoles={['operator']}>
                        <OperatorDashboard />
                      </ProtectedRoute>
                    } />

                    {/* Residential routes - only accessible by residential owners */}
                    <Route path="/residential/*" element={
                      <ProtectedRoute allowedRoles={['residential']}>
                        <ResidentialDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/residential/dashboard" element={
                      <ProtectedRoute allowedRoles={['residential']}>
                        <ResidentialDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/residential/spaces" element={
                      <ProtectedRoute allowedRoles={['residential']}>
                        <ResidentialDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/residential/bookings" element={
                      <ProtectedRoute allowedRoles={['residential']}>
                        <ResidentialDashboard />
                      </ProtectedRoute>
                    } />

                    {/* Fallback route - redirects to appropriate dashboard based on role */}
                    <Route path="*" element={
                      <Navigate to="/" replace />
                    } />
                  </Routes>
                </main>
                <Footer />
              </div>
            </AuthProvider>
          </Router>
        </ErrorBoundary>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;