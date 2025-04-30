import { API_BASE_URL } from '../config/config';

const API_URL = API_BASE_URL || 'http://localhost:5002/api';

// Get user profile
const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user profile');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Get nearby parking lots
const getNearbyParkingLots = async (lat, lng, radius = 5, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    
    let url = `${API_URL}/parking?lat=${lat}&lng=${lng}&distance=${radius}`;
    
    // Add filters if provided
    if (filters.vehicleType) {
      url += `&vehicleType=${filters.vehicleType}`;
    }
    
    if (filters.features && filters.features.length > 0) {
      url += `&features=${filters.features.join(',')}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch nearby parking lots');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching nearby parking lots:', error);
    throw error;
  }
};

// Get user bookings
const getUserBookings = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/bookings/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user bookings');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

// Create new booking
const createBooking = async (bookingData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create booking');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// Cancel booking
const cancelBooking = async (bookingId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel booking');
    }
    
    return data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

// Process payment (simulation)
const processPayment = async (bookingId, paymentDetails) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingId,
        ...paymentDetails
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Payment failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// Update user profile
const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Export all services
export default {
  API_URL,
  getUserProfile,
  getNearbyParkingLots,
  getUserBookings,
  createBooking,
  cancelBooking,
  processPayment,
  updateProfile
};