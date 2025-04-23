/**
 * Client Configuration File
 * Centralizes all configuration values for the client application
 */

const config = {
  // API settings
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  },
  
  // Authentication settings
  auth: {
    tokenKey: 'parkease_auth_token',
    userKey: 'parkease_user'
  },
  
  // Map settings
  map: {
    defaultCenter: [51.505, -0.09], // Default map center coordinates
    defaultZoom: 13,
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  
  // UI settings
  ui: {
    toastDuration: 3000,
    paginationLimit: 10,
    dateFormat: 'YYYY-MM-DD HH:mm'
  },
  
  // Feature flags
  features: {
    enablePayments: false,
    enableNotifications: false,
    enableRatings: false
  }
};

export default config;