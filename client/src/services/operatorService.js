import { API_BASE_URL } from '../config/config';

const API_URL = API_BASE_URL || 'http://localhost:5002/api';

// Get all parking lots owned by the operator
const getOperatorLots = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/operators/lots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch operator lots');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching operator lots:', error);
    throw error;
  }
};

// Create a new parking lot
const createLot = async (lotData) => {
  try {
    const token = localStorage.getItem('token');
    
    // Ensure we're setting a valid parking type for operators (government or private)
    if (!lotData.type || lotData.type === 'residential') {
      lotData.type = 'private'; // Default to private if not specified or if residential
    }
    
    // Add extra headers to help with role identification
    console.log('Creating parking with data:', lotData);
    
    const response = await fetch(`${API_URL}/parking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-User-Role': 'operator' // Additional header to help with role identification
      },
      body: JSON.stringify(lotData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Server error creating parking lot:', data);
      throw new Error(data.message || 'Failed to create parking lot');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating parking lot:', error);
    throw error;
  }
};

// Update an existing parking lot
const updateLot = async (lotId, lotData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/parking/${lotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(lotData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update parking lot');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating parking lot:', error);
    throw error;
  }
};

// Delete a parking lot
const deleteLot = async (lotId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/parking/${lotId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete parking lot');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting parking lot:', error);
    throw error;
  }
};

// Get all bookings for the operator's lots
const getOperatorBookings = async (filter = '') => {
  try {
    const token = localStorage.getItem('token');
    let url = `${API_URL}/operators/bookings`;
    if (filter) {
      url += `?status=${filter}`;
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
      throw new Error(data.message || 'Failed to fetch operator bookings');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching operator bookings:', error);
    throw error;
  }
};

// Update booking status (approve/reject)
const updateBookingStatus = async (bookingId, status, comment = '') => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, comment })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update booking status');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Get analytics data for the operator's lots
const getOperatorAnalytics = async (timeframe = 'month') => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/operators/analytics?timeframe=${timeframe}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch operator analytics');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching operator analytics:', error);
    throw error;
  }
};

// Update parking lot availability
const updateLotAvailability = async (lotId, availableSpots) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/parking/${lotId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ availableSpots })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update parking lot availability');
    }
    
    return data;
  } catch (error) {
    console.error('Error updating parking lot availability:', error);
    throw error;
  }
};

const operatorService = {
  getOperatorLots,
  createLot,
  updateLot,
  deleteLot,
  getOperatorBookings,
  updateBookingStatus,
  getOperatorAnalytics,
  updateLotAvailability
};

export default operatorService;