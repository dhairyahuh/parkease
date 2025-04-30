const Parking = require('../models/Parking');
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');

// Register a new operator
exports.registerOperator = async (req, res) => {
  try {
    // Logic for registering an operator
    res.status(201).json({
      status: 'success',
      message: 'Operator registered successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

// Login an operator
exports.loginOperator = async (req, res) => {
  try {
    // Logic for operator login
    res.status(200).json({
      status: 'success',
      message: 'Operator logged in successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

// Get operator profile
exports.getOperatorProfile = async (req, res) => {
  try {
    const operator = await User.findById(req.user.id).select('-password');
    
    if (!operator) {
      return res.status(404).json({
        status: 'fail',
        message: 'Operator not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        operator
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

// Update operator profile
exports.updateOperatorProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'phone', 'companyName', 'companyAddress'];
    
    // Filter out fields that are not allowed to be updated
    const filteredBody = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all parking lots owned by the operator
exports.getOperatorLots = async (req, res) => {
  try {
    console.log('getOperatorLots called, user ID:', req.user?.id);
    
    // Safety check for user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized - please log in again'
      });
    }

    // Find parking lots owned by the operator
    const parkingLots = await Parking.find({ 
      operator: req.user.id,
      type: { $in: ['private', 'government'] } 
    }).exec();

    console.log(`Found ${parkingLots.length} parking lots for operator`);

    // Return even if no lots found
    return res.status(200).json({
      status: 'success',
      results: parkingLots.length,
      data: {
        parkingLots
      }
    });
  } catch (err) {
    console.error('Error in getOperatorLots:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'An error occurred while fetching parking lots'
    });
  }
};

// Get all bookings for the operator's parking lots
exports.getOperatorBookings = async (req, res) => {
  try {
    console.log('getOperatorBookings called, user ID:', req.user?.id);
    
    // Safety check for user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized - please log in again'
      });
    }

    // First get all parking spaces owned by the operator
    const parkings = await Parking.find({
      operator: req.user.id,
      type: { $in: ['private', 'government'] }
    }).exec();

    console.log(`Found ${parkings?.length || 0} parking lots for operator`);

    // Return empty array if no parking lots
    if (!parkings || parkings.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          bookings: []
        }
      });
    }

    const parkingIds = parkings.map(parking => parking._id);

    // Build query based on status filter if provided
    let query = { parking: { $in: parkingIds } };
    
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Then get all bookings for those spaces
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('parking', 'name location.address totalSpots availableSpots')
      .sort('-createdAt')
      .exec();

    console.log(`Found ${bookings?.length || 0} bookings`);

    return res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings
      }
    });
  } catch (err) {
    console.error('Error in getOperatorBookings:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'An error occurred while fetching bookings'
    });
  }
};

// Get analytics for operator lots
exports.getOperatorAnalytics = async (req, res) => {
  try {
    console.log('getOperatorAnalytics called, user ID:', req.user?.id);
    
    // Safety check for user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized - please log in again'
      });
    }

    // Get the timeframe from query params or default to 'month'
    const timeframe = req.query.timeframe || 'month';
    console.log('Analytics timeframe:', timeframe);
    
    // Get date range based on timeframe
    let startDate = new Date();
    if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeframe === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get all parking spaces owned by the operator
    const parkings = await Parking.find({
      operator: req.user.id,
      type: { $in: ['private', 'government'] }
    }).exec();

    console.log(`Found ${parkings?.length || 0} parking lots for analytics`);

    // Handle case where operator has no parking lots
    if (!parkings || parkings.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          timeframe,
          totalRevenue: 0,
          totalBookings: 0,
          occupancyRate: 0,
          bookingsPerDay: 0,
          peakHour: [],
          mostBookedLot: null,
          occupancyByLot: [],
          revenueByLot: []
        }
      });
    }

    const parkingIds = parkings.map(parking => parking._id);

    // Get completed bookings for revenue calculation within the timeframe
    const bookings = await Booking.find({
      parking: { $in: parkingIds },
      status: 'completed',
      createdAt: { $gte: startDate }
    }).exec();

    console.log(`Found ${bookings?.length || 0} completed bookings for analytics`);

    // Calculate total revenue
    const totalRevenue = bookings.reduce((acc, booking) => acc + (booking.totalPrice || 0), 0);

    // Calculate occupancy rate
    const totalSpots = parkings.reduce((acc, parking) => acc + (parking.totalSpots || 0), 0);
    const occupiedSpots = parkings.reduce((acc, parking) => 
      acc + ((parking.totalSpots || 0) - (parking.availableSpots || 0)), 0);
    const occupancyRate = totalSpots > 0 ? (occupiedSpots / totalSpots) * 100 : 0;

    // Calculate bookings per day
    const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)) || 1;
    const bookingsPerDay = bookings.length / days;

    // Find peak hours
    const hourCounts = {};
    bookings.forEach(booking => {
      if (booking.startTime) {
        const hour = new Date(booking.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .slice(0, 3);

    // Find most booked parking lot
    const lotBookingCounts = {};
    bookings.forEach(booking => {
      if (booking.parking) {
        const lotId = booking.parking.toString();
        lotBookingCounts[lotId] = (lotBookingCounts[lotId] || 0) + 1;
      }
    });

    let mostBookedLot = null;
    let maxBookings = 0;
    
    for (const [lotId, count] of Object.entries(lotBookingCounts)) {
      if (count > maxBookings) {
        const foundLot = parkings.find(p => p._id.toString() === lotId);
        if (foundLot) {
          mostBookedLot = foundLot;
          maxBookings = count;
        }
      }
    }

    // Calculate occupancy by lot
    const occupancyByLot = parkings.map(lot => ({
      name: lot.name || 'Unnamed Lot',
      totalSpots: lot.totalSpots || 0,
      availableSpots: lot.availableSpots || 0,
      occupancyRate: lot.totalSpots > 0 ? 
        ((lot.totalSpots - (lot.availableSpots || 0)) / lot.totalSpots) * 100 : 0
    }));

    // Calculate revenue by lot
    const revenueByLot = parkings.map(lot => {
      const lotBookings = bookings.filter(b => 
        b.parking && lot._id && b.parking.toString() === lot._id.toString()
      );
      const revenue = lotBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
      return {
        name: lot.name || 'Unnamed Lot',
        revenue,
        bookingCount: lotBookings.length
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        timeframe,
        totalRevenue,
        totalBookings: bookings.length,
        occupancyRate,
        bookingsPerDay,
        peakHour,
        mostBookedLot: mostBookedLot ? {
          id: mostBookedLot._id,
          name: mostBookedLot.name || 'Unnamed Lot',
          bookings: maxBookings
        } : null,
        occupancyByLot,
        revenueByLot
      }
    });
  } catch (err) {
    console.error('Error in getOperatorAnalytics:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'An error occurred while fetching analytics'
    });
  }
};