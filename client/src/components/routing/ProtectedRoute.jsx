import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../layout/Navbar';

/**
 * ProtectedRoute component that checks if the user has permission to access a certain route based on their role
 * @param {object} props Component props
 * @param {React.ReactNode} props.children The components to render if access is granted
 * @param {string[]} props.allowedRoles Array of roles allowed to access this route
 * @param {string} props.redirectPath Path to redirect to if access is denied
 */
const ProtectedRoute = ({ children, allowedRoles, redirectPath = '/' }) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && !allowedRoles.includes(userRole)) {
      console.log(`Access denied to ${location.pathname} for role ${userRole}`);
    }
  }, [isAuthenticated, userRole, allowedRoles, location.pathname]);

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user's role is not in the allowed roles, redirect to appropriate dashboard
  if (!allowedRoles.includes(userRole)) {
    let targetPath;
    switch (userRole) {
      case 'operator':
        targetPath = '/operator';
        break;
      case 'residential':
        targetPath = '/residential';
        break;
      default:
        targetPath = '/dashboard';
    }
    return <Navigate to={targetPath} replace />;
  }

  // If all checks pass, render the protected component
  return children;
};

export default ProtectedRoute;