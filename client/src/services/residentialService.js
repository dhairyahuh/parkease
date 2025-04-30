import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const residentialService = {
  getParkingSpaces: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/residential/parking-spaces`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Check if data has the expected structure and normalize it
      if (response.data && response.data.data && response.data.data.parkingSpaces) {
        return response.data.data.parkingSpaces;
      } else if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch parking spaces');
    }
  },

  createParkingSpace: async (parkingSpace) => {
    try {
      const token = localStorage.getItem('token');
      
      // Ensure the type is explicitly set to 'residential' 
      const parkingData = {
        ...parkingSpace,
        type: 'residential' // Explicitly set the type to residential
      };
      
      console.log('Creating residential parking space with data:', parkingData);
      
      const response = await axios.post(`${API_BASE_URL}/residential/parking-spaces`, parkingData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Normalize the response format to match what the component expects
      if (response.data && response.data.data && response.data.data.parking) {
        return { 
          success: true,
          parkingSpace: response.data.data.parking 
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating parking space:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create parking space');
    }
  },

  updateParkingSpace: async (id, parkingSpace) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/residential/parking-spaces/${id}`, parkingSpace, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Normalize the response
      if (response.data && response.data.data && response.data.data.parking) {
        return { 
          success: true,
          parkingSpace: response.data.data.parking 
        };
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update parking space');
    }
  },

  deleteParkingSpace: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/residential/parking-spaces/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete parking space');
    }
  },

  toggleAvailability: async (id, isAvailable) => {
    try {
      if (!id) {
        throw new Error('Parking space ID is required');
      }
      
      const token = localStorage.getItem('token');
      // Convert isAvailable boolean to status string as expected by the backend
      const status = isAvailable ? 'active' : 'inactive';
      
      const response = await axios.patch(`${API_BASE_URL}/residential/parking-spaces/${id}/availability`, {
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Normalize the response
      if (response.data && response.data.data && response.data.data.parking) {
        return { 
          success: true,
          parkingSpace: response.data.data.parking 
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Toggle availability error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update availability');
    }
  },

  // Get all bookings for all residential parking spaces
  getBookings: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/residential/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.data && response.data.data.bookings) {
        return response.data.data.bookings;
      } else if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
    }
  },

  // Update a booking status (approve or reject)
  updateBookingStatus: async (bookingId, status, comment = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/bookings/${bookingId}`, {
        status,
        comment
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.data && response.data.data.booking) {
        return {
          success: true,
          booking: response.data.data.booking
        };
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update booking status');
    }
  }
};

export { residentialService };