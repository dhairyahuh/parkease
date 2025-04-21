const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use local MongoDB connection string
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parkease';

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;