/**
 * Migration script to fix vehicle details format in existing bookings
 * 
 * This script updates all bookings in the database to ensure their vehicleDetails
 * field matches the updated schema structure.
 * 
 * Run this script with: node server/migrations/fixVehicleDetails.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const Booking = require('../models/Booking');

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('Connected to MongoDB');
    migrateBookings();
  }).catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

async function migrateBookings() {
  try {
    console.log('Starting migration...');
    
    // Get all bookings
    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings to process`);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    // Process each booking
    for (const booking of bookings) {
      try {
        const oldVehicleDetails = booking.vehicleDetails || {};
        let plateNumber = 'Unknown';
        let vehicleType = 'car';

        // Extract plate number from any possible location
        if (oldVehicleDetails.plateNumber) {
          plateNumber = oldVehicleDetails.plateNumber;
        } else if (oldVehicleDetails.number) {
          plateNumber = oldVehicleDetails.number;
        } else if (oldVehicleDetails.type && oldVehicleDetails.type.plateNumber) {
          plateNumber = oldVehicleDetails.type.plateNumber;
        } else if (booking.vehicleNumber) {
          plateNumber = booking.vehicleNumber;
        }

        // Extract vehicle type from any possible location
        if (oldVehicleDetails.vehicleType) {
          vehicleType = oldVehicleDetails.vehicleType;
        } else if (oldVehicleDetails.type && typeof oldVehicleDetails.type === 'string') {
          vehicleType = oldVehicleDetails.type;
        } else if (oldVehicleDetails.type && oldVehicleDetails.type.vehicleType) {
          vehicleType = oldVehicleDetails.type.vehicleType;
        } else if (booking.vehicleType) {
          vehicleType = booking.vehicleType;
        }

        // Update to the new flat structure
        booking.vehicleDetails = {
          plateNumber,
          vehicleType
        };

        // Save directly to database to bypass schema validation
        await booking.save({ validateBeforeSave: false });
        console.log(`Updated booking ${booking._id}: ${plateNumber} - ${vehicleType}`);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update booking ${booking._id}:`, error);
        failedCount++;
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} bookings. Failed: ${failedCount}.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}