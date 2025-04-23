/**
 * Server Configuration File
 * Centralizes all configuration values for the server application
 */

require('dotenv').config();

const config = {
  // Server settings
  server: {
    port: process.env.PORT || 5002,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: '/api'
  },
  
  // Database settings
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/parkease',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Authentication settings
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '90d',
    saltRounds: 12
  },
  
  // CORS settings
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;