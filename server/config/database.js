const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    // Use database configuration from config file
    const { uri, options } = config.database;

    const conn = await mongoose.connect(uri, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;