import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout components
import Navbar, { AuthProvider } from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Views
import GuestHome from './views/guest/GuestHome';
import UserDashboard from './views/user/UserDashboard';
import OperatorDashboard from './views/operator/OperatorDashboard';
import ResidentialDashboard from './views/residential/ResidentialDashboard';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

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
      <CssBaseline />
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
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/operator" element={<OperatorDashboard />} />
              <Route path="/residential" element={<ResidentialDashboard />} />
            </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;